export const adaptForReact = (updateStore, store) => ({
  updateStore: (keyName, result) => {
    if (typeof keyName === 'function') {
      Object.assign(store, keyName(store))
      updateStore({
        ...store
      })
    } else {
      store[keyName] = result
      updateStore({ ...store })
    }
  }
})

export const adaptForSolid = (updateStore) => ({
  updateStore: (keyName, result) => {
    if (typeof keyName === 'function') {
      updateStore(keyName)
    } else {
      updateStore(keyName, result)
    }
  }
})

export const builtInActions = {
  onStoreChanged: null,
  runUserActions: null,
  runDataSuppliers: null
}

export default ({
  dataSupplierPipeline,
  dataSuppliers,
  handleError,
  initialStore = {},
  reloadTypes,
  updateStore,
  userActions
}) => {
  const storeChangedEventTarget = new EventTarget()
  const storeChangedEventListeners = []
  const store = initialStore
  const userActionCounts = {}
  let shouldAbortDataSuppliers = false

  const userActionsProxy = new Proxy(
    {},
    {
      get: (_, actionName) => (...args) => {
        try {
          if (builtInActions[actionName]) {
            return builtInActions[actionName](...args)
          }

          const actionBeingExecuted = userActions[actionName](...args)

          setInStore('userActionBeingExecuted', actionName)

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
    Object.keys(dataSuppliers).find(
      (actionName) => dataSuppliers[actionName] === action
    ) ||
    Object.keys(userActions).find(
      (actionName) => userActions[actionName] === action
    ) ||
    Object.keys(builtInActions).find(
      (actionName) => builtInActions[actionName] === action
    ) ||
    Object.keys(reloadTypes).find(
      (actionName) => reloadTypes[actionName] === action
    )

  const getActionResult = (action) => {
    const actionName =
      Object.keys(dataSuppliers).find(
        (actionName) => dataSuppliers[actionName] === action
      ) ||
      Object.keys(userActions).find(
        (actionName) => userActions[actionName] === action
      ) ||
      Object.keys(builtInActions).find(
        (actionName) => builtInActions[actionName] === action
      )

    return store[actionName]
  }

  const dispatchAction = (action) => {
    const actionName =
      Object.keys(userActions).find(
        (actionName) => userActions[actionName] === action
      ) ||
      Object.keys(builtInActions).find(
        (actionName) => builtInActions[actionName] === action
      )

    return userActionsProxy[actionName]
  }

  const runDataSuppliers = async (reloadType = 'full') => {
    setInStore('runDataSuppliers', reloadType)

    try {
      for (const action of dataSupplierPipeline) {
        if (shouldAbortDataSuppliers) {
          return
        }

        const actionName = Object.keys(dataSuppliers).find(
          (actionName) => dataSuppliers[actionName] === action
        )

        const actionBeingExecuted = dataSuppliers[actionName](
          getActionResult,
          getNameOfAction
        )

        if (actionBeingExecuted instanceof Promise) {
          setInStore(actionName, await actionBeingExecuted)
        } else if (typeof actionBeingExecuted === 'function') {
          liveDataSuppliers.promises[actionName] = new Promise(
            (resolve, reject) => {
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
            }
          )
          actionBeingExecuted({
            asyncResults: liveDataSuppliers.promises,
            hasBeenInitialized: liveDataSuppliers.initialized.includes(
              actionName
            ),
            supply: (data) => incomingDataProvided(actionName, data)
          })
          liveDataSuppliers.initialized.push(actionName)
        } else {
          setInStore(actionName, actionBeingExecuted)
        }
      }

      storeChangedEventTarget.dispatchEvent(
        new CustomEvent('storeChanged', {
          detail: {
            affectedKeys: Object.keys(dataSuppliers).filter((actionName) =>
              dataSupplierPipeline.find(
                (action) => action === dataSuppliers[actionName]
              )
            )
          }
        })
      )
    } catch (err) {
      handleError(err)
    }
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

          if (actionBeingExecuted instanceof Promise) {
            userActionResults[actionName] = await actionBeingExecuted
          } else {
            userActionResults[actionName] = actionBeingExecuted
          }
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
    context: [getActionResult, dispatchAction, getNameOfAction],
    runDataSuppliers,
    nameOf: getNameOfAction,
    cleanup: () => {
      shouldAbortDataSuppliers = true
      storeChangedEventListeners.forEach((listener) => {
        storeChangedEventTarget.removeEventListener('storeChanged', listener)
      })
    }
  }
}
