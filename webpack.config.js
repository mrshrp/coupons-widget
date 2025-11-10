const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    entry: './src/index.ts',
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
      ],
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
      filename: isProduction ? 'coupons-widget.min.js' : 'coupons-widget.js',
      path: path.resolve(__dirname, 'dist'),
      library: {
        name: 'CouponsWidget',
        type: 'umd',
        export: 'default',
      },
      globalObject: 'this',
      clean: true,
    },
    plugins: [
      new CleanWebpackPlugin(),
    ],
    optimization: {
      minimize: isProduction,
    },
    devtool: isProduction ? false : 'eval-source-map',
    mode: argv.mode || 'development',
  };
};