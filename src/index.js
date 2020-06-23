import './env'
var createError = require('http-errors')
var express = require('express')
var path = require('path')
var logger = require('morgan')
var bodyParser = require('body-parser')
// DB 연결
const app = express()
const routes = require('./routes/index')

app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, '../public')))

app.set('views', path.join(__dirname, '/views'))
app.set('view engine', 'ejs')
app.engine('html', require('ejs').renderFile)

const cors = require('cors')

app.use(cors())
app.use('/api', routes)

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404))
})
// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  // render the error page
  res.status(err.status || 500)
  res.json(err)
  next()
})

module.exports = app
