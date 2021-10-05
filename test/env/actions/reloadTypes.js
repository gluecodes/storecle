import { doThat } from './userActions/index'

export const triggeredByDoThat = (nameOf) => [
  nameOf(doThat)
]
