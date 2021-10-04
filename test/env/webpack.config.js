const webpack = require('webpack')
const path = require('path')

const cwd = path.basename(process.cwd())

const pageHtml = `
<html>
<head>
  <title>${cwd} sandbox</title>
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
    filename: '[name].bundle.js',
    chunkFilename: '[name]-[chunkhash].chunk.js',
    path: path.resolve(__dirname, `./${cwd}/dist/bundles/`),
    publicPath: '/bundles/',
    libraryTarget: 'umd',
    globalObject: 'this'
  },
  devServer: {
    host: '0.0.0.0',
    port: ({ react: 1234, solid: 4321 })[cwd],
    static: {
      directory: path.resolve(__dirname, `./${cwd}/dist/`)
    },
    hot: true,
    onBeforeSetupMiddleware: ({ app }) => {
      app.get('/', (req, res) => {
        res.send(pageHtml)
      })
    }
  },
  watchOptions: {
    aggregateTimeout: 1000,
    poll: 3000
  },
  resolve: {
    alias: {
      appContext: path.resolve(__dirname, `../../src/${cwd}/appContext.js`),
      PageProvider: path.resolve(__dirname, `../../src/${cwd}/PageProvider.jsx`),
      react: path.resolve(__dirname, `${cwd}/node_modules/react`),
      'solid-js': path.resolve(__dirname, `${cwd}/node_modules/solid-js`)
    }
  }
}
