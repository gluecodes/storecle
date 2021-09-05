# Storecle

A neat uni-directional app state management for [React](https://reactjs.org/) and [Solid](https://www.solidjs.com/).

The core part of the library is mature and has been used to develop a complex project as an online IDE -  [GlueCodes Studio](https://www.glue.codes).
However, it requires a good documentation and examples which should start appearing in up-coming weeks. For now, I've created these two examples:

- [React Example](https://codesandbox.io/s/ecstatic-night-pzrbl?file=/src/App.js)
- [Solid Example](https://codesandbox.io/s/late-leaf-918jy?file=/src/App.js)

## Features

Storecle uses a simple mental model which lets you access app-wide actions and their results by using Context API.
It consists of 3 building blocks i.e. Store, User Actions (actions triggered by a user) and UI Data Suppliers (actions executed prior to rendering).
The actions are just functions which are implicitly bound to the Store and write their results by returning/resolving.
Then, in Store their results are accessible by the action names.

To improve the code re-usability, UI Data Suppliers use a middleware pattern. They are executed in the order you specify and pass a snapshot of Store from one to another, letting you split the logic into small, specified functions.

- it works with both [React](https://reactjs.org/) and [Solid](https://www.solidjs.com/)
- it uses Context API and `useEffect` to provide action re-triggers based on specified Store changes
- it uses a middleware pattern for the actions which need to run prior to rendering 
- it simplifies naming and reduces noise by letting you access action results by their own names
- it provides an elegant approach to actions feeding UI with incoming data (e.g. from Web Sockets)

### Trivial Example

Somewhere in UI:

```jsx
import { useAppContext } from "../init/appContext"; // imaginary path

export default () => {
  const [actionResults, actions] = useAppContext()
  
  return (
    <button
      onClick={() => {
        actions.incrementAppWideCounter(
          actionResults.incrementAppWideCounter
        )
      }}
    >Click: {actionResults.incrementAppWideCounter || 0}</button>
  )
}
```

`incrementAppWideCounter()`:

```javascript
export default (counter = 0) => counter + 1
```

## License

MIT
