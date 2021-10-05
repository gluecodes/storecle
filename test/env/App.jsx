import { PageProvider } from '@gluecodes/storecle'

import * as dataSuppliers from './actions/dataSuppliers/index'
import * as userActions from './actions/userActions/index'
import * as reloadTypes from './actions/reloadTypes'

import Layout from './Layout.jsx'

export default function App () {
  return (
    <PageProvider
      dataSupplierPipeline={[
        dataSuppliers.getThis,
        dataSuppliers.getThat,
        dataSuppliers.feedWithIncomingData
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
