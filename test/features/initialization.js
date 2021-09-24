const { expect } = require('chai')
const setupEnv = require('../runner/index')

describe('initialization', () => {
  let env

  beforeEach(async () => {
    env = await setupEnv({
      url: 'http://localhost:1234'
    })
  })

  afterEach(async () => {
    await env.done()
  })

  it('should do something', async () => {
    const changeHistory = await env.fetchAppChangeHistory()

    console.log({ changeHistory })

    expect(true).to.equal(true)

    await env.page.screenshot({ path: `${__dirname}/screenshot.png`, fullPage: true })
  })
})
