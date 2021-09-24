import { builtInActions } from '../../../../../src/common/index'
import { triggeredByDoThat } from '../../reloadTypes'

export default async function getThis (resultOf, nameOf) {
  if (resultOf(builtInActions.runDataSuppliers) === nameOf(triggeredByDoThat)) {
    return resultOf(getThis)
  }

  return 'result of getThis'
}
