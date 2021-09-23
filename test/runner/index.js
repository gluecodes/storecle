const puppeteer = require('puppeteer')

const getInDocEvaluator = (page) => {
  const docMock = {}
  const callChain = []

  const identifierName = new Proxy({}, {
    get: (target, prop) => {
      if (typeof prop === 'string' && prop !== '__proto__') {
        return prop
      }

      return null
    }
  })

  const trappedFunction = function (identifier, argList) {
    callChain.pop()
    callChain.push({ type: 'call', id: identifier, argList })
    return getDocProxy({})
  }

  const promiseFunction = () => new Promise((resolve, reject) => (
    page.evaluate((serializedCallChain) => (
      serializedCallChain.reduce((acc, callNode) => {
        if (callNode.type === 'call') {
          return acc[callNode.id].apply(acc, callNode.argList)
        }

        return acc[callNode.id]
      }, document)
    ), callChain)
      .then(resolve)
      .catch(reject)
  ))

  const getNextInChainProxy = identifier => new Proxy(trappedFunction, {
    apply: (target, thisArg, argList) => {
      if (identifier === 'promise') {
        callChain.pop()
        return promiseFunction()
      }

      return target(identifier, argList)
    },
    get: (target, prop) => getDocProxy({})[prop]
  })

  const getDocProxy = object => new Proxy(object, {
    get: (target, prop) => {
      if (prop === 'then') { return }

      if (target === docMock) {
        callChain.length = 0
      }

      callChain.push({ type: 'getter', id: identifierName[prop] })
      return getNextInChainProxy(identifierName[prop])
    }
  })

  return getDocProxy(docMock)
}

module.exports = async ({
  url,
  waitForSelector = '#app > div'
}) => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] })
  const page = await browser.newPage()
  let lastAppDataHandler

  const fetchCssClasses = async () => (
    page.evaluate(() => (
      Array.from(document.querySelectorAll('[class]'))
        .reduce((acc, node) => acc.concat(Array.from(node.classList)), [])
        .reduce((acc, className) => ({ ...acc, [className]: className }), {})
    ))
  )

  const fetchAppChangeHistory = async (payload) => {
    page.evaluate((serializedPayload) => {
      document.dispatchEvent(new CustomEvent('fetchAppChangeHistory', {
        bubbles: true,
        cancelable: false,
        detail: serializedPayload
      }))
    }, payload)
  }

  page.on('console', (msg) => {
    const logBatch = msg.text()

    if (!/^#/.test(logBatch) &&
      !/^(\[WDS\]|\[HMR\])/.test(logBatch)) {
      // console.log(logBatch)
    }
  })

  page.on('error', (err) => {
    console.error(err)
    browser.close()
  })

  await page.setViewport({ width: 1920, height: 1080 })
  await page.goto(url)
  await page.waitForSelector(waitForSelector)

  const cssClasses = await fetchCssClasses(page)

  return {
    cssClasses,
    document: getInDocEvaluator(page),
    done: async () => browser.close(),
    goTo: async (url) => {
      await page.goto(url)
      await page.waitForSelector(waitForSelector)
      Object.assign(cssClasses, await fetchCssClasses(page))
    },
    page,
    fetchAppChangeHistory: async (payload) => new Promise((resolve, reject) => {
      if (lastAppDataHandler) {
        page.off('console', lastAppDataHandler)
      }

      page.on('console', lastAppDataHandler = (msg) => {
        const logBatch = msg.text()

        if (/^$/.test(logBatch)) {
          resolve(JSON.parse(logBatch.slice(1)))
        }
      })

      fetchAppChangeHistory(payload)
        .catch(reject)
    }),
    updateCssClasses: async () => {
      Object.assign(cssClasses, await fetchCssClasses(page))
    }
  }
}
