# Storecle

**@gluecodes/storecle**

A neat uni-directional app state management for [React](https://reactjs.org/) and [Solid](https://www.solidjs.com/) (:heart:).

## Features

Storecle uses a simple mental model which lets you access app-wide actions and their results by using Context API.
It consists of 4 main building blocks i.e. Store, User Actions (actions triggered by a user), Data Suppliers (actions executed prior to rendering) and Reload Types (action re-trigger groups).
The actions are just functions which are implicitly bound to the Store and write their results by returning/resolving.
Then, their results are accessible by their own names.

To improve the code re-usability, Data Suppliers use a middleware pattern. They are executed in the order you specify and pass a snapshot of Store from one to another, letting you split the logic into small, specified functions.

- It works with both [React](https://reactjs.org/) and [Solid](https://www.solidjs.com/).
- It uses Context API and `useEffect` to provide action re-triggers based on specified Store changes.
- It uses a middleware pattern for the actions which need to run prior to rendering.
- It simplifies naming and reduces noise by letting you access action results by their own names.
- It provides an elegant approach to actions feeding UI with incoming data (e.g. from Web Sockets).
- It is made to work with your IDE's code auto-completion.

## Motivation

I :heart: Redux, but it leaves plenty of room to be misused. Hence, Storecle is my proposal to let developers rely less on self-discipline and more on tooling and self-restrictive design.

1. To provide an easy way of separating app-wide logic from views i.e.:
    - No inline: data fetches, transformers, conditionals.
    - No nested action dispatchers upon other action completion.
2. To facilitate the action re-usability and modularization.
3. To provide a gradual path for [React](https://reactjs.org/) developers willing to use [Solid](https://www.solidjs.com/).

## Installation

```bash
yarn add @gluecodes/storecle
```

or 

```bash
npm i @gluecodes/storecle
```

It works along with either [React](https://reactjs.org/) or [Solid](https://www.solidjs.com/) that also needs to be installed in your app. For details, see their own documentations.

## Usage

Soon official starter templates will be released. Using this library means following certain patterns which are explained below using a simple counter example. 

File tree:

```
.
├── actions
│   ├── dataSuppliers (#2)
│   │   └── index.js
│   ├── reloadTypes.js (#4)
│   └── userActions (#3)
│       └── index.js
├── index.jsx (#1)
├── Layout.jsx (#5)
└── partials (#6)
    └── Counter
        └── index.jsx
```

This module exports 3 constructs that can be imported for a particular framework in different parts of your app.

```javascript
import { 
  builtInActions, 
  PageProvider, 
  useAppContext 
} from '@gluecodes/storecle/react'
```

or 

```javascript
import { 
  builtInActions, 
  PageProvider, 
  useAppContext 
} from '@gluecodes/storecle/solid'
```

For the purpose of the example I used a Solid version. 

### Mental Model

#### 1. Page Container

Page provider wraps a given Layout around a single app context.

- `dataSupplierPipeline` - an array providing the order in which Data Suppliers are executed.
- `dataSuppliers` - an object containing Data Suppliers.
- `getLayout` - a function which returns the page Layout.
- `reloadTypes` - an object containing Reload Types.
- `userActions` - an object containing User Actions.
- `onError` - a function triggered when an error is thrown either in Data Suppliers or User Actions.

`./index.jsx`

```javascript
import { PageProvider } from '@gluecodes/storecle/solid'

import * as dataSuppliers from './actions/dataSuppliers/index'
import * as userActions from './actions/userActions/index'
import * as reloadTypes from './actions/reloadTypes'

import Layout from './Layout.jsx'



export default function App () {
  return (
    <PageProvider
      dataSupplierPipeline={[
        dataSuppliers.getTexts,
        dataSuppliers.getCounterValue
      ]}
      dataSuppliers={dataSuppliers}
      getLayout={() => Layout}
      reloadTypes={reloadTypes}
      userActions={userActions}
      onError={(err) => {
        console.error(err)
      }}
    />
  )
}
```

#### 2. Data Suppliers

Data suppliers return data prior to rendering. Note the early returns which demonstrate how to resolve cached data based on Reload Type.

- `buildInActions` - an object containing the following built-in User Actions:
  - `onStoreChanged` - a function which receives a callback to be triggered when Store changes.
  - `runUserActions` - a function which allows for executing multiple User Actions at once.
  - `runDataSuppliers` - a function which receives a Reload Type name. Note that it's exposed to ease the integration with legacy apps. Don't call it manually as Data Suppliers are implicitly reloaded based on the provided Reload Types.
- Each Data Supplier passes two arguments: `resultOf` and `nameOf`.
    - `resultOf` - a function providing a result of a given Data Supplier or User Action.
    - `nameOf` - a function providing a name of either Data Supplier, User Action or Reload Type.
- Data Suppliers can be either sync or async and write to a central Store by returning/resolving.

`./actions/dataSuppliers/index.js`

```javascript

import { builtInActions } from '@gluecodes/storecle/solid'
import { reFetchCounter } from '../reloadTypes'



export function getCounter (resultOf, nameOf) {
  if (resultOf(builtInActions.runDataSuppliers) !== nameOf(reFetchCounter)) {
    return resultOf(getCounter)
  }
  
  return global.sessionStorage.getItem('appWideCounter') || 0
}



export function getTexts (resultOf) {
  if (resultOf(builtInActions.runDataSuppliers) === 'full') {
    return resultOf(getTexts)
  }
  
  return {
    Click: 'Click'
  }
}
```

#### 3. User Actions

Actions triggered by a user.

`./actions/userActions/index.js`

```javascript
export function incrementCounter (counter) {
  global.sessionStorage.setItem('appWideCounter', parseInt(counter, 10) + 1)
}
```

#### 4. Reload Types

A way to tell the app to re-run Data Suppliers based on executed User Actions.


- A Reload Type groups User Actions together to tell the app to reload all Data Suppliers as a consequence of their execution.
- When any of its User Actions is triggered, the app sets the Reload Type name under built-in `runDataSuppliers` and reloads all Data Suppliers. 
- Data Suppliers can benefit from caching by early returning their results based on Reload Type name e.g. `resultOf(builtInActions.runDataSuppliers) !== nameOf(reFetchCounter)`.
- Each Reload Type is a function which passes `nameOf` and returns an array of User Action names.
    - `nameOf` - a function providing a name of User Action.

`./actions/reloadTypes.js`

```javascript
import { incrementCounter } from './userActions/index'

export const reFetchCounter = (nameOf) => [
  nameOf(incrementCounter)
]

```

#### 5. Layout

Nothing else than the page layout.

`./Layout.jsx`

```jsx
import Counter from './partials/Counter/index.jsx'

export default () => (
  <div className='container'>
    <Counter />
  </div>
)

```

#### 6. Partials

Partials are self-contained pieces of UI which have access to app state via the app context.

- `useAppContext` - a function which returns an array of 2 items: `resultOf`, `action`, `nameOf`. 
    - `resultOf` - a function providing a result of a given Data Supplier or User Action.
    - `action` - a function which triggers User Action.
    - `nameOf` - a function providing a name of either Data Supplier or User Action.

`./partials/Counter/index.jsx`

```jsx
import { useAppContext } from '@gluecodes/storecle/solid'

import { getCounter, getTexts } from './actions/dataSuppliers/index'
import { incrementCounter } from './actions/userActions/index'



export default () => {
  const [resultOf, action] = useAppContext()
  
  return (
    <button
      onClick={() => {
        action(incrementCounter)(
          resultOf(getCounter)
        )
      }}
    >{resultOf(getCounter).Click}: {resultOf(getCounter)}</button>
  )
}
```

## Documentation

WIP, so far there is only this `README.md` and a project `./test/env`. More docs will come with starter templates and CLI tooling. 

## License

MIT
