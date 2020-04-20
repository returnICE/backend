var createError = require('http-errors')
var express = require('express')
var path = require('path')
var session = require('express-session')
var passport = require('passport')
var logger = require('morgan')

// DB 연결

// var sequelize = require('./models').sequelize;   // mysql 시퀄라이저 모델
// sequelize.sync();    //서버가 실행될때 시퀄라이저의 스키마를 DB에 적용시킨다.

// 라우팅
var uploadRouter = require('./routes/upload')
var homeRouter = require('./routes/home')
var usersRouter = require('./routes/users')
var app = express()

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, 'public')))
app.use(session({
  key: 'sid',
  secret: 'TURRYMALL',
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 24000 * 60 * 60
  }
})) // 세션 설정
app.use(passport.initialize())
app.use(passport.session())

app.use('/', homeRouter)
app.use('/upload', uploadRouter)
app.use('/users', usersRouter)
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
