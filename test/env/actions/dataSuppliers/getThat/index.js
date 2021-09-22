import getThis from '../getThis/index'

export default (resultOf) => {
  return `result of getThat which accessed ${resultOf(getThis)}`
}
