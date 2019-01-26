var createError = require('http-errors')
var express = require('express')
var session = require('express-session')
var MemoryStore = require('memorystore')(session)
var path = require('path')
var cookieParser = require('cookie-parser')
var logger = require('morgan')

var indexRouter = require('./routes/index')
var issueRouter = require('./routes/issue')
var loginRouter = require('./routes/login')
var authRouter = require('./routes/auth')

require('dotenv').config()
var app = express()

app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  next()
})
app.use(
  session({
    store: new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
    secret: 'what secret',
    saveUninitialized: false,
    resave: false
  })
)
app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, '/../public')))

app.use('/', indexRouter)

app.use('/issue/:owner/:repo', function (req, res, next) {
  res.locals.owner = req.params.owner
  res.locals.repo = req.params.repo
  next()
})
app.use('/issue', issueRouter)

app.use('/login/:owner/:repo', function (req, res, next) {
  req.session.owner = req.params.owner
  req.session.repo = req.params.repo
  next()
})
app.use('/login', loginRouter)

app.use('/auth', authRouter)

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404))
})

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  res.send({
    message: err.message,
    error: err
  })
})

module.exports = app
