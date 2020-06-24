var express = require('express')
var router = express.Router()
var db = require('../models/index')
var SubedItem = db.SubedItem
var PayLog = db.PayLog
var Contract = db.Contract
var axios = require('axios')

router.get('/customer', async function (req, res, next) { // 결제창 생성
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

  res.render('paycustomer.html', {
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

router.post('/billingsC', async (req, res) => { // 결제
  try {
    const customerUid = req.body.customer_uid // req의 body에서 customer_uid 추출
    const subId = req.body.subId
    const price = req.body.price
    const subname = req.body.subname
    const merchantUid = req.body.merchant_uid
    const paymentResult = req.body.paymentResult
    const customername = req.body.customername
    const customerphone = req.body.customerphone

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
        subId: subId,
        merchant_uid: merchantUid
      })

      const getToken = await axios({
        url: 'https://api.iamport.kr/users/getToken',
        method: 'post', // POST method
        headers: { 'Content-Type': 'application/json' }, // "Content-Type": "application/json"
        data: {
          imp_key: '1640642301009444', // REST API키
          imp_secret: '0QL5gQKrscs6CHpFQsILUbcfd6uoKd5K3QQkHALaNegqWF5N8Ny2ZKidRNBB0Gl4xcoeMaoAoE0lk58t' // REST API Secret
        }
      })
      const { access_token: accessToken } = getToken.data.response // 인증 토큰
      var date = new Date()
      date.setMonth(date.getMonth() + 1)
      var unixtimestamp = Math.floor(date.getTime() / 1000)
      axios({
        url: 'https://api.iamport.kr/subscribe/payments/schedule',
        method: 'post',
        headers: { Authorization: accessToken }, // 인증 토큰 Authorization header에 추가
        data: {
          customer_uid: customerUid, // 카드(빌링키)와 1:1로 대응하는 값
          schedules: [
            {
              merchant_uid: customerUid + subId + 'merchant_' + date, // 주문 번호
              schedule_at: unixtimestamp, // 결제 시도 시각 in Unix Time Stamp. ex. 다음 달 1일
              amount: price,
              name: subname,
              buyer_name: customername,
              buyer_tel: customerphone,
              buyer_email: ''
            }
          ]
        }
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
router.post('/schedule', async function (req, res) {
  try {
    const { imp_uid: impUid, merchant_uid: merchantUid } = req.body
    // 액세스 토큰(access token) 발급 받기
    const getToken = await axios({
      url: 'https://api.iamport.kr/users/getToken',
      method: 'post', // POST method
      headers: { 'Content-Type': 'application/json' }, // "Content-Type": "application/json"
      data: {
        imp_key: '1640642301009444', // REST API키
        imp_secret: '0QL5gQKrscs6CHpFQsILUbcfd6uoKd5K3QQkHALaNegqWF5N8Ny2ZKidRNBB0Gl4xcoeMaoAoE0lk58t' // REST API Secret
      }
    })
    const { access_token: accessToken } = getToken.data.response // 인증 토큰
    // imp_uid로 아임포트 서버에서 결제 정보 조회
    const getPaymentData = await axios({
      url: `https://api.iamport.kr/payments/${impUid}`, // imp_uid 전달
      method: 'get', // GET method
      headers: { Authorization: accessToken } // 인증 토큰 Authorization header에 추가
    })
    const paymentData = getPaymentData.data.response // 조회한 결제 정보
    const { status } = paymentData
    if (status === 'paid') { // 결제 완료
      const price = paymentData.paid_amount
      const subname = paymentData.name
      const customername = paymentData.buyer_name
      const customerphone = paymentData.buyer_tel
      const customerUid = paymentData.customer_uid
      const subId = parseInt(merchantUid.substring(customerUid.length))

      PayLog.create({
        customerId: customerUid,
        payDate: new Date().getTime(),
        subId: subId,
        merchant_uid: merchantUid
      })

      var date = new Date()
      date.setMonth(date.getMonth() + 1)
      var unixtimestamp = Math.floor(date.getTime() / 1000)
      axios({
        url: 'https://api.iamport.kr/subscribe/payments/schedule',
        method: 'post',
        headers: { Authorization: accessToken }, // 인증 토큰 Authorization header에 추가
        data: {
          customer_uid: customerUid, // 카드(빌링키)와 1:1로 대응하는 값
          schedules: [
            {
              merchant_uid: customerUid + subId + 'merchant_' + date, // 주문 번호
              schedule_at: unixtimestamp, // 결제 시도 시각 in Unix Time Stamp. ex. 다음 달 1일
              amount: price,
              name: subname,
              buyer_name: customername,
              buyer_tel: customerphone,
              buyer_email: ''
            }
          ]
        }
      })
    } else {
      // 재결제 시도
    }
  } catch (e) {
    res.status(400).send(e)
  }
})

router.post('/enterprisecheck', async function (req, res, next) { // 결제창 생성
  try {
    const { imp_uid: impUid } = req.body
    const contractId = req.body.contractId
    // const contractId = req.body.contractId;
    const getToken = await axios({
      url: 'https://api.iamport.kr/users/getToken',
      method: 'post', // POST method
      headers: { 'Content-Type': 'application/json' }, // "Content-Type": "application/json"
      data: {
        imp_key: '1640642301009444', // REST API키
        imp_secret: '0QL5gQKrscs6CHpFQsILUbcfd6uoKd5K3QQkHALaNegqWF5N8Ny2ZKidRNBB0Gl4xcoeMaoAoE0lk58t' // REST API Secret
      }
    })
    const { access_token: accessToken } = getToken.data.response // 인증 토큰
    const getPaymentData = await axios({
      url: `https://api.iamport.kr/payments/${impUid}`, // imp_uid 전달
      method: 'get', // GET method
      headers: { Authorization: accessToken } // 인증 토큰 Authorization header에 추가
    })
    const paymentData = getPaymentData.data.response // 조회한 결제 정보

    const { status } = paymentData
    if (status === 'paid') {
      var date = new Date()
      date.setMonth(date.getMonth() + 1)
      Contract.update({ paymentDay: date }, { where: { contractId: contractId } })
        .then(() => { return res.json({ success: true }) })
        .catch((err) => { return res.json({ success: false, err }) })
      res.send({ status: 'success', message: '일반 결제 성공' })
      return
    } else {
      res.send({ status: 'forgery', message: '결제 거부' })
      return
    }
  } catch (e) {
    console.log(e)
    res.status(400).send(e)
  }
})

module.exports = router
