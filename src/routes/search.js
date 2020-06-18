var express = require('express')
var Seller = require('../models').Seller
var db = require('../models/index')
var jwt = require('jsonwebtoken')

var Op = require('sequelize').Op

var router = express.Router()

router.post('/', async (req, res, next) => {
  try {
    var lat = req.body.lat
    var lon = req.body.lon
    var page = req.body.page
    var x = req.body.zoom
    var listcount = 6
    if (x === '-1.0') {
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
    } else {
      var range = 293.59 * Math.exp(-0.703 * x)

      const sellers = await Seller.findAll({
        raw: true,
        where: {
          lat: {
            [Op.gte]: lat - range,
            [Op.lte]: parseFloat(lat) + range
          },
          lon: {
            [Op.gte]: lon - range,
            [Op.lte]: parseFloat(lon) + range
          }
        }
      })

      res.json({ success: true, sellerdata: sellers.slice(0, 20) })
    }
  } catch (err) {
    console.log(err)
    res.json({ success: false, error: err })
  }
})

router.post('/ent', async (req, res, next) => {
  try {
    var token = req.headers['x-access-token']
    jwt.verify(token, process.env.JWT_KEY, async function (err, decoded) {
      if (err) return res.json({ success: false, err })
      console.log(decoded)
      var lat = decoded.lat
      var lon = decoded.lon
      var page = 0
      var x = '-1.0'
      var listcount = 20000
      if (x === '-1.0') {
        const sellers = await Seller.findAll({
          raw: true
        }, { where: { contractable: 0 } })

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
      } else {
        var range = 293.59 * Math.exp(-0.703 * x)

        const sellers = await Seller.findAll({
          raw: true,
          where: {
            lat: {
              [Op.gte]: lat - range,
              [Op.lte]: parseFloat(lat) + range
            },
            lon: {
              [Op.gte]: lon - range,
              [Op.lte]: parseFloat(lon) + range
            }
          }
        })

        res.json({ success: true, sellerdata: sellers })
      }
    })
  } catch (err) {
    console.log(err)
    res.json({ success: false, error: err })
  }
})

router.get('/:sellerId', async (req, res, next) => {
  const sellerId = req.params.sellerId
  var sellerdetaildata = {}
  var menudata = []
  var subItem = []

  var query = 'SELECT subId, subName, price, limitTimes, term, subs, info FROM SubItem WHERE SubItem.sellerId = :sellerId;'
  var values = {
    sellerId: sellerId
  }
  await db.sequelize.query(query, { replacements: values }).spread(function (results, subdata) { // results 뭐하는건지 모르겠음
    for (var s of subdata) {
      subItem.push({
        subId: s.subId,
        subName: s.subName,
        price: s.price,
        limitTimes: s.limitTimes,
        term: s.term,
        subs: s.subs,
        info: s.info,
        menu: []
      })
    }
  })

  for (var i = 0; i < subItem.length; i++) {
    query = 'SELECT T3.menuName, T3.price, T3.avgScore FROM SubMenu T2 join Menu T3 WHERE T2.subId = :subId AND T2.menuId = T3.menuId;'
    values = {
      subId: subItem[i].subId
    }
    await db.sequelize.query(query, { replacements: values }).spread(function (results, subdata) { // results 뭐하는건지 모르겠음
      for (var s of subdata) {
        subItem[i].menu.push({
          menuName: s.menuName,
          price: s.price,
          avgScore: s.avgScore
        })
      }
    })
  }

  query = 'SELECT name,phone,address,totalsubs FROM Seller WHERE sellerId = :sellerId;'
  values = { // query에서 :customerId -> decode.customerId로 변환
    sellerId: sellerId
  }
  await db.sequelize.query(query, { replacements: values }).spread(function (results, subdata) { // results 뭐하는건지 모르겠음
    sellerdetaildata.name = subdata[0].name
    sellerdetaildata.phone = subdata[0].phone
    sellerdetaildata.address = subdata[0].address
    sellerdetaildata.totalSubs = subdata[0].totalSubs
  })

  query = 'SELECT menuName,price,avgScore FROM Menu WHERE sellerId = :sellerId;'
  values = { // query에서 :customerId -> decode.customerId로 변환
    sellerId: sellerId
  }
  await db.sequelize.query(query, { replacements: values }).spread(function (results, subdata) { // results 뭐하는건지 모르겠음
    menudata = subdata
  })

  res.json({ success: true, sellerdetaildata: sellerdetaildata, menudata: menudata, subItem: subItem })
})

module.exports = router
