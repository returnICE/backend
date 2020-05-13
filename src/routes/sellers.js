var express = require('express')
var router = express.Router()
var async = require('async')
var crypto = require('crypto')
var jwt = require('jsonwebtoken')
var db = require('../models/index')
var Seller = db.Seller
var SubItem = db.SubItem
var SubMenu = db.SubMenu
var Menu = db.Menu

router.get('/', async (req, res, next) => {
  try {
    const users = await Seller.findAll()
    res.json({ succes: true, data: users })
  } catch (error) {
    res.json({ succes: false, error })
  }
})

router.post('/', checkUserRegValidation, function (req, res, next) {
  var salt = Math.round((new Date().valueOf() * Math.random()))
  req.body.pw = crypto.createHash('sha512').update(req.body.pw + salt).digest('hex')
  Seller.create({ ...req.body, salt: salt })
    .then((data) => { res.json({ success: true, data }) })
    .catch((err) => {
      if (err) return res.json({ success: false, err })
    })
})

router.post('/login', async (req, res, next) => {
  try {
    Seller.findByPk(req.body.sellerId)
      .then((data) => {
        if (data && data.pw === crypto.createHash('sha512').update(req.body.pw + data.salt).digest('hex')) {
          var payload = {
            sellerId: data.sellerId
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

// 구독중인 소비자 현황 - 개발중
router.get('/customer', (req, res) => {
  var token = req.headers['x-access-token']
  jwt.verify(token, process.env.JWT_KEY, async function (err, decoded) {
    if (err) return res.json({ success: false, err })
    try{
      var values = {
        sellerId: decoded.sellerId
      }
      var customerData = []
      var query = "SELECT T3.name, T3.phone, T3.birth, T1.subName, T2.endDate, T2.limitTimes, T2.usedTimes, T2.autoPay FROM ( SELECT subName, subId FROM SubItem where SubItem.sellerId = :sellerId ) as T1 join SubedItem as T2 join Customer as T3 where T1.subId = T2.subId and T2.customerId = T3.customerId;"
      await db.sequelize.query(query, {replacements: values }).spread(function (results, subdata) {
        for (var s of subdata){
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
    }catch{
      res.json(err)
    }
  })
})

// 구독권 + 매장 메뉴들 목록 조회
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
          sellerId: decoded.sellerId
        },
        attributes: ['subId', 'subName', 'info', 'price', 'limitTimes', 'term']
      })
      const menu = await Menu.findAll({
        where: {
          sellerId: decoded.sellerId
        },
        attributes: ['menuId', 'sellerId', 'menuName', 'info', 'price', 'avgScore']
      })
      res.json({ success: true, menu, subItem })
    } catch (err) {
      res.json(err)
    }
  })
})

// 메뉴 추가
router.post('/product/menu', (req, res) => {
  var token = req.headers['x-access-token']
  jwt.verify(token, process.env.JWT_KEY, function (err, decoded) {
    if (err) return res.json({ success: false, err })
    Menu.create({ ...req.body, sellerId: decoded.sellerId }).then((data) => {
      res.json({ success: true, data })
    }).catch((err) => {
      res.json({ success: false, err })
    })
  })
})

// 구독권 추가
router.post('/product/sub', (req, res) => {
  var token = req.headers['x-access-token']
  jwt.verify(token, process.env.JWT_KEY, function (err, decoded) {
    if (err) return res.json({ success: false, err })
    SubItem.create({ ...req.body, sellerId: decoded.sellerId }).then((result) => {
      var arr = []
      req.body.menuId.map((menuId) => arr.push({ menuId, subId: result.subId }))
      SubMenu.bulkCreate(arr).then((data) => {
        res.json({ success: true, data })
      }).catch((err) => {
        res.json({ success: false, err })
      })
    }).catch((err) => {
      res.json({ success: false, err })
    })
  })
})

// 음식점 구독권 삭제
router.delete('/product/sub/:subId', function (req, res) {
  var token = req.headers['x-access-token']
  jwt.verify(token, process.env.JWT_KEY, function (err, decoded) {
    if (err) return res.json({ success: false, err })
    else {
      console.log(req.params.subId)
      SubItem.destroy({ where: { sellerId: decoded.sellerId, subId: req.params.subId } })
        .then(() => { return res.json({ success: true }) })
        .catch((err) => { return res.json({ success: false, err }) })
    }
  })
})

// 음식점 메뉴 삭제
router.delete('/product/menu/:menuId', function (req, res) {
  var token = req.headers['x-access-token']
  jwt.verify(token, process.env.JWT_KEY, function (err, decoded) {
    if (err) return res.json({ success: false, err })
    else {
      console.log(req.params.menuId)
      Menu.destroy({ where: { sellerId: decoded.sellerId, menuId: req.params.menuId } })
        .then(() => { return res.json({ success: true }) })
        .catch((err) => { return res.json({ success: false, err }) })
    }
  })
})

// 음식점 정보 조회
router.get('/myinfo', function (req, res) {
  var token = req.headers['x-access-token']
  jwt.verify(token, process.env.JWT_KEY, function (err, decoded) {
    if (err) return res.json({ success: false, err })
    else {
      Seller.findByPk(decoded.sellerId)
        .then((data) => {
          delete data.pw
          return res.json({ succes: true, data })
        }).catch((err) => {
          return res.json({ success: false, err })
        })
    }
  })
})

// 음식점 정보 수정 -> 비밀번호변경
router.put('/myinfo', function (req, res) {
  var token = req.headers['x-access-token']
  jwt.verify(token, process.env.JWT_KEY, function (err, decoded) {
    if (err) return res.json({ success: false, err })
    else {
      var salt = Math.round((new Date().valueOf() * Math.random()))
      var pw = crypto.createHash('sha512').update(req.body.pw + salt).digest('hex')
      Seller.update({ pw, salt }, { where: { sellerId: decoded.sellerId } })
        .then(() => { return res.json({ success: true }) })
        .catch((err) => { return res.json({ success: false, err }) })
    }
  })
})

// 음식점 정보 삭제
router.delete('/myinfo', function (req, res) {
  var token = req.headers['x-access-token']
  jwt.verify(token, process.env.JWT_KEY, function (err, decoded) {
    if (err) return res.json({ success: false, err })
    else {
      Seller.destroy({ where: { sellerId: decoded.sellerId } })
        .then(() => { return res.json({ success: true }) })
        .catch((err) => { return res.json({ success: false, err }) })
    }
  })
})

// 음식점 아이디 중복 확인
router.post('/checkid', checkId, function (req, res) {
  res.json({ success: true })
})

module.exports = router

function checkUserRegValidation (req, res, next) { // 중복 확인
  var isValid = true
  async.waterfall(
    [function (callback) {
      Seller.findOne({
        where: { sellerId: req.body.sellerId }
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

// function isLoggedIn (req, res, next) {
//   if (req.isAuthenticated()) {
//     return next()
//   }
//   res.json({ success: false, err: 'required login' })
// }

function checkId (req, res, next) {
  Seller.findOne({
    where: { sellerId: req.body.sellerId }
  }).then((data) => {
    if (data) {
      res.json({ succes: false, err: '아이디가 존재합니다' })
    } else {
      next()
    }
  })
}
