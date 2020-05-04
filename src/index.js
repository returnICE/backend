import './env'
var createError = require('http-errors')
var express = require('express')
var path = require('path')
var logger = require('morgan')
// DB 연결

// 라우팅
var uploadRouter = require('./routes/upload')
var homeRouter = require('./routes/home')
var usersRouter = require('./routes/users')
var sellersRouter = require('./routes/sellers')
var searchRouter = require('./routes/search')

var app = express()

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, 'public')))

app.use('/', homeRouter)
app.use('/upload', uploadRouter)
app.use('/users', usersRouter)
app.use('/sellers', sellersRouter)
app.use('/search', searchRouter)

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
  res.render(err)
  next()
})

module.exports = app
