import { builtInActions, useAppContext } from '@gluecodes/storecle'

import {
  feedWithIncomingData,
  getThat,
  getThis,
  squash1,
  squash2,
  squash3
} from './actions/dataSuppliers/dataSuppliers'

import { doThat, doThis, triggerSquashedDataSuppliers } from './actions/userActions/userActions'

import elementClassNames from './testHelpers/elementClassNames.json'

export default () => {
  const [resultOf, action, nameOf] = useAppContext()

  return (
    <div>
      <h2>Data supplying action results:</h2>
      <ul>
        <li className={elementClassNames.firstDataSupplierResult}>{resultOf(getThis)}</li>
        <li className={elementClassNames.secondDataSupplierResult}>{resultOf(getThat)}</li>
        <li className={elementClassNames.incomingDataSupplierResult}>
          incoming data: {resultOf(feedWithIncomingData)}
        </li>
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
          await action(builtInActions.runUserActions)([[nameOf(doThis)], [nameOf(doThat)]])
        }}
      >
        Do these
      </button>
      <p className={elementClassNames.squashedSupplierCallActionResult}>
        {resultOf(squash1)} | {resultOf(squash2)} | {resultOf(squash3)}
      </p>
      <button
        className={elementClassNames.triggerSquashedDataSuppliers}
        onClick={async () => {
          await action(triggerSquashedDataSuppliers)()
        }}
      >
        Trigger squashed data suppliers
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
