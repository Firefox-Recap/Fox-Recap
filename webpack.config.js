const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    background: './src/background/background.js',
    popup:      './src/popup/popup.jsx'
  },
  resolve: {
    extensions: ['.js', '.jsx']
  },
  output: {
    path:     path.resolve(__dirname, 'dist'),
    filename: '[name].js'
  },
  module: {
    rules: [
      {
        test:    /\.jsx?$/,
        exclude: /node_modules/,
        use:     { loader: 'babel-loader', options: { presets: ['@babel/preset-env','@babel/preset-react'] } }
      },
      {
        test: /\.css$/i,
        use:  ['style-loader','css-loader']
      }
    ]
  },                      
  plugins: [
    new CleanWebpackPlugin(),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'src/manifest.json', to: '' },
        { from: 'src/popup/popup.html', to: 'popup.html' },
        { from: 'src/assets', to: 'assets' },
        { from: 'src/popup/popup.css', to: 'popup.css' }
      ]
    })
  ],
  mode: process.env.NODE_ENV || 'development'
};