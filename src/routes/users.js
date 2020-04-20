var express = require('express')
var router = express.Router()
var async = require('async')
var crypto = require('crypto')
var jwt = require('jsonwebtoken')
var Customer = require('../models').Customer

router.post('/', checkUserRegValidation, function (req, res, next) {
  var salt = Math.round((new Date().valueOf() * Math.random()))
  req.body.pw = crypto.createHash('sha512').update(req.body.pw + salt).digest('hex')
  Customer.create({ ...req.body, salt: salt }).then((data) => {
    res.json({ success: true, data })
  }).catch((err) => {
    if (err) return res.json({ success: false, message: err })
  })
})

router.post('/login', async (req, res, next) => {
  try {
    Customer.findOne({
      where: { customerId: req.body.customerId }
    }).then((data) => {
      if (data && data.pw === crypto.createHash('sha512').update(req.body.pw + data.salt).digest('hex')) {
        var payload = {
          user: data
        }
        var options = { expiresIn: 60 * 60 * 24 }// 10분 동안만 로그인 유효 -> 후에 수정
        jwt.sign(payload, 'abcd', options, function (err, token) {
          if (err) return res.json({ success: false, message: 'jwt인증 토큰 생성에러' })
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

router.get('/myinfo', function (req, res) {
  var token = req.headers['x-access-token']
  return jwt.verify(token, process.env.jwtKey, function (err, decoded) {
    if (err) return err
    else {
      return res.json({ succes: true, data: decoded })
    }
  })
}) // ID 중복체크

router.put('/myinfo', isLoggedIn, checkUserRegValidation, function (req, res) {
  Customer.findById(req.params.id, req.body, function (err, user) {
    if (err) return res.json({ success: false, message: err })
    if (user.authenticate(req.body.PW)) {
      if (req.body.newPW) {
        req.body.PW = user.hash(req.body.newPW)
      } else {
        delete req.body.PW
      }
      Customer.findByIdAndUpdate(req.params.id, req.body, function (err, user) {
        if (err) return res.json({ success: false, message: err })
        res.json({ success: true, result: req.body })
      })
    } else {
      res.json({ success: false, message: 'Check ID or Password' })
    }
  })
}) // user 정보 수정

router.delete('/myinfo', checkId, function (req, res) {
  console.log('test log1')
  res.json({ success: true })
}) // ID 중복체크

router.post('/checkid', checkId, function (req, res) {
  res.json({ success: true })
}) // ID 중복체크
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

function isLoggedIn (req, res, next) {
  if (req.isAuthenticated()) {
    return next()
  }
  res.json({ success: false, err: 'required login' })
}

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
