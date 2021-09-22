/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useMemo, useState } from 'react'

import initPage, { adaptForReact } from '../index'
import { AppProvider } from './appContext'

export default ({
  dataSupplierPipeline,
  dataSuppliers,
  getLayout,
  initialState = {},
  reloadTypes,
  userActions,
  onError
}) => {
  const [store, updateStore] = useState({
    actionResults: {
      ...initialState
    }
  })

  const { cleanup, context, nameOf, runDataSuppliers } = useMemo(
    () =>
      initPage({
        dataSupplierPipeline,
        dataSuppliers,
        handleError: onError,
        initialStore: store,
        reloadTypes,
        userActions,
        ...adaptForReact(updateStore, store)
      }),
    []
  )

  useEffect(
    () => {
      const reloadType = Object.keys(reloadTypes).find((type) =>
        reloadTypes[type](nameOf).some(
          (actionName) =>
            store.actionResults.userActionBeingExecuted === actionName &&
            store.actionResults[actionName]
        )
      )

      runDataSuppliers(reloadType)
    },
    Array.from(
      new Set(
        Object.keys(reloadTypes).reduce(
          (acc, type) => acc.concat(reloadTypes[type](nameOf)),
          []
        )
      )
    ).map((actionName) => store.actionResults[actionName])
  )

  useEffect(() => () => cleanup(), [global.location.pathname, cleanup])

  return (
    <AppProvider value={context}>
      {React.createElement(getLayout())}
    </AppProvider>
  )
}
