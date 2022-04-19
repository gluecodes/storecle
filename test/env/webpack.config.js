const webpack = require('webpack')
const path = require('path')

const cwd = path.basename(process.cwd())

const getPageHtml = (frameworkName = cwd) => `
<html>
<head>
  <title>${frameworkName} sandbox</title>
  <meta charset="UTF-8" />
</head>
<body>
<div id="app"></div>
<script src="/bundles/index.bundle.js"></script>
</body>
</html>
`

module.exports = {
  target: 'web',
  entry: {
    index: [
      path.resolve(__dirname, './testHelpers/handleAppChangeHistoryRequest.js'),
      path.resolve(__dirname, './testHelpers/registerMutationObserver.js'),
      path.resolve(__dirname, `./${cwd}/index.js`)
    ]
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /(node_modules)/,
        use: {
          loader: 'babel-loader',
          options: {
            configFile: path.resolve(__dirname, `./${cwd}/babel.config.js`)
          }
        }
      }
    ]
  },
  plugins: [
    new webpack.ProvidePlugin({
      React: 'react'
    })
  ],
  output: {
    filename: 'bundles/[name].bundle.js',
    chunkFilename: 'bundles/[name]-[chunkhash].chunk.js',
    path: path.resolve(__dirname, `./${cwd}/dist/`),
    libraryTarget: 'umd',
    globalObject: 'this'
  },
  devServer: {
    host: '0.0.0.0',
    port: { react: 1234, solid: 4321 }[cwd],
    static: {
      directory: path.resolve(__dirname, `./${cwd}/dist/`)
    },
    hot: true,
    liveReload: false,
    onBeforeSetupMiddleware: ({ app }) => {
      app.get('/', (req, res) => {
        res.send(getPageHtml())
      })
    }
  },
  watchOptions: {
    aggregateTimeout: 1000,
    poll: 3000
  },
  resolve: {
    extensions: ['.js', '.jsx', '.json', '.mjs'],
    alias: {
      '@gluecodes/storecle': path.resolve(__dirname, `../../src/${cwd}.js`),
      react: path.resolve(__dirname, `${cwd}/node_modules/react`),
      'solid-js': path.resolve(__dirname, `${cwd}/node_modules/solid-js`)
    }
  },
  ...(process.env.NODE_ENV === 'local'
    ? {
      devtool: 'source-map'
    }
    : {})
}
