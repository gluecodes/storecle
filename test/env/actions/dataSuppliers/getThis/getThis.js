import { builtInActions } from '@gluecodes/storecle'

import { triggeredByDoThat } from '../../reloadTypes'
import appChangeHistorySnapshotTypes from '../../../testHelpers/appChangeHistorySnapshotTypes.json'

export default async function getThis(resultOf, nameOf) {
  global.sessionStorage.setItem(
    appChangeHistorySnapshotTypes.firstDataSupplierTriggers,
    +global.sessionStorage.getItem(appChangeHistorySnapshotTypes.firstDataSupplierTriggers) + 1
  )

  if (resultOf(builtInActions.runDataSuppliers) === nameOf(triggeredByDoThat)) {
    global.sessionStorage.setItem(
      appChangeHistorySnapshotTypes.firstDataSupplierCachedResults,
      +global.sessionStorage.getItem(appChangeHistorySnapshotTypes.firstDataSupplierCachedResults) + 1
    )

    return resultOf(getThis)
  }

  return 'result of getThis'
}
