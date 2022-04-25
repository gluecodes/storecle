/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useMemo, useReducer, useRef } from 'react'

import initPage, { adaptForReact } from '../common/index'
import { AppProvider } from './appContext'

const reducer = (state, action) => {
  if (action.type === 'bulkUpdate') {
    return {
      ...state,
      ...action.result
    }
  }

  return {
    ...state,
    [action.type]: action.result
  }
}

export default ({
  dataSupplierPipeline,
  dataSuppliers,
  getLayout,
  initialState = {},
  reloadTypes,
  userActions,
  onError
}) => {
  const [store, updateStore] = useReducer(reducer, {
    ...initialState
  })

  const userActionsBeingExecutedRef = useRef([])
  const storeRef = useRef({ store })

  const { context, nameOf, runDataSuppliers } = useMemo(
    () =>
      initPage({
        dataSupplierPipeline,
        dataSuppliers,
        handleError: onError,
        reloadTypes,
        storeRef: storeRef.current,
        userActions,
        userActionsBeingExecuted: userActionsBeingExecutedRef.current,
        ...adaptForReact(updateStore, storeRef.current)
      }),
    []
  )

  useEffect(
    () => {
      const run = async () => {
        await Promise.resolve() // ensures storeRef gets updated correctly when 1st supplier is sync

        const reloadType = Object.keys(reloadTypes).find((type) =>
          reloadTypes[type](nameOf).some(
            (actionName) =>
              userActionsBeingExecutedRef.current?.[0] === actionName && storeRef.current.store[actionName]
          )
        )

        if (reloadType || !storeRef.current.store.runDataSuppliers) {
          runDataSuppliers(reloadType)
        }
      }

      run().then(() => {
        userActionsBeingExecutedRef.current.shift()
      })
    },
    Object.keys(userActions).map((actionName) => store[actionName])
  )

  if (storeRef.current.store !== store) {
    storeRef.current.store = store
  }

  return <AppProvider value={context}>{React.createElement(getLayout())}</AppProvider>
}
