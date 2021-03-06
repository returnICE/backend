var express = require('express')
var router = express.Router()
var async = require('async')
var crypto = require('crypto')
var jwt = require('jsonwebtoken')
var db = require('../models/index')
var firebase = require('firebase-admin')

var sequelize = require('sequelize')
var schedule = require('node-schedule')

var Seller = db.Seller
var SubItem = db.SubItem
var SubMenu = db.SubMenu
var Menu = db.Menu
var EatenLog = db.EatenLog
var Customer = db.Customer
var Campaign = db.Campaign
var CampaignLog = db.CampaignLog
var Contract = db.Contract
var SubedItem = db.SubedItem

var serviceAccount = require('../config/swcapston-firebase-adminsdk.json')
firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount)
})
var campaignList = {}

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

// 기업 목록 조회
router.get('/enterprise', (req, res) => {
  var token = req.headers['x-access-token']
  jwt.verify(token, process.env.JWT_KEY, async function (err, decoded) {
    if (err) return res.json({ success: false, err })
    var values = {
      sellerId: decoded.sellerId
    }
    var enterpriseData = []
    var query = 'select Enterprise.enterpriseId,Enterprise.name, Enterprise.phone, Enterprise.address, Enterprise.amountPerDay, Contract.approval from Contract, Enterprise where Contract.sellerId = :sellerId and Contract.enterpriseId = Enterprise.enterpriseId;'
    await db.sequelize.query(query, { replacements: values }).spread(async function (results, subdata) {
      for (var s of subdata) {
        enterpriseData.push({
          enterpriseId: s.enterpriseId,
          name: s.name,
          phone: s.phone,
          address: s.address,
          amountPerDay: s.amountPerDay,
          approval: s.approval,
          amountMonth: 0
        })
        var value2 = {
          sellerId: decoded.sellerId,
          enterpriseId: s.enterpriseId
        }
        var query2 = 'select Menu.price, t.enterpriseId, t.eatenDate from Menu, (select EatenLog.enterpriseId, EatenLog.menuId, EatenLog.eatenDate from EatenLog) as t where Menu.sellerId = :sellerId and t.enterpriseId = :enterpriseId and Menu.menuId = t.menuId;'
        await db.sequelize.query(query2, { replacements: value2 }).spread(function (results, subdata) {
          for (var a of subdata) {
            var currentDate = new Date()
            var date = new Date(a.eatenDate)
            if ((currentDate.getFullYear() === date.getFullYear() && currentDate.getMonth() - 1 === date.getMonth()) ||
              (currentDate.getFullYear() - 1 === date.getFullYear && date.getMonth === 11)) {
              enterpriseData[enterpriseData.length - 1].amountMonth += a.price
            }
          }
        })
      }
    })
    res.json({ success: true, data: enterpriseData })
  })
})

// 구독중인 소비자 현황
router.get('/customer', (req, res) => {
  var token = req.headers['x-access-token']
  jwt.verify(token, process.env.JWT_KEY, async function (err, decoded) {
    if (err) return res.json({ success: false, err })
    var values = {
      sellerId: decoded.sellerId
    }
    var customerData = []
    var query = 'SELECT T3.customerId, T3.name, T3.phone, T3.birth, T1.subName, T2.endDate, T2.limitTimes, T2.usedTimes, T2.autoPay FROM ( SELECT subName, subId FROM SubItem where SubItem.sellerId = :sellerId ) as T1 join SubedItem as T2 join Customer as T3 where T1.subId = T2.subId and T2.customerId = T3.customerId;'
    await db.sequelize.query(query, { replacements: values }).spread(function (results, subdata) {
      for (var s of subdata) {
        customerData.push({
          customerId: s.customerId,
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
      res.json({ success: true, data: customerData })
    })
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

// 기업 이용 고객 목록
router.get('/enterprise/customer', (req, res) => {
  var token = req.headers['x-access-token']
  jwt.verify(token, process.env.JWT_KEY, async function (err, decoded) {
    if (err) return res.json({ success: false, err })
    var values = {
      sellerId: decoded.sellerId
    }
    var customerData = []
    var query = 'select Customer.name, Customer.customerId, Customer.birth,  Customer.phone from (select Member.CustomerId from Member, (SELECT enterpriseId from Contract where sellerId = :sellerId) as t where t.enterpriseId = Member.CustomerId) as t2, Customer where t2.customerId = Customer.customerId;'
    await db.sequelize.query(query, { replacements: values }).spread(function (results, subdata) {
      for (var s of subdata) {
        customerData.push({
          customerId: s.customerId,
          name: s.name,
          phone: s.phone,
          birth: s.birth
        })
      }
    })
    res.json({ success: true, data: customerData })
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
        checkSubPrice(decoded.sellerId)
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
      var subId = req.params.subId
      var autoPay = 0
      SubedItem.update({ autoPay }, { where: { subId: subId } })
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
      Menu.destroy({ where: { sellerId: decoded.sellerId, menuId: parseInt(req.params.menuId) } })
        .then(() => { return res.json({ success: true }) })
        .catch((err) => { return res.json({ success: false, err }) })
    }
  })
})

// 음식점 eatenlog
router.get('/accept', (req, res) => {
  var token = req.headers['x-access-token']
  jwt.verify(token, process.env.JWT_KEY, async function (err, decoded) {
    if (err) return res.json({ success: false, err })
    try {
      const customer = await EatenLog.findAll({
        include: [{
          model: Menu,
          attributes: ['menuName', 'price'],
          where: { sellerId: decoded.sellerId }
        }, {
          model: Customer,
          attributes: ['name']
        }],
        attributes: ['eatenDate', 'eatenId']
      })
      res.json({ success: true, customer })
    } catch (err) {
      res.json({ success: false, err })
    }
  })
})

// 기업 승인 로그
router.get('/enterprise/log', (req, res) => {
  var token = req.headers['x-access-token']
  jwt.verify(token, process.env.JWT_Key, async function (err, decoded) {
    if (err) return res.json({ success: false, err })
    try {
      var values = {
        sellerId: decoded.sellerId
      }
      var result = []
      var query = 'SELECT EatenLog.eatenDate, EatenLog.customerId, Menu.menuName, Menu.price, Enterprise.name FROM EatenLog join Menu on EatenLog.menuId = Menu.menuId and Menu.sellerId = :sellerId join Enterprise on EatenLog.enterpriseId = Enterprise.enterpriseId;'
      await db.sequelize.query(query, { replacements: values }).spread(function (results, subdata) {
        for (var s of subdata) {
          result.push(s)
        }
      })
      res.json({ success: true, result })
    } catch (err) {
      res.json({ success: false, err })
    }
  })
})

// 수익
router.get('/data/revenue', (req, res) => {
  var token = req.headers['x-access-token']
  jwt.verify(token, process.env.JWT_KEY, async function (err, decoded) {
    if (err) return res.json({ success: false, err })
    try {
      var values = {
        sellerId: decoded.sellerId
      }
      var query = 'SELECT PayLog.payDate, t1.price from PayLog  join (SELECT SubItem.subId, SubItem.price from SubItem  where SubItem.sellerId = :sellerId) as t1 where ( t1.subId = PayLog.subId )'
      var paylog = []
      var resultPayData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
      var resultsubNumData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
      var resultData = {
        resultPayData: [],
        resultsubNumData: []
      }
      var date = new Date()
      await db.sequelize.query(query, { replacements: values }).spread(function (results, subdata) {
        for (var s of subdata) {
          paylog.push({
            payDate: s.payDate,
            price: s.price
          })
        }
        for (var f of paylog) {
          var payDate = new Date(f.payDate)
          resultPayData[11 - (date.getMonth() - payDate.getMonth())] += f.price
          resultsubNumData[11 - (date.getMonth() - payDate.getMonth())] += 1
        }
      })
      resultData.resultPayData = resultPayData
      resultData.resultsubNumData = resultsubNumData
      res.json({ success: true, resultData })
    } catch (err) {
      res.json({ success: false, err })
    }
  })
})

// 메뉴별 별점
router.get('/data/menu', (req, res) => {
  var token = req.headers['x-access-token']
  jwt.verify(token, process.env.JWT_KEY, async function (err, decoded) {
    if (err) return res.json({ success: false, err })
    try {
      var values = {
        sellerId: decoded.sellerId
      }
      var query = 'select t1.menuId, t1.menuName, EatenLog.eatenDate, EatenLog.score from (select menuId, menuName from Menu where Menu.sellerId = :sellerId) as t1 join EatenLog where (EatenLog.menuId = t1.menuId)'
      var date = new Date()
      var data = []
      await db.sequelize.query(query, { replacements: values }).spread(function (results, subdata) {
        for (const s of subdata) {
          var check = false
          var tempDate = new Date(s.eatenDate)
          for (let i = 0; i < data.length; i++) {
            if (data[i].menuId === s.menuId) {
              check = true
              data[i].score[11 - (date.getMonth() - tempDate.getMonth())] += s.score
              data[i].count[11 - (date.getMonth() - tempDate.getMonth())] += 1
            }
          }
          if (check === false) {
            data.push({
              menuId: s.menuId,
              menuName: s.menuName,
              count: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
              score: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
            })
            data[data.length - 1].count[11 - (date.getMonth() - tempDate.getMonth())] += 1
            data[data.length - 1].score[11 - (date.getMonth() - tempDate.getMonth())] += s.score
          }
        }
      })
      res.json({ success: true, data })
    } catch (err) {
      res.json({ success: false, err })
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
      if (req.body.pw) {
        var salt = Math.round((new Date().valueOf() * Math.random()))
        var pw = crypto.createHash('sha512').update(req.body.pw + salt).digest('hex')
        Seller.update({ pw, salt }, { where: { sellerId: decoded.sellerId } })
          .then(() => { return res.json({ success: true }) })
          .catch((err) => { return res.json({ success: false, err }) })
      } else {
        Seller.update({ ...req.body }, { where: { sellerId: decoded.sellerId } })
          .then(() => { return res.json({ success: true }) })
          .catch((err) => { return res.json({ success: false, err }) })
      }
    }
  })
})
// 승인
router.put('/enterprise/accept', function (req, res) {
  var token = req.headers['x-access-token']
  jwt.verify(token, process.env.JWT_KEY, function (err, decoded) {
    if (err) return res.json({ success: false, err })
    else {
      var enterpriseId = req.body.enterpriseId
      var approval = 1
      const startDate = new Date()
      Contract.update({ approval, startDate }, { where: { sellerId: decoded.sellerId, enterpriseId: enterpriseId } })
        .then(() => { return res.json({ success: true }) })
        .catch((err) => { return res.json({ success: false, err }) })
    }
  })
})
// 거부
router.put('/enterprise/deny', function (req, res) {
  var token = req.headers['x-access-token']
  jwt.verify(token, process.env.JWT_KEY, function (err, decoded) {
    if (err) return res.json({ success: false, err })
    else {
      var enterpriseId = req.body.enterpriseId
      var approval = 2
      Contract.update({ approval }, { where: { sellerId: decoded.sellerId, enterpriseId: enterpriseId } })
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

// 캠페인 삭제
router.delete('/campaign/:campaignId', function (req, res) {
  var token = req.headers['x-access-token']
  jwt.verify(token, process.env.JWT_KEY, async function (err, decoded) {
    if (err) return res.json({ success: false, err })
    else {
      if (campaignList[req.params.campaignId.toString()] !== undefined) {
        campaignList[req.params.campaignId.toString()].cancel()
        delete campaignList[req.params.campaignId.toString()]
      }
      await Campaign.destroy({ where: { sellerId: decoded.sellerId, campaignId: req.params.campaignId } })
        .then(() => { return res.json({ success: true }) })
        .catch((err) => { return res.json({ success: false, err }) })
      await CampaignLog.destroy({ where: { campaignId: req.params.campaignId } })
        .then(() => { return res.json({ success: true }) })
        .catch((err) => { return res.json({ success: false, err }) })
    }
  })
})
// 캠페인 조회
router.get('/campaign', (req, res) => {
  var token = req.headers['x-access-token']
  jwt.verify(token, process.env.JWT_KEY, async function (err, decoded) {
    if (err) return res.json({ success: false, err })
    var values = {
      sellerId: decoded.sellerId
    }
    var campaignData = []
    var query = 'SELECT campaignId, transmitDate, body, targetOp, title from Campaign where Campaign.sellerId = :sellerId;'
    await db.sequelize.query(query, { replacements: values }).spread(function (results, subdata) {
      for (var s of subdata) {
        campaignData.push({
          campaignId: s.campaignId,
          transmitDate: s.transmitDate,
          body: s.body,
          targetOp: s.targetOp,
          title: s.title
        })
      }
    })
    res.json({ success: true, data: campaignData })
  })
})

router.post('/campaign', async (req, res) => {
  var token = req.headers['x-access-token']
  jwt.verify(token, process.env.JWT_KEY, async function (err, decoded) {
    if (err) return res.json({ success: false, err })
    var customer = {}
    var title = req.body.title
    var body = req.body.body
    var sellername = req.body.sellername
    console.log(req.body)

    var cst = req.body.target
    try {
      customer = await Customer.findAll({
        where: { customerId: cst },
        attributes: [[sequelize.literal('DISTINCT `fcmtoken`'), 'fcmtoken']],
        raw: true
      })
    } catch (err) {
      res.json({ success: false, err })
      return
    }
    var fcmTargetTokenList = customer.map((v) => { return v.fcmtoken })
    var date = new Date(req.body.transmitDate)
    var fcmMessage = {
      notification: {
        title: title,
        body: body
      },
      data: {
        sellername: sellername,
        sendtime: (new Date()).toDateString.toString()
      },
      tokens: fcmTargetTokenList
    }
    var j = schedule.scheduleJob(date, function () {
      firebase.messaging().sendMulticast(fcmMessage)
        .then(() => {
          console.log('메세지 성공')
        }).catch((err) => {
          console.log(err)
        })
    })
    Campaign.create({ ...req.body, sellerId: decoded.sellerId }).then((data) => {
      var camplog = cst.map((v) => {
        return { customerId: v, campaignId: data.campaignId }
      })
      console.log(camplog)
      CampaignLog.bulkCreate(camplog).then((data) => {
        console.log('캠페인 로그 생성')
      })
      campaignList[data.campaignId.toString()] = j
      console.log(data.campaignId.toString() + ' ' + campaignList[data.campaignId.toString()])
    }).catch((err) => {
      res.json({ success: false, err })
    })
    res.json({ success: true })
  })
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

async function checkSubPrice (sellerId) {
  var values = {
    sellerId: sellerId
  }
  var query = 'select SubItem.price from SubItem where SubItem.sellerId = :sellerId'
  await db.sequelize.query(query, { replacements: values }).spread(function (results, subdata) {
    var minPrice = 0x0fffffff
    for (var s of subdata) {
      if (s.price < minPrice) {
        minPrice = s.price
      }
    }
    Seller.update({ minPrice }, { where: { sellerId: sellerId } })
  })
}
