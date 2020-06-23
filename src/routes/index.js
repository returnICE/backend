// 라우팅
var uploadRouter = require('./upload')
var homeRouter = require('./home')
var usersRouter = require('./users')
var sellersRouter = require('./sellers')
var enterprisesRouter = require('./enterprises')
var searchRouter = require('./search')
var acceptsRouter = require('./accepts')
var payRouter = require('./pay')

const express = require('express')
const router = express.Router()

router.use('/', homeRouter)
router.use('/upload', uploadRouter)
router.use('/users', usersRouter)
router.use('/sellers', sellersRouter)
router.use('/enterprises', enterprisesRouter)
router.use('/search', searchRouter)
router.use('/accepts', acceptsRouter)
router.use('/pay', payRouter)

module.exports = router
