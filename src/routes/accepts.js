var express = require('express')
var router = express.Router()
var jwt = require('jsonwebtoken')
var db = require('../models/index')
var EatenLog = db.EatenLog
var SubedItem = db.SubedItem
var Menu = db.Menu
var fs = require('fs') // 파일 로드 사용.

router.post('/customer', function (req, res) {
  var token = req.headers['x-access-token']
  jwt.verify(token, process.env.JWT_KEY, async (err, decoded) => {
    if (err) res.json({ success: false, err })
    SubedItem.findByPk(req.body.subedId)
      .then((data) => {
        if (data.limitTimes <= data.usedTimes) return res.json({ success: false, err: '수량초과' })
        else {
          data.increment({ usedTimes: 1 })
          EatenLog.create({ menuId: req.body.menuId, eatenDate: new Date(), customerId: decoded.customerId })
            .then((data) => res.json({ success: true, data }))
            .catch((err) => res.json(err))
        }
      }).catch((err) => res.json({ success: false, err }))
  })
})

router.post('/enterprise', function (req, res) {
  return res.json({ success: true })
})

router.post('/score', function (req, res) {
  var token = req.headers['x-access-token']
  jwt.verify(token, process.env.JWT_KEY, (err, decoded) => {
    if (err) res.json({ success: false, err })
    EatenLog.findByPk(req.body.eatenId, { include: [{ model: Menu }] })
      .then(async data => {
        try {
          await data.update({ score: req.body.score })
          const avgdata = await EatenLog.findAll({
            where: { menuId: data.Menu.menuId },
            attributes: [[EatenLog.sequelize.fn('AVG',
              EatenLog.sequelize.col('score')), 'avgScore']]
          })
          console.log()
          await Menu.update({ avgScore: avgdata[0].get('avgScore') }, { where: { menuId: data.Menu.menuId } })
          return res.json({ success: true })
        } catch (err) {
          return res.json({ success: false, err })
        }
      })
  })
})

router.get('/', (req, res, next) => {
  fs.readFile('index.html', function (err, data) { // index.html 파일 로드 .
    if (err) res.json({ err })
    res.writeHead(200, { 'Content-Type': 'text/html' }) // Head Type 설정 .
    res.render(data)
  })
})

module.exports = router
