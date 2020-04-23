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
var searchRouter = require('./routes/search')

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
app.use('/search', searchRouter)
// // Swagger setting
// const swaggerJSDoc = require('swagger-jsdoc')
// const swaggerUi = require('swagger-ui-express')
// const swaggerDefinition = {
//   info: {
//     title: 'Turry Mall',
//     version: '1.0.0',
//     description: 'Capstone 쇼핑몰'
//   },
//   host: 'localhost:3000',
//   basePath: '/'
// }
// const options = {
//   swaggerDefinition,
//   apis: ['./routes/index.js']
// }
// const swaggerSpec = swaggerJSDoc(options)
// // Swagger setting fin

// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

// var User = require('mongoose').model('User')
// passport.serializeUser(function (user, done) {
//   done(null, user.id)
// }) // session 생성 시 user개체의 id(DB의 id)를 저장

// passport.deserializeUser(function (id, done) {
//   User.findById(id, function (err, user) {
//     done(err, user)
//   })
// }) // session으로부터 개체 가져올 때 id를 넘겨받아서 DB에서 user찾음

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
