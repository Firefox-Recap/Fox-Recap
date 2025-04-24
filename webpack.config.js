const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = (_, argv) => {
  const isProd = argv.mode === 'production';
  return {
    mode: isProd ? 'production' : 'development',
    entry: {
      background: './src/background/background.js',
      popup: './src/popup/index.jsx'
    },
    resolve: {
      extensions: ['.js', '.jsx']
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].js',
      devtoolModuleFilenameTemplate: '[resource-path]'
    },
    module: {
      rules: [
        { test: /\.jsx?$/, exclude: /node_modules/, use: { loader: 'babel-loader', options: { babelrc: false, presets: ['@babel/preset-env', '@babel/preset-react'] } } },
        { test: /\.css$/i, use: ['style-loader','css-loader'] }
      ]
    },
    plugins: [
      new CleanWebpackPlugin(),
      new CopyWebpackPlugin({
        patterns: [
          { from: 'src/manifest.json', to: '' },
          { from: 'src/popup/popup.html', to: '' },
          { from: 'src/assets', to: 'assets' } 
        ]
      })
    ],
    devtool: isProd ? 'source-map' : 'inline-source-map',
    watch: !isProd
  };
};