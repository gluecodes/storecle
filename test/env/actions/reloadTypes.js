import { doThat, triggerSquashedDataSuppliers } from './userActions/userActions'

export const triggeredByDoThat = (nameOf) => [nameOf(doThat)]

export const runSquashedDataSuppliers = (nameOf) => [nameOf(triggerSquashedDataSuppliers)]
