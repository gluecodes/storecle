import { createEffect, onCleanup } from 'solid-js'
import { createStore } from 'solid-js/store'

import initPage, { adaptForSolid } from '../common/index'
import { AppProvider } from './appContext'

export default ({
  dataSupplierPipeline,
  dataSuppliers,
  initialState = {},
  getLayout,
  reloadTypes,
  userActions,
  onError
}) => {
  const [store, updateStore] = createStore({
    actionResults: {
      ...initialState
    }
  })

  const { cleanup, context, nameOf, runDataSuppliers } = initPage({
    handleError: onError,
    initialStore: store,
    reloadTypes,
    dataSupplierPipeline,
    dataSuppliers,
    userActions,
    ...adaptForSolid(updateStore, store)
  })

  runDataSuppliers()

  createEffect(() => {
    const reloadType = Object.keys(reloadTypes).find((type) =>
      reloadTypes[type](nameOf).some(
        (actionName) =>
          store.actionResults.userActionBeingExecuted === actionName &&
          store.actionResults[actionName]
      )
    )

    if (reloadType) {
      runDataSuppliers(reloadType)
    }
  })

  onCleanup(() => cleanup())

  return <AppProvider value={context}>{getLayout()}</AppProvider>
}
