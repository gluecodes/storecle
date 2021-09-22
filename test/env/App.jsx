import * as dataSuppliers from './actions/dataSuppliers'
import * as userActions from './actions/userActions'
import * as reloadTypes from './actions/reloadTypes'

import PageProvider from './solid/PageProvider'
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
