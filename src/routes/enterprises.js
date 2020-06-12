var express = require('express')
var router = express.Router()
var async = require('async')
var crypto = require('crypto')
var jwt = require('jsonwebtoken')
var db = require('../models/index')
var Enterprise = db.Enterprise
var Contract = db.Contract
var Customer = db.Customer
var Member = db.Member

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
        data.pw = ''
        return res.json({ success: true, data })
      }).catch((err) => {
        return res.json({ succes: false, err })
      })
    }
  })
})

// 회사d원조회
router.get('/member', function (req, res) {
  var token = req.headers['x-access-token']
  jwt.verify(token, process.env.JWT_KEY, function (err, decoded) {
    if (err) return res.json({ success: false, err })
    else {
      Member.findAll({
        where: { enterpriseId: decoded.enterpriseId },
        include: [{
          model: Customer,
          attributes: ['customerId', 'name', 'phone', 'birth']
        }]
      }).then((data) => {
        return res.json({ success: true, data })
      }).catch((err) => {
        return res.json({ succes: false, err })
      })
    }
  })
})

// 회사조회
router.put('/member', function (req, res) {
  var token = req.headers['x-access-token']
  jwt.verify(token, process.env.JWT_KEY, function (err, decoded) {
    if (err) return res.json({ success: false, err })
    else {
      Member.update({ ...req.body }, {
        where: { enterpriseId: decoded.enterpriseId, customerId: req.body.customerId }
      }).then(() => {
        return res.json({ success: true })
      }).catch((err) => {
        return res.json({ succes: false, err })
      })
    }
  })
})

// 회사조회
router.delete('/member/:id', function (req, res) {
  var token = req.headers['x-access-token']
  jwt.verify(token, process.env.JWT_KEY, function (err, decoded) {
    if (err) return res.json({ success: false, err })
    else {
      Member.destroy({
        where: { memberId: req.params.id }
      }).then(() => {
        return res.json({ success: true })
      }).catch((err) => {
        return res.json({ succes: false, err })
      })
    }
  })
})
router.post('/contract', function (req, res) {
  var token = req.headers['x-access-token']
  jwt.verify(token, process.env.JWT_KEY, async function (err, decoded) {
    if (err) return res.json({ success: false, err })
    try {
      console.log(new Date(req.body.startDate))
      var contract = await Contract.findOrCreate({ where: { enterpriseId: decoded.enterpriseId, sellerId: req.body.sellerId }, defaults: { ...req.body } })
      return contract[1] ? res.json({ success: true, contract })
        : res.json({ success: false, err: '중복계약' })
    } catch (err) {
      return res.json({ success: false, err })
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
