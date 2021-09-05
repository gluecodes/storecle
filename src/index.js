export const adaptForReact = (updateStore, store) => ({
  updateStore: (keyName, result) => {
    if (keyName === "actionResults") {
      Object.assign(store.actionResults, result(store.actionResults));
      updateStore({
        ...store
      });
    } else {
      store.actionResults[keyName] = result;
      updateStore({ ...store });
    }
  }
});

export const adaptForSolid = (updateStore) => ({
  updateStore: (keyName, result, ...rest) => {
    if (keyName === "actionResults") {
      updateStore(keyName, result, ...rest);
    } else if (result?.constructor.name === "Object") {
      updateStore("actionResults", (actionResults) => ({
        ...actionResults,
        [keyName]: result
      }));
    } else {
      updateStore("actionResults", keyName, result);
    }
  }
});

export default ({
  handleError,
  initialStore = {},
  uiDataSupplierPipeline,
  uiDataSuppliers,
  updateStore,
  userActions
}) => {
  const store = initialStore;
  const storeChangedEvent = new EventTarget();
  const builtInActions = {
    onStoreChanged: (handler) => {
      storeChangedEvent.addEventListener("storeChanged", handler);
    },
    runUserActions: async (actions) => {
      try {
        const userActionResults = {};

        for (const itemToRun of actions) {
          const [actionName, ...args] = itemToRun;
          const actionBeingExecuted = userActions[actionName](...args);

          if (actionBeingExecuted instanceof Promise) {
            userActionResults[actionName] = await actionBeingExecuted;
          } else {
            userActionResults[actionName] = actionBeingExecuted;
          }
        }

        updateStore("actionResults", (actionResults) => ({
          ...actionResults,
          ...userActionResults
        }));

        storeChangedEvent.dispatchEvent(
          new CustomEvent("storeChanged", {
            detail: {
              affectedKeys: actions.map(([actionName]) => actionName)
            }
          })
        );
      } catch (err) {
        handleError(err);
      }
    }
  };
  const userActionsProxy = new Proxy(
    {},
    {
      get: (_, actionName) => (...args) => {
        try {
          if (builtInActions[actionName]) {
            return builtInActions[actionName](...args);
          }

          const actionBeingExecuted = userActions[actionName](...args);

          if (actionBeingExecuted instanceof Promise) {
            setInStore("userActionBeingExecuted", actionName);
            return actionBeingExecuted
              .then((result) => {
                setInStore(actionName, result);
                return result;
              })
              .catch(handleError);
          }

          setInStore(actionName, actionBeingExecuted);
          return actionBeingExecuted;
        } catch (err) {
          handleError(err);
        }
      }
    }
  );
  const setInStore = (actionName, result) => {
    updateStore(actionName, result);
    storeChangedEvent.dispatchEvent(
      new CustomEvent("storeChanged", {
        detail: {
          affectedKeys: [actionName]
        }
      })
    );
  };
  const liveUiDataSuppliers = {
    initialized: [],
    promises: {},
    resolvers: {}
  };
  const incomingDataProvided = (actionName, result) => {
    liveUiDataSuppliers.resolvers[actionName](result);
    setInStore(actionName, result);
  };

  setInStore("getBuiltInActions", builtInActions);

  return {
    context: [store.actionResults, userActionsProxy],
    runUiDataSuppliers: async (reloadType = "full") => {
      setInStore("reloadUiDataSuppliers", reloadType);

      for (const actionName of uiDataSupplierPipeline) {
        const actionBeingExecuted = uiDataSuppliers[actionName](
          store.actionResults
        );

        if (actionBeingExecuted instanceof Promise) {
          setInStore(actionName, await actionBeingExecuted);
        } else if (typeof actionBeingExecuted === "function") {
          liveUiDataSuppliers.promises[actionName] = new Promise(
            (resolve, reject) => {
              setTimeout(
                () =>
                  reject(
                    new Error(
                      `UI data supplier: '${actionName}' didn't resolve within 20s, make sure all its preceding suppliers exist in the UI data supplier pipeline.`
                    )
                  ),
                20000
              );
              liveUiDataSuppliers.resolvers[actionName] = resolve;
            }
          );
          actionBeingExecuted({
            asyncResults: liveUiDataSuppliers.promises,
            hasBeenInitialized: liveUiDataSuppliers.initialized.includes(
              actionName
            ),
            provide: (data) => incomingDataProvided(actionName, data)
          });
          liveUiDataSuppliers.initialized.push(actionName);
        } else {
          setInStore(actionName, actionBeingExecuted);
        }
      }

      storeChangedEvent.dispatchEvent(
        new CustomEvent("storeChanged", {
          detail: {
            affectedKeys: uiDataSupplierPipeline
          }
        })
      );
    }
  };
};
