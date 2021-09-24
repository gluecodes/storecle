import { builtInActions } from '../../src/common/index'
import { useAppContext } from 'appContext'

import {
  feedWithIncomingData,
  getThat,
  getThis
} from './actions/dataSuppliers'

import { doThat, doThis } from './actions/userActions'

export default () => {
  const [resultOf, action, nameOf] = useAppContext()

  return (
    <div>
      <h2>UI data supplying action results:</h2>
      <ul>
        <li>{resultOf(getThis)}</li>
        <li>{resultOf(getThat)}</li>
        <li>incoming data: {resultOf(feedWithIncomingData)}</li>
      </ul>
      <h2>User triggered actions:</h2>
      <button
        onClick={async () => {
          await action(doThis)()
        }}
      >
        Do this
      </button>
      <p>{resultOf(doThis)}</p>
      <button
        onClick={() => {
          action(doThat)()
        }}
      >
        Do that
      </button>
      <p>{resultOf(doThat)}</p>
      <button
        onClick={async () => {
          await action(builtInActions.runUserActions)([
            [nameOf(doThis)],
            [nameOf(doThat)]
          ])
        }}
      >
        Do these
      </button>
    </div>
  )
}
