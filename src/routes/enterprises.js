var express = require('express')
var router = express.Router()
var async = require('async')
var crypto = require('crypto')
var jwt = require('jsonwebtoken')
var db = require('../models/index')
var Enterprise = db.Enterprise
var SubItem = db.SubItem
var Menu = db.Menu

router.get('/', async (req, res, next) => {
  try {
    const users = await Enterprise.findAll()
    res.json({ succes: true, data: users })
  } catch (error) {
    res.json({ succes: false, error })
  }
})

router.post('/', makeid, checkUserRegValidation, function (req, res, next) {
  var salt = Math.round((new Date().valueOf() * Math.random()))
  req.body.pw = crypto.createHash('sha512').update(req.body.pw + salt).digest('hex')
  Enterprise.create({ ...req.body, salt: salt })
    .then((data) => { res.json({ success: true, data }) })
    .catch((err) => {
      if (err) return res.json({ success: false, err })
    })
})

router.post('/login', async (req, res, next) => {
  try {
    Enterprise.findByPk(req.body.enterpriseId)
      .then((data) => {
        if (data && data.pw === crypto.createHash('sha512').update(req.body.pw + data.salt).digest('hex')) {
          var payload = {
            enterpriseId: data.enterpriseId
          }
          var options = { expiresIn: 60 * 60 * 24 }
          jwt.sign(payload, process.env.JWT_KEY, options, function (err, token) {
            if (err) return res.json({ success: false, err: err })
            return res.send({ success: true, data: token })
          })
        } else {
          res.json({ succes: false, err: '아이디와 패스워드를 확인해주세요' })
        }
      })
  } catch (err) {
    res.json({ succes: false, err })
  }
})

// 회사 정보 조회
router.get('/myinfo', function (req, res) {
  var token = req.headers['x-access-token']
  jwt.verify(token, process.env.JWT_KEY, function (err, decoded) {
    if (err) return res.json({ success: false, err })
    else {
      Enterprise.findByPk(decoded.enterpriseId).then((data) => {
        delete data.pw
        return res.json({ success: true, data })
      }).catch((err) => {
        return res.json({ succes: false, err })
      })
    }
  })
})

// TODO 구독중인 소비자 현황 개발중
router.get('/customer', (req, res) => {
  var token = req.headers['x-access-token']
  jwt.verify(token, process.env.JWT_KEY, async function (err, decoded) {
    if (err) return res.json({ success: false, err })
    var values = {
      enterpriseId: decoded.enterpriseId
    }
    var customerData = []
    var query = 'SELECT T3.name, T3.phone, T3.birth, T1.subName, T2.endDate, T2.limitTimes, T2.usedTimes, T2.autoPay FROM ( SELECT subName, subId FROM SubItem where SubItem.enterpriseId = :enterpriseId ) as T1 join SubedItem as T2 join Customer as T3 where T1.subId = T2.subId and T2.customerId = T3.customerId;'
    await db.sequelize.query(query, { replacements: values }).spread(function (results, subdata) {
      for (var s of subdata) {
        customerData.push({
          name: s.name,
          phone: s.phone,
          birth: s.birth,
          subName: s.subName,
          endDate: s.endDate,
          limitTimes: s.limitTimes,
          usedTimes: s.usedTimes,
          autopay: s.autoPay
        })
      }
    })
    res.json({ success: true, data: customerData })
  })
})

// TODO 구독권 + 매장 메뉴들 목록 조회
router.get('/product', (req, res) => {
  var token = req.headers['x-access-token']
  jwt.verify(token, process.env.JWT_KEY, async function (err, decoded) {
    if (err) return res.json({ success: false, err })
    //  include: [ { model: Division, include: [ Department ] } ],
    try {
      const subItem = await SubItem.findAll({
        include: [{
          model: Menu,
          attributes: ['menuName'],
          through: { attributes: [] }
        }],
        where: {
          enterpriseId: decoded.enterpriseId
        },
        attributes: ['subId', 'subName', 'info', 'price', 'limitTimes', 'term']
      })
      const menu = await Menu.findAll({
        where: {
          enterpriseId: decoded.enterpriseId
        },
        attributes: ['menuId', 'enterpriseId', 'menuName', 'info', 'price', 'avgScore']
      })
      res.json({ success: true, menu, subItem })
    } catch (err) {
      res.json(err)
    }
  })
})

// TODO 음식점 정보 수정 -> 비밀번호변경
router.put('/myinfo', function (req, res) {
  var token = req.headers['x-access-token']
  jwt.verify(token, process.env.JWT_KEY, function (err, decoded) {
    if (err) return res.json({ success: false, err })
    else {
      if (req.body.pw) {
        var salt = Math.round((new Date().valueOf() * Math.random()))
        var pw = crypto.createHash('sha512').update(req.body.pw + salt).digest('hex')
        Enterprise.update({ pw, salt }, { where: { enterpriseId: decoded.enterpriseId } })
          .then(() => { return res.json({ success: true }) })
          .catch((err) => { return res.json({ success: false, err }) })
      } else {
        Enterprise.update({ ...req.body }, { where: { enterpriseId: decoded.enterpriseId } })
          .then(() => { return res.json({ success: true }) })
          .catch((err) => { return res.json({ success: false, err }) })
      }
    }
  })
})
// TODO 음식점 정보 삭제
router.delete('/myinfo', function (req, res) {
  var token = req.headers['x-access-token']
  jwt.verify(token, process.env.JWT_KEY, function (err, decoded) {
    if (err) return res.json({ success: false, err })
    else {
      Enterprise.destroy({ where: { enterpriseId: decoded.enterpriseId } })
        .then(() => { return res.json({ success: true }) })
        .catch((err) => { return res.json({ success: false, err }) })
    }
  })
})

// 회사 아이디 중복 확인
router.post('/checkid', checkId, function (req, res) {
  res.json({ success: true })
})

module.exports = router

function checkUserRegValidation (req, res, next) { // 중복 확인
  var isValid = true
  async.waterfall(
    [function (callback) {
      Enterprise.findOne({
        where: { enterpriseId: req.body.enterpriseId }
      }).then((data) => {
        if (data) {
          isValid = false
          console.log('중복 ')
        }
        callback(null, isValid)
      })
    }], function (err, isValid) {
      if (err) return res.json({ success: false, message: err })
      if (isValid) {
        return next()
      } else {
        res.json({ success: false, err: 'already ID' })
      }
    }
  )
}
async function makeid (req, res, next) {
  var enterpriseCode = ''
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

  for (var i = 0; i < 5; i++) { enterpriseCode += possible.charAt(Math.floor(Math.random() * possible.length)) }

  try {
    const result = await Enterprise.findAll({ where: { enterpriseCode: enterpriseCode } })
    if (result.length !== 0) {
      return res.json({ success: false, err: '잠시후 다시 시도해주세요' })
    } else {
      req.body.enterpriseCode = enterpriseCode
      return next()
    }
  } catch (err) {
    return res.json({ success: false, err })
  }
}

function checkId (req, res, next) {
  Enterprise.findOne({
    where: { enterpriseId: req.body.enterpriseId }
  }).then((data) => {
    if (data) {
      res.json({ succes: false, err: '아이디가 존재합니다' })
    } else {
      next()
    }
  })
}
