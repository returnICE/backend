var express = require('express')
var router = express.Router()
var jwt = require('jsonwebtoken')
var db = require('../models/index')
var EatenLog = db.EatenLog

router.post('/customer', function (req, res) {
  var token = req.headers['x-access-token']
  jwt.verify(token, process.env.JWT_KEY, async (err, decoded) => {
    if (err) res.json({ success: false, err })
    EatenLog.create({ ...req.body, eatenDate: new Date(), customerId: decoded.customerId })
      .then((data) => res.json({ success: true, data }))
      .catch((err) => res.json(err))
  })
})

module.exports = router
