// sequelize-auto -o "./src/models" -d capstone-schema -h returnice-db.ciyere7qfg4n.us-east-2.rds.amazonaws.com -u capstone14 -p 3306 -x fptdltrh -e mysql
var fs = require('fs')
const path = require('path')
const Sequelize = require('sequelize')

const env = process.env.NODE_ENV || 'development'
const config = require(path.join(__dirname, '../', 'config', 'config.json'))[env]
const db = {}

const sequelize = new Sequelize(config.database, config.username, config.password, config)

fs
  .readdirSync(__dirname)
  .filter(function (file) {
    return (file.indexOf('.') !== 0) && (file !== 'index.js')
  })
  .forEach(function (file) {
    var model = sequelize.import(path.join(__dirname, file))
    db[model.name] = model
  })

Object.keys(db).forEach(function (modelName) {
  if ('associate' in db[modelName]) {
    db[modelName].associate(db)
  }
})

db.sequelize = sequelize
db.Sequelize = Sequelize

module.exports = db
