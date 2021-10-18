const { expect } = require('chai')
const setupEnv = require('../runner/index')
const appPort = require('../env/testHelpers/appPort')
const appChangeHistorySnapshotTypes = require('../env/testHelpers/appChangeHistorySnapshotTypes.json')
const elementClassNames = require('../env/testHelpers/elementClassNames.json')

describe('app state manipulation', () => {
  let env

  beforeEach(async () => {
    env = await setupEnv({
      url: `http://localhost:${appPort}`
    })
  })

  afterEach(async () => {
    await env.done()
  })

  it('should render initial DOM', async () => {
    const incomingDataSupplierInitializationsCount = await env.fetchAppChangeHistory({
      snapshotType: appChangeHistorySnapshotTypes.incomingDataSupplierInitializations
    })

    const firstDataSupplierTriggersCount = await env.fetchAppChangeHistory({
      snapshotType: appChangeHistorySnapshotTypes.firstDataSupplierTriggers
    })

    const secondDataSupplierTriggersCount = await env.fetchAppChangeHistory({
      snapshotType: appChangeHistorySnapshotTypes.secondDataSupplierTriggers
    })

    const firstDataSupplierCachedResultsCount = await env.fetchAppChangeHistory({
      snapshotType: appChangeHistorySnapshotTypes.firstDataSupplierCachedResults
    })

    expect(await env.document.querySelector(`.${elementClassNames.firstDataSupplierResult}`).innerText.promise())
      .to.equal('result of getThis')
    expect(await env.document.querySelector(`.${elementClassNames.secondDataSupplierResult}`).innerText.promise())
      .to.equal('result of getThat which accessed result of getThis')
    expect(await env.document.querySelector(`.${elementClassNames.incomingDataSupplierResult}`).innerText.promise())
      .to.equal('incoming data: 10')
    expect(await env.document.querySelector(`.${elementClassNames.firstUserActionResult}`).innerText.promise())
      .to.equal('')
    expect(await env.document.querySelector(`.${elementClassNames.secondUserActionResult}`).innerText.promise())
      .to.equal('')

    expect(incomingDataSupplierInitializationsCount).to.equal(1)
    expect(firstDataSupplierTriggersCount).to.equal(1)
    expect(secondDataSupplierTriggersCount).to.equal(1)
    expect(firstDataSupplierCachedResultsCount).to.equal(null)

    // await env.page.screenshot({ path: `${__dirname}/screenshot.png`, fullPage: true })
  })

  it('should trigger user action', async () => {
    await env.page.click(`.${elementClassNames.firstUserActionTrigger}`)

    const lastDomMutation = await env.fetchAppChangeHistory({
      snapshotType: appChangeHistorySnapshotTypes.lastDomMutation
    })

    expect(await env.document.querySelector(`.${elementClassNames.firstUserActionResult}`).innerText.promise())
      .to.equal('1')

    expect(lastDomMutation.type).to.equal('childList')
    expect(lastDomMutation.affectedElementClassName).to.equal(elementClassNames.firstUserActionResult)
    expect(lastDomMutation.innerText).to.equal('1')

    expect(await env.document.querySelector(`.${elementClassNames.secondUserActionResult}`).innerText.promise())
      .to.equal('')
  })

  it('should trigger user action which reloads data suppliers', async () => {
    await env.page.click(`.${elementClassNames.secondUserActionTrigger}`)

    const lastDomMutation = await env.fetchAppChangeHistory({
      snapshotType: appChangeHistorySnapshotTypes.lastDomMutation
    })

    const firstDataSupplierTriggersCount = await env.fetchAppChangeHistory({
      snapshotType: appChangeHistorySnapshotTypes.firstDataSupplierTriggers
    })

    const secondDataSupplierTriggersCount = await env.fetchAppChangeHistory({
      snapshotType: appChangeHistorySnapshotTypes.secondDataSupplierTriggers
    })

    const firstDataSupplierCachedResultsCount = await env.fetchAppChangeHistory({
      snapshotType: appChangeHistorySnapshotTypes.firstDataSupplierCachedResults
    })

    expect(await env.document.querySelector(`.${elementClassNames.secondUserActionResult}`).innerText.promise())
      .to.equal('1')

    expect(lastDomMutation.type).to.equal('childList')
    expect(lastDomMutation.affectedElementClassName).to.equal(elementClassNames.secondUserActionResult)
    expect(lastDomMutation.innerText).to.equal('1')

    expect(firstDataSupplierTriggersCount).to.equal(2)
    expect(secondDataSupplierTriggersCount).to.equal(2)
    expect(firstDataSupplierCachedResultsCount).to.equal(1)

    expect(await env.document.querySelector(`.${elementClassNames.firstUserActionResult}`).innerText.promise())
      .to.equal('')
  })

  it('should trigger incoming data event', async () => {
    for (const number of ['9', '8', '7']) {
      await env.page.click(`.${elementClassNames.incomingDataSupplyTrigger}`)

      const lastDomMutation = await env.fetchAppChangeHistory({
        snapshotType: appChangeHistorySnapshotTypes.lastDomMutation
      })

      const incomingDataSupplierInitializationsCount = await env.fetchAppChangeHistory({
        snapshotType: appChangeHistorySnapshotTypes.incomingDataSupplierInitializations
      })

      expect(await env.document.querySelector(`.${elementClassNames.incomingDataSupplierResult}`).innerText.promise())
        .to.equal(`incoming data: ${number}`)

      expect(lastDomMutation.type).to.equal('characterData')
      expect(lastDomMutation.parentElementClassName).to.equal(elementClassNames.incomingDataSupplierResult)
      expect(lastDomMutation.affectedText).to.equal(number)

      expect(await env.document.querySelector(`.${elementClassNames.firstUserActionResult}`).innerText.promise())
        .to.equal('')

      expect(await env.document.querySelector(`.${elementClassNames.secondUserActionResult}`).innerText.promise())
        .to.equal('')

      expect(incomingDataSupplierInitializationsCount).to.equal(1)
    }
  })

  it('should store user action count', async () => {
    await env.page.click(`.${elementClassNames.firstUserActionTrigger}`)
    await env.page.click(`.${elementClassNames.firstUserActionTrigger}`)
    await env.page.click(`.${elementClassNames.firstUserActionTrigger}`)

    const lastDomMutation = await env.fetchAppChangeHistory({
      snapshotType: appChangeHistorySnapshotTypes.lastDomMutation
    })

    expect(await env.document.querySelector(`.${elementClassNames.firstUserActionResult}`).innerText.promise())
      .to.equal('3')

    expect(lastDomMutation.type).to.equal('characterData')
    expect(lastDomMutation.parentElementClassName).to.equal(elementClassNames.firstUserActionResult)
    expect(lastDomMutation.affectedText).to.equal('3')
  })
})
