const FRAMEWORK = {
  react: 'react',
  solid: 'solid'
}

export const adaptForReact = (updateStore, storeRef) => ({
  framework: FRAMEWORK.react,
  updateStore: (keyName, result) => {
    if (typeof keyName === 'function') {
      updateStore({
        type: 'bulkUpdate',
        result: keyName(storeRef.store)
      })
    } else if (keyName === 'runDataSuppliers') {
      storeRef.store[keyName] = result
    } else {
      storeRef.store[keyName] = result // React's Automatic Batching doesn't update store immediately, therefore modify ref which is passed among data suppliers
      updateStore({ type: keyName, result })
    }
  }
})

export const adaptForSolid = (updateStore) => ({
  framework: FRAMEWORK.solid,
  updateStore: (keyName, result) => {
    if (typeof keyName === 'function') {
      updateStore(keyName)
    } else {
      updateStore(keyName, result)
    }
  }
})

export const builtInActions = {
  getUserActionsBeingExecuted: [],
  onStoreChanged: null,
  runUserActions: null,
  runDataSuppliers: null
}

export default ({
  dataSupplierPipeline,
  dataSuppliers,
  handleError,
  reloadTypes,
  storeRef,
  updateStore,
  userActions,
  userActionsBeingExecuted,
  framework
}) => {
  const storeChangedEventTarget = new EventTarget()
  const storeChangedEventListeners = []
  const userActionCounts = {}
  const syncSupplierUpdates = []
  let shouldAbortDataSuppliers = false

  const userActionsProxy = new Proxy(
    {},
    {
      get:
        (_, actionName) =>
        (...args) => {
          try {
            if (builtInActions[actionName]) {
              return builtInActions[actionName](...args)
            }

            const actionBeingExecuted = userActions[actionName](...args)

            userActionsBeingExecuted.push(actionName)
            userActionCounts[actionName] = ++userActionCounts[actionName] || 1

            if (actionBeingExecuted instanceof Promise) {
              return actionBeingExecuted
                .then((result) => {
                  setInStore(actionName, userActionCounts[actionName])

                  return result
                })
                .catch(handleError)
            }

            setInStore(actionName, userActionCounts[actionName])

            return actionBeingExecuted
          } catch (err) {
            handleError(err)
          }
        }
    }
  )

  const setInStore = (actionName, result) => {
    updateStore(actionName, result)
    storeChangedEventTarget.dispatchEvent(
      new CustomEvent('storeChanged', {
        detail: {
          affectedKeys: [actionName]
        }
      })
    )
  }

  const liveDataSuppliers = {
    initialized: [],
    promises: {},
    resolvers: {}
  }

  const incomingDataProvided = (actionName, result) => {
    liveDataSuppliers.resolvers[actionName](result)
    setInStore(actionName, result)
  }

  const getNameOfAction = (action) =>
    Object.keys(dataSuppliers).find((actionName) => dataSuppliers[actionName] === action) ||
    Object.keys(userActions).find((actionName) => userActions[actionName] === action) ||
    Object.keys(builtInActions).find((actionName) => builtInActions[actionName] === action) ||
    Object.keys(reloadTypes).find((actionName) => reloadTypes[actionName] === action)

  const getActionResult = (action) => {
    const actionName =
      Object.keys(dataSuppliers).find((actionName) => dataSuppliers[actionName] === action) ||
      Object.keys(userActions).find((actionName) => userActions[actionName] === action) ||
      Object.keys(builtInActions).find((actionName) => builtInActions[actionName] === action)

    if (actionName === 'getUserActionsBeingExecuted') {
      return userActionsBeingExecuted
    }

    const syncUpdate =
      framework === FRAMEWORK.react && syncSupplierUpdates.find(({ keyName }) => keyName === actionName)

    if (syncUpdate) {
      return syncUpdate.result
    }

    return storeRef.store[actionName]
  }

  const dispatchAction = (action) => {
    const actionName =
      Object.keys(userActions).find((actionName) => userActions[actionName] === action) ||
      Object.keys(builtInActions).find((actionName) => builtInActions[actionName] === action)

    return userActionsProxy[actionName]
  }

  const squashSyncSupplierCalls = () => {
    if (syncSupplierUpdates.length > 0) {
      setInStore((store) => ({
        ...store,
        ...syncSupplierUpdates.reduce((acc, { keyName, result }) => Object.assign(acc, { [keyName]: result }), {})
      }))

      syncSupplierUpdates.length = 0
    }
  }

  const runDataSuppliers = async (reloadType = 'full') => {
    setInStore('runDataSuppliers', reloadType)

    try {
      for (const action of dataSupplierPipeline) {
        if (shouldAbortDataSuppliers) {
          return
        }

        const actionName = Object.keys(dataSuppliers).find((actionName) => dataSuppliers[actionName] === action)
        const actionBeingExecuted = dataSuppliers[actionName](getActionResult, getNameOfAction)

        if (actionBeingExecuted instanceof Promise) {
          setInStore(actionName, await actionBeingExecuted)
        } else if (typeof actionBeingExecuted === 'function') {
          liveDataSuppliers.promises[actionName] = new Promise((resolve, reject) => {
            setTimeout(
              () =>
                reject(
                  new Error(
                    `UI data supplier: '${actionName}' didn't resolve within 20s, make sure all its preceding suppliers exist in the UI data supplier pipeline.`
                  )
                ),
              20000
            )
            liveDataSuppliers.resolvers[actionName] = resolve
          })
          actionBeingExecuted({
            asyncResults: liveDataSuppliers.promises,
            hasBeenInitialized: liveDataSuppliers.initialized.includes(actionName),
            supply: (data) => incomingDataProvided(actionName, data)
          })
          liveDataSuppliers.initialized.push(actionName)
        } else {
          if (framework === FRAMEWORK.react) {
            syncSupplierUpdates.push({ keyName: actionName, result: actionBeingExecuted })
          } else {
            setInStore(actionName, actionBeingExecuted)
          }
        }
      }

      storeChangedEventTarget.dispatchEvent(
        new CustomEvent('storeChanged', {
          detail: {
            affectedKeys: Object.keys(dataSuppliers).filter((actionName) =>
              dataSupplierPipeline.find((action) => action === dataSuppliers[actionName])
            )
          }
        })
      )
    } catch (err) {
      handleError(err)
    }
  }

  const cleanup = () => {
    shouldAbortDataSuppliers = true
    storeChangedEventListeners.forEach((listener) => {
      storeChangedEventTarget.removeEventListener('storeChanged', listener)
    })
  }

  Object.assign(builtInActions, {
    onStoreChanged: (handler) => {
      storeChangedEventTarget.addEventListener(
        'storeChanged',
        storeChangedEventListeners[storeChangedEventListeners.push(handler) - 1]
      )
    },
    runUserActions: async (actions) => {
      try {
        const userActionResults = {}

        for (const itemToRun of actions) {
          const [actionName, ...args] = itemToRun
          const actionBeingExecuted = userActions[actionName](...args)

          userActionCounts[actionName] = ++userActionCounts[actionName] || 1

          if (actionBeingExecuted instanceof Promise) {
            await actionBeingExecuted
          }

          userActionResults[actionName] = userActionCounts[actionName]
        }

        updateStore((actionResults) => ({
          ...actionResults,
          ...userActionResults
        }))

        storeChangedEventTarget.dispatchEvent(
          new CustomEvent('storeChanged', {
            detail: {
              affectedKeys: actions.map(([actionName]) => actionName)
            }
          })
        )
      } catch (err) {
        handleError(err)
      }
    },
    runDataSuppliers
  })

  return {
    context: [getActionResult, dispatchAction, getNameOfAction, cleanup],
    nameOf: getNameOfAction,
    runDataSuppliers,
    squashRemainingSyncSupplierCalls: squashSyncSupplierCalls
  }
}
