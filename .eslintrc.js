module.exports = {
  env: {
    es6: true,
    node: true
  },
  ignorePatterns: ["models/", "node_modules/"],
  extends: [
    'standard'
  ],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly'
  },
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module'
  },
  rules: {
  }
}
