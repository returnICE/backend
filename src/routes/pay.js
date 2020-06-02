var express = require('express')
var router = express.Router()
var db = require('../models/index')
var SubedItem = db.SubedItem
var PayLog = db.PayLog

router.get('/', async function (req, res, next) { // 결제창 생성
  var subId = Number(req.query.subId)
  var customerId = req.query.customerId

  var sellername = ''
  var subname = ''
  var price = 0
  var query = 'SELECT name, subName, price FROM SubItem,Seller WHERE subId = :subId AND SubItem.sellerId = Seller.sellerId;'
  var values = { // query에서 :customerId -> decode.customerId로 변환
    subId: subId
  }
  await db.sequelize.query(query, { replacements: values }).spread(function (results, subdata) { // results 뭐하는건지 모르겠음
    sellername = results[0].name
    subname = results[0].subName
    price = results[0].price
  })

  var customername = ''
  var customerphone = ''
  query = 'SELECT name, phone FROM Customer WHERE customerId = :customerId;'
  values = {
    customerId: customerId
  }
  await db.sequelize.query(query, { replacements: values }).spread(function (results, subdata) { // results 뭐하는건지 모르겠음
    customername = results[0].name
    customerphone = results[0].phone
  })

  res.render('pay.html', {
    sellername: sellername,
    merchant_uid: customerId + subId + 'merchant_' + new Date().getTime(),
    subname: subname,
    price: price,
    subid: subId,
    customerid: customerId,
    customername: customername,
    customerphone: customerphone
  })
})

router.post('/billings', async (req, res) => { // 결제
  try {
    const customerUid = req.body.customer_uid // req의 body에서 customer_uid 추출
    const subId = req.body.subId
    const paymentResult = req.body.paymentResult
    // 인증 토큰 발급 받기
    // const getToken = await axios({
    //   url: 'https://api.iamport.kr/users/getToken',
    //   method: 'post', // POST method
    //   headers: { 'Content-Type': 'application/json' }, // "Content-Type": "application/json"
    //   data: {
    //     imp_key: '1640642301009444', // REST API키
    //     imp_secret: '0QL5gQKrscs6CHpFQsILUbcfd6uoKd5K3QQkHALaNegqWF5N8Ny2ZKidRNBB0Gl4xcoeMaoAoE0lk58t' // REST API Secret
    //   }
    // })
    // const accessToken = getToken.data.response.access_token // 인증 토큰

    // 결제(재결제) 요청
    // const paymentResult = await axios({
    //   url: 'https://api.iamport.kr/subscribe/payments/again',
    //   method: 'post',
    //   headers: { Authorization: accessToken }, // 인증 토큰 Authorization header에 추가
    //   data: {
    //     customer_uid: customerUid,
    //     merchant_uid: customerUid + subId + 'order_' + new Date().getTime(), // 새로 생성한 결제(재결제)용 주문 번호
    //     amount: amount,
    //     name: subname
    //   }
    // })
    var limitTimes = 0
    var term = 0
    var query = 'SELECT limitTimes,term FROM SubItem WHERE subId = :subId;'
    var values = { // query에서 :customerId -> decode.customerId로 변환
      subId: subId
    }
    await db.sequelize.query(query, { replacements: values }).spread(function (results, subdata) { // results 뭐하는건지 모르겠음
      limitTimes = results[0].limitTimes
      term = results[0].term
    })

    const status = paymentResult.status
    if (status === 'paid') { // 카드 정상 승인
      SubedItem.create({
        customerId: customerUid,
        subId: subId,
        startDate: new Date().getTime(),
        endDate: new Date().getTime() + term,
        term: term,
        limitTimes: limitTimes,
        auto: true,
        usedTimes: 0
      })
      PayLog.create({
        customerId: customerUid,
        payDate: new Date().getTime(),
        subId: subId
      })
    } else { // 카드 승인 실패 (ex. 고객 카드 한도초과, 거래정지카드, 잔액부족 등)
      // paymentResult.status : failed 로 수신됩니다.
      res.send({ success: false, message: '승인실패' })
    }
  } catch (e) {
    console.log(e)
    res.status(400).send(e)
  }
})

module.exports = router
