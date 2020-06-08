var express = require('express')
var router = express.Router()
var async = require('async')
var crypto = require('crypto')
var db = require('../models/index')
var Customer = db.Customer
var EatenLog = db.EatenLog
var Menu = db.Menu
var Member = db.Member
var Enterprise = db.Enterprise
var CampaignLog = db.CampaignLog
var Campaign = db.Campaign
var Seller = db.Seller
// var SubedItem = db.SubedItem
var jwt = require('jsonwebtoken')

router.post('/', checkUserRegValidation, function (req, res, next) {
  var salt = Math.round((new Date().valueOf() * Math.random()))
  req.body.pw = crypto.createHash('sha512').update(req.body.pw + salt).digest('hex')
  Customer.create({ ...req.body, salt: salt })
    .then((data) => { res.json({ success: true, data }) })
    .catch((err) => {
      if (err) return res.json({ success: false, message: err })
    })
})

router.post('/login', async (req, res, next) => {
  try {
    Customer.findByPk(req.body.customerId)
      .then((data) => {
        if (data && data.pw === crypto.createHash('sha512').update(req.body.pw + data.salt).digest('hex')) {
          var payload = {
            customerId: data.customerId
          }
          var options = { expiresIn: 60 * 60 * 24 }
          jwt.sign(payload, process.env.JWT_KEY, options, function (err, token) {
            if (err) return res.json({ success: false, err: err })
            return res.send({ success: true, data: token, name: data.name })
          })
        } else {
          res.json({ succes: false, err: '아이디와 패스워드를 확인해주세요' })
        }
      })
  } catch (err) {
    res.json({ succes: false, err })
  }
})

// 소비자 정보 조회
router.get('/myinfo', function (req, res) {
  var token = req.headers['x-access-token']
  jwt.verify(token, process.env.JWT_KEY, function (err, decoded) {
    if (err) return res.json({ success: false, err })
    else {
      Customer.findByPk(decoded.customerId).then((data) => {
        delete data.pw
        return res.json({ success: true, data })
      }).catch((err) => {
        return res.json({ succes: false, err })
      })
    }
  })
})

// 소비자 정보 수정 -> 비밀번호변경
router.put('/myinfo', function (req, res) {
  var token = req.headers['x-access-token']
  jwt.verify(token, process.env.JWT_KEY, function (err, decoded) {
    if (err) return res.json({ success: false, err })
    else {
      var salt = Math.round((new Date().valueOf() * Math.random()))
      var pw = crypto.createHash('sha512').update(req.body.pw + salt).digest('hex')
      Customer.update({ pw, salt }, { where: { customerId: decoded.customerId } })
        .then(() => { return res.json({ success: true }) })
        .catch((err) => { return res.json({ success: false, err }) })
    }
  })
})

// 소비자 정보 삭제
router.delete('/myinfo', function (req, res) {
  var token = req.headers['x-access-token']
  jwt.verify(token, process.env.JWT_KEY, function (err, decoded) {
    if (err) return res.json({ success: false, err })
    else {
      Customer.destroy({ where: { customerId: decoded.customerId } })
        .then(() => { return res.json({ success: true }) })
        .catch((err) => { return res.json({ success: false, err }) })
    }
  })
})

// 소비자 아이디 중복 확인
router.post('/checkid', checkId, function (req, res) {
  res.json({ success: true })
})

// 구독중인 음식점 조회
router.get('/sub', function (req, res) {
  var token = req.headers['x-access-token']
  jwt.verify(token, process.env.JWT_KEY, function (err, decoded) {
    if (err) return res.json({ success: false, err })
    else {
      var query = 'SELECT customerId, T1.startDate, T1.endDate, T1.term, T1. limitTimes, T1.autopay, T1.usedTimes, T1.subedId, T2.subId, T2.subName, T3.sellerId, T3.name, T3.imgURL FROM (SELECT * FROM SubedItem WHERE SubedItem.customerId = :customerId) T1 join SubItem T2 join Seller T3 WHERE T1.subId = T2.subId AND T2.sellerId = T3.sellerId'
      var values = { // query에서 :customerId -> decode.customerId로 변환
        customerId: decoded.customerId
      }
      db.sequelize.query(query, { replacements: values }).spread(function (results, subdata) { // results 뭐하는건지 모르겠음
        return res.json({ success: true, subdata })
      })
    }
  })
})

// 구독중인 서비스 정보 조회
router.get('/sub/:subedId', async (req, res, next) => {
  const subedId = req.params.subedId
  var subedItem = []

  var query = 'SELECT T1.startDate, T1.endDate, T1.term, T1.limitTimes, T1.usedTimes, T1.subedId, T2.subId, T2.subName, T2.price, T3.sellerId, T3.name FROM SubedItem T1 join SubItem T2 join .Seller T3 WHERE T2.sellerId = T3.sellerId AND T1.subId = T2.subId AND T1.subedId = :subedId;'
  var values = {
    subedId: subedId
  }
  await db.sequelize.query(query, { replacements: values }).spread(function (results, subdata) { // results 뭐하는건지 모르겠음
    for (var s of subdata) {
      subedItem.push({
        endDate: s.endDate,
        term: s.term,
        limitTimes: s.limitTimes,
        usedTimes: s.usedTimes,
        subedId: s.subedId,
        subId: s.subId,
        subName: s.subName,
        sellerId: s.sellerId,
        price: s.price,
        name: s.name,
        menu: []
      })
    }
  })

  for (var i = 0; i < subedItem.length; i++) {
    query = 'SELECT T3.menuId, T3.menuName, T3.price, T3.avgScore FROM SubMenu T2 join Menu T3 WHERE T2.subId = :subId AND T2.menuId = T3.menuId;'
    values = {
      subId: subedItem[i].subId
    }
    await db.sequelize.query(query, { replacements: values }).spread(function (results, subdata) { // results 뭐하는건지 모르겠음
      for (var s of subdata) {
        subedItem[i].menu.push({
          menuName: s.menuName,
          price: s.price,
          avgScore: s.avgScore,
          menuId: s.menuId
        })
      }
    })
  }

  res.json({ success: true, subedItem: subedItem })
})

// 자동 결제 취소 : 구독 해지
router.put('/sub/:subedId', function (req, res) {
  const subedId = req.params.subedId
  var token = req.headers['x-access-token']
  jwt.verify(token, process.env.JWT_KEY, function (err, decoded) {
    if (err) return res.json({ success: false, err })
    else {
      var query = 'UPDATE SubedItem SET autopay = 0 WHERE customerId = :customerId AND subedId = :subedId;'
      var values = {
        customerId: decoded.customerId,
        subedId: subedId
      }
      db.sequelize.query(query, { replacements: values }).spread(function (results) { // results 뭐하는건지 모르겠음
        return res.json({ success: true })
      })
    }
  })
})

// eatenlog
router.get('/accept', (req, res) => {
  var token = req.headers['x-access-token']
  jwt.verify(token, process.env.JWT_KEY, async function (err, decoded) {
    if (err) return res.json({ success: false, err })
    try {
      const customer = await EatenLog.findAll({
        include: [{
          model: Menu,
          attributes: ['menuName']
        }],
        where: { customerId: decoded.customerId },
        attributes: ['eatenDate', 'eatenId']
      })
      res.json({ success: true, customer })
    } catch (err) {
      res.json({ success: false, err })
    }
  })
})

// 회사에 등록
router.post('/enterprise', findEnterprise, (req, res) => {
  var token = req.headers['x-access-token']
  jwt.verify(token, process.env.JWT_KEY, async function (err, decoded) {
    if (err) return res.json({ success: false, err })
    try {
      var member = await Member.findOrCreate({ where: { customerId: decoded.customerId, enterpriseId: req.body.enterpriseId } })
      res.json({ success: true, member })
    } catch (err) {
      res.json({ success: false, err })
    }
  })
})

router.get('/campaign', (req, res) => {
  var token = req.headers['x-access-token']
  var campaign = []
  jwt.verify(token, process.env.JWT_KEY, async function (err, decoded) {
    if (err) return res.json({ success: false, err })
    try {
      campaign = await CampaignLog.findAll({
        include: [{
          model: Campaign,
          attributes: ['sellerId', 'title', 'body', 'transmitDate'],
          include:[{
            model: Seller,
            attributes: ['name']
          }]
        }],
        where: { customerId: decoded.customerId }
      })
    } catch (err) {
      res.json({ success: false, err })
      return
    }
    res.json({ success: true, campaign: campaign })
  })
})

router.post('/campaign', (req, res) => {
  var token = req.headers['x-access-token']
  jwt.verify(token, process.env.JWT_KEY, async function (err, decoded) {
    if (err) return res.json({ success: false, err })
    try {
      var _fcmtoken = req.body.fcmtoken

      var query = 'update Customer set fcmtoken = :fcmtoken where customerId = :customerId;'
      var values = {
        customerId: decoded.customerId,
        fcmtoken: _fcmtoken
      }
      db.sequelize.query(query, { replacements: values }).spread(function (results) { // results 뭐하는건지 모르겠음
        return res.json({ success: true })
      })
    } catch (err) {
      res.json({ success: false, err })
    }
  })
})

module.exports = router

// // 소비자 승인 로그 조회
// router.get('/accept', function (req, res) {
//   var token = req.headers['x-access-token']
//   jwt.verify(token, process.env.JWT_KEY, function (err, decoded) {
//     if (err) return res.json({ success: false, err })
//     else {
//       var query = 'SELECT T1.eatenId, T1.eatenDate, T1.score, T1.enterpriseId, T2.menuName, T2.price FROM EatenLog T1 join Menu T2 WHERE T1.customerId = :customerId AND T1.menuId = T2.menuId;'
//       var values = { // query에서 :customerId -> decode.customerId로 변환
//         customerId: decoded.customerId
//       }
//       db.sequelize.query(query, { replacements: values }).spread(function (results, data) { // results 뭐하는건지 모르겠음
//         return res.json({ success: true, data })
//       })
//     }
//   })
// })

function checkUserRegValidation (req, res, next) { // 중복 확인
  var isValid = true
  async.waterfall(
    [function (callback) {
      Customer.findOne({
        where: { customerId: req.body.customerId }
      }).then((data) => {
        console.log('data1', data)
        if (data) {
          isValid = false
        }
        callback(null, isValid)
      })
    }, function (isValid, callback) {
      Customer.findOne({
        where: { phone: req.body.phone }
      }).then((data) => {
        console.log('data2', data)
        if (data) {
          isValid = false
        }
        callback(null, isValid)
      })
    }], function (err, isValid) {
      if (err) return res.json({ success: false, message: err })
      console.log(isValid)
      if (isValid) {
        return next()
      } else {
        res.json({ success: false, err: 'already ID or email' })
      }
    }
  )
}

// function isLoggedIn (req, res, next) {
//   if (req.isAuthenticated()) {
//     return next()
//   }
//   res.json({ success: false, err: 'required login' })
// }

function checkId (req, res, next) {
  Customer.findOne({
    where: { customerId: req.body.customerId }
  }).then((data) => {
    if (data) {
      res.json({ succes: false, err: '아이디가 존재합니다' })
    } else {
      next()
    }
  })
}

function findEnterprise (req, res, next) {
  Enterprise.findOne({
    where: { enterpriseCode: req.body.enterpriseCode }
  }).then((data) => {
    if (data) {
      req.body.enterpriseId = data.enterpriseId
      next()
    } else {
      return res.json({ success: false, err: '회사를 찾을수없습니다' })
    }
  })
}
