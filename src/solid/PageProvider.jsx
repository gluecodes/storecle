import { createEffect } from 'solid-js'
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
    ...initialState
  })

  const userActionsBeingExecuted = []

  const { context, nameOf, runDataSuppliers } = initPage({
    handleError: onError,
    reloadTypes,
    storeRef: { store },
    dataSupplierPipeline,
    dataSuppliers,
    userActions,
    userActionsBeingExecuted,
    ...adaptForSolid(updateStore)
  })

  runDataSuppliers()

  createEffect(() => {
    Object.keys(userActions).forEach((actionName) => store[actionName])

    const reloadType = Object.keys(reloadTypes).find((type) =>
      reloadTypes[type](nameOf).some((actionName) => userActionsBeingExecuted?.[0] === actionName && store[actionName])
    )

    if (reloadType) {
      runDataSuppliers(reloadType).then(() => userActionsBeingExecuted.shift())
    }
  })

  return <AppProvider value={context}>{getLayout()}</AppProvider>
}
