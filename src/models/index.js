// sequelize-auto -o "./src/models" -d capstone-schema -h returnice-db.ciyere7qfg4n.us-east-2.rds.amazonaws.com -u capstone14 -p 3306 -x fptdltrh -e mysql
var fs = require('fs')
const path = require('path')
const Sequelize = require('sequelize')
// import {development,test,production} from '../config/config'

const env = process.env.NODE_ENV || 'development'

const config = require('../config/config')[env]
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

db.SubItem.belongsTo(db.Seller, { foreignKey: 'sellerId' });
db.SubedItem.belongsTo(db.SubItem, { foreignKey: 'subId' });
db.Menu.belongsToMany(db.SubItem, { through: 'SubMenu',foreignKey:'menuId' });
db.SubItem.belongsToMany(db.Menu, { through: 'SubMenu',foreignKey:'subId' });
db.Customer.belongsToMany(db.SubItem, { through: 'SubedItem',foreignKey:'customerId' });
db.SubItem.belongsToMany(db.Customer, { through: 'SubedItem',foreignKey:'subId' });
db.EatenLog.belongsTo(db.Menu, {foreignKey:'menuId'});
db.EatenLog.belongsTo(db.Customer, {foreignKey:'customerId'});
db.Enterprise.belongsToMany(db.Customer, { through: 'Member',foreignKey:'enterpriseId' });
db.Customer.belongsToMany(db.Enterprise, { through: 'Member',foreignKey:'customerId' });
db.CampaignLog.belongsTo(db.Customer,{foreignKey:'customerId'});
db.CampaignLog.belongsTo(db.Campaign,{foreignKey:'campaignId'});
db.Campaign.belongsTo(db.Seller,{foreignKey:'sellerId'});
// db.Customer.belongsToMany(db.Campaign, { through: 'CampaignLog',foreignKey:'customerId' });
// db.Campaign.belongsToMany(db.Customer, { through: 'CampaignLog',foreignKey:'campaignId' });

db.sequelize = sequelize
db.Sequelize = Sequelize

module.exports = db
