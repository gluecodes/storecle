import { builtInActions } from '@gluecodes/storecle'
import { runSquashedDataSuppliers } from '../../reloadTypes'
import squash1 from '../squash1/squash1'
import squash2 from '../squash2/squash2'

const syncWait = (ms) => {
  const end = Date.now() + ms

  while (Date.now() < end) continue
}

export default function squash3(resultOf, nameOf) {
  if (resultOf(builtInActions.runDataSuppliers) !== nameOf(runSquashedDataSuppliers)) {
    return resultOf(squash3)
  }

  syncWait(500)
  return `${resultOf(squash1)}, ${resultOf(squash2)}, result of squash3`
}
