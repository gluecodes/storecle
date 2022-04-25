import { builtInActions } from '@gluecodes/storecle'
import { runSquashedDataSuppliers } from '../../reloadTypes'

export default function squash1(resultOf, nameOf) {
  if (resultOf(builtInActions.runDataSuppliers) !== nameOf(runSquashedDataSuppliers)) {
    return resultOf(squash1)
  }

  return 'result of squash1'
}
