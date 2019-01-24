var express = require('express')
var router = express.Router()

/* GET home page. */
router.get('/', function (req, res, next) {
  const err = new Error('Do something!')
  err.whoami = 'IN GITHUB BRIDGE'
  throw err
})

module.exports = router
