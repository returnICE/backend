var express = require('express')
// var User = require('../../models').User;
var router = express.Router()

router.get('/', (req, res, next) => {
  res.render('../public/index.html')
})

module.exports = router
