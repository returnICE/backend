var express = require('express')
var router = express.Router()
var jwt = require('jsonwebtoken')
var db = require('../models/index')
var EatenLog = db.EatenLog
var SubedItem = db.SubedItem
var Menu = db.Menu
var moment = require('moment')

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
const { Op } = require('sequelize')

router.get('/', async (req, res, next) => {
  try {
    var t = moment()
    const data = await SubedItem.findAll({
      where: { resetDate: { [Op.lte]: t } }
    })
    for (var i of data) {
      // console.log(i.resetDate)
      // console.log(moment(i.resetDate).add(i.term,'hours'))
      i.update({ resetDate: moment().add(i.term, 'hours'), usedTimes: 0 }) // resetDate를 지금 시간에서 term(hour)만큼 증가
      // i.update({ resetDate: moment(i.resetDate).add(i.term, 'hours'), usedTimes: 0 }) //resetDate를 resetdate에서 term(hour)만큼 증가
    }
    return res.json({ data })
  } catch (err) {
    return res.json({ err })
  }
})

module.exports = router
