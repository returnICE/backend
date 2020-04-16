var express = require('express')
var Customer = require('../models').Customer
// var User = require('../../models').User;
var router = express.Router()

router.get('/', async (req, res, next) => {
  try {
    const users = await Customer.findAll()
    res.json({ succes: true, data: users })
  } catch (error) {
    res.json({ succes: false, error })
  }
})

module.exports = router
