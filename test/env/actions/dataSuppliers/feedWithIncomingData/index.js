import { builtInActions } from '../../../../../src/common/index'
import appChangeHistorySnapshotTypes from '../../../testHelpers/appChangeHistorySnapshotTypes.json'

const COUNTER_INITIAL_VALUE = 10

export default function feedWithIncomingData (resultOf) {
  return ({ hasBeenInitialized, supply }) => {
    if (!hasBeenInitialized) {
      builtInActions.onStoreChanged((e) => {
        // console.log(e.detail.affectedKeys)
      })

      let count = COUNTER_INITIAL_VALUE

      global.addEventListener('message', (e) => {
        if (e.data === 'triggerIncomingData') {
          count -= 1
          supply(count)
        }
      })

      global.sessionStorage.setItem(
        appChangeHistorySnapshotTypes.incomingDataSupplierInitializations,
        +global.sessionStorage.getItem(appChangeHistorySnapshotTypes.incomingDataSupplierInitializations) + 1
      )
    }

    supply(resultOf(feedWithIncomingData) || COUNTER_INITIAL_VALUE)
  }
}
