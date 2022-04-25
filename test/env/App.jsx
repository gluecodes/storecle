import { PageProvider } from '@gluecodes/storecle'

import * as dataSuppliers from './actions/dataSuppliers/dataSuppliers'
import * as userActions from './actions/userActions/userActions'
import * as reloadTypes from './actions/reloadTypes'

import Layout from './Layout'

export default () => {
  return (
    <PageProvider
      dataSupplierPipeline={[
        dataSuppliers.squash1,
        dataSuppliers.squash2,
        dataSuppliers.squash3,
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
