const nodeExternals = require('webpack-node-externals')
const path = require('path');

module.exports = {
  target: 'node',
  entry:{maidn:'./bin/server.js'},
  externals: [nodeExternals()],
  resolve: {
    modules: ['node_modules'],
    extensions: ['.js']
  },
}

//entry나 output을 변경하기위한 코드
/*
  const nodeExternals = require('webpack-node-externals')
  const path = require('path')
 
  module.exports = {
   target: 'node',
   externals: [nodeExternals()],
   entry: './src', // 원하는 경로로 바꿔주세요.
   output: {
     path: path.resolve(__dirname, 'dist'), // 원하는 경로로 바꿔주세요.
     filename: 'main.js', // 원하는 파일명으로 바꿔주세요.
   },
  }
*/