const path = require('path')
const webpack = require('webpack')
// HTML 핫 리로딩을 위해 필요한 플러그인
const HTMLWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  entry: {
    main: ['./src/main.js']
  },
  output: {
    filename: '[name]-bundle.js',
    path: path.resolve(__dirname, '../dist')
  },
  devServer: {
    contentBase: 'dist',
    overlay: true,
    // 웹팩의 상태값에 색상을 부여한다.
    stats: {
      colors: true
    },
    // hot 프로퍼티를 true로 설정!
    hot: true
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: [
          {
            loader: 'babel-loader'
          }
        ],
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: [
          {
            loader: 'style-loader'
          },
          {
            loader: 'css-loader'
          }
        ]
      },
      {
        test: /\.html$/,
        use: [
          // 원래 extract-loader와 file-loader가 있었다.
          // 그러나 html을 핫리로딩 시키기 위해서는 위 로더 대신 HTML 웹팩 플러그인을 사용한다!
          {
            loader: 'html-loader',
            options: {
              attrs: ['img:src']
            }
          }
        ]
      },
      {
        test: /\.(png|jpg|gif)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: 'images/[name].[ext]'
            }
          }
        ]
      }
    ]
  },
  // Hot 모듈과 HTML웹팩 플러그인을 추가한다.
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new HTMLWebpackPlugin({
      template: './src/index.html'
    })
  ]
}
