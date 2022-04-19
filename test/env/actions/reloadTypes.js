import { doThat } from './userActions/userActions'

export const triggeredByDoThat = (nameOf) => [
  nameOf(doThat)
]
