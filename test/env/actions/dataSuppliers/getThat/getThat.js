import getThis from '../getThis/getThis'
import appChangeHistorySnapshotTypes from '../../../testHelpers/appChangeHistorySnapshotTypes.json'

export default (resultOf) => {
  global.sessionStorage.setItem(
    appChangeHistorySnapshotTypes.secondDataSupplierTriggers,
    +global.sessionStorage.getItem(
      appChangeHistorySnapshotTypes.secondDataSupplierTriggers
    ) + 1
  )

  return `result of getThat which accessed ${resultOf(getThis)}`
}
