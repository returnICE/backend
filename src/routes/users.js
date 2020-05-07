var express = require('express')
var router = express.Router()
var async = require('async')
var crypto = require('crypto')
var jwt = require('jsonwebtoken')
var Customer = require('../models').Customer
var subedItem = require('../models').subedItem

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

// 구독중인 음식점 조회 - 개발중
router.get('/sub', function (req, res) {
  Customer.findAll({ include: [{ model: subedItem, attributes: ['subid'] }] }, req.params.id, function (err) {
    if (err) return res.json({ success: false, message: err })
    else return res.json({ succes: true })
  })
})

module.exports = router

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
