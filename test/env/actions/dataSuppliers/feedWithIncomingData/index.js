import { builtInActions } from '../../../../../src/index'

const COUNTER_INITIAL_VALUE = 10

export default function feedWithIncomingData (resultOf) {
  return ({ hasBeenInitialized, provide }) => {
    if (!hasBeenInitialized) {
      builtInActions.onStoreChanged((e) => {
        // console.log(e.detail.affectedKeys)
      })

      let count = COUNTER_INITIAL_VALUE

      const interval = setInterval(() => {
        provide(count)
        count -= 1

        if (count < 1) {
          clearInterval(interval)
        }
      }, 1000)
    }

    provide(resultOf(feedWithIncomingData) || COUNTER_INITIAL_VALUE)
  }
}
