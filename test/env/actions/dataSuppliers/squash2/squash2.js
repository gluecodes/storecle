import { builtInActions } from '@gluecodes/storecle'
import { runSquashedDataSuppliers } from '../../reloadTypes'
import squash1 from '../squash1/squash1'

const syncWait = (ms) => {
  const end = Date.now() + ms

  while (Date.now() < end) continue
}

export default function squash2(resultOf, nameOf) {
  if (resultOf(builtInActions.runDataSuppliers) !== nameOf(runSquashedDataSuppliers)) {
    return resultOf(squash2)
  }

  syncWait(500)
  return `${resultOf(squash1)}, result of squash2`
}
