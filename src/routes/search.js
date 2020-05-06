var express = require('express')
var Seller = require('../models').Seller
var Menu = require('../models').Menu
var SubItem = require('../models').SubItem
var SubMenu = require('../models').SubMenu

var Op = require('sequelize').Op

var router = express.Router()

router.post('/', async (req, res, next) => {
  try {
    var lat = req.body.lat
    var lon = req.body.lon
    var page = req.body.page
    var x = req.body.zoom
    var listcount = 6
    if(x == -1){
      const sellers = await Seller.findAll({ 
        raw: true
      })

      sellers.sort((a, b) => {
        var ax = (lat - a.lat)
        var ay = (lon - a.lon) * Math.cos(a.lat * Math.PI / 180)
        var A = 110.25 * Math.sqrt(ax * ax + ay * ay)

        var bx = (lat - b.lat)
        var by = (lon - b.lon) * Math.cos(b.lat * Math.PI / 180)
        var B = 110.25 * Math.sqrt(bx * bx + by * by)
        return A < B ? -1 : 1
      })

      res.json({ success: true, sellerdata: sellers.slice(listcount * page, listcount * page + listcount) })
    }
    else{
      var range = 293.59*Math.exp(-0.703*x)
      
      const sellers = await Seller.findAll({ 
        raw: true,
        where: {
          lat:{
            [Op.gte]:lat-range,
            [Op.lte]:parseFloat(lat)+range
          },
          lon:{
            [Op.gte]:lon-range,
            [Op.lte]:parseFloat(lon)+range
          }
        }
      })
      
      res.json({ success: true, sellerdata: sellers})
    }
  } catch (err) {
    console.log(err)
    res.json({ success: false, error: err })
  }
})

router.get('/:sellerId', async (req, res, next) => {
  const sellerId = req.params.sellerId
  var sellerdata = await Seller.findOne({
    where: { sellerId: sellerId }
  })
  if (!sellerdata) {
    res.json({ success: false, error: 'data없음' })
    return
  }

  Seller.hasMany(Menu, { foreignKey: 'sellerId' })
  Menu.belongsTo(Seller, { foreignKey: 'sellerId' })
  const menudata = await Menu.findAll({
    include: [{
      attributes: [],
      model: Seller,
      where: { sellerId: sellerId }
    }]
  })

  Seller.hasMany(SubItem, { foreignKey: 'sellerId' })
  SubItem.belongsTo(Seller, { foreignKey: 'sellerId' })
  var subItem = await SubItem.findAll({
    include: [{
      attributes: [],
      model: Seller,
      where: { sellerId: sellerId }
    }],
    raw: true
  })

  var subIdlist = [...new Set(subItem.map(it => it.subId))]

  async function asyncForEach (array, callback) {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array)
    }
  }

  const createMenu = async () => {
    await asyncForEach(subIdlist, async (subId, idx) => {
      var submenu = await SubMenu.findAll({
        where: { subId: subId }
      })
      var menuIdlist = [...new Set(submenu.map(it => it.menuId))]
      var menu = await Menu.findAll({
        where: { menuId: menuIdlist },
        raw: true
      })
      var _menu = []
      menu.forEach(m => {
        _menu.push(m)
      })
      subItem[idx].menu = _menu
    })
    const sellerdetaildata = {
      name: sellerdata.name,
      phone: sellerdata.phone,
      address: sellerdata.address,
      totalSubs: sellerdata.totalSubs,
      info: sellerdata.info
    }
    res.json({ success: true, sellerdetaildata: sellerdetaildata, menudata: menudata, subItem: subItem })
  }

  createMenu()
})

module.exports = router
