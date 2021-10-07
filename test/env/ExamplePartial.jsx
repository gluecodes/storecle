import { builtInActions, useAppContext } from '@gluecodes/storecle'

import {
  feedWithIncomingData,
  getThat,
  getThis
} from './actions/dataSuppliers'

import { doThat, doThis } from './actions/userActions'

import elementClassNames from './testHelpers/elementClassNames.json'

export default () => {
  const [resultOf, action, nameOf] = useAppContext()

  return (
    <div>
      <h2>Data supplying action results:</h2>
      <ul>
        <li className={elementClassNames.firstDataSupplierResult}>{resultOf(getThis)}</li>
        <li className={elementClassNames.secondDataSupplierResult}>{resultOf(getThat)}</li>
        <li className={elementClassNames.incomingDataSupplierResult}>incoming data: {resultOf(feedWithIncomingData)}</li>
      </ul>
      <h2>User triggered actions:</h2>
      <button
        className={elementClassNames.firstUserActionTrigger}
        onClick={async () => {
          await action(doThis)()
        }}
      >
        Do this
      </button>
      <p className={elementClassNames.firstUserActionResult}>{resultOf(doThis)}</p>
      <button
        className={elementClassNames.secondUserActionTrigger}
        onClick={() => {
          action(doThat)()
        }}
      >
        Do that
      </button>
      <p className={elementClassNames.secondUserActionResult}>{resultOf(doThat)}</p>
      <button
        className={elementClassNames.bulkUserActionTrigger}
        onClick={async () => {
          await action(builtInActions.runUserActions)([
            [nameOf(doThis)],
            [nameOf(doThat)]
          ])
        }}
      >
        Do these
      </button>
      <hr />
      <button
        className={elementClassNames.incomingDataSupplyTrigger}
        onClick={() => {
          global.postMessage('triggerIncomingData')
        }}
      >
        Trigger incoming data event
      </button>
    </div>
  )
}
