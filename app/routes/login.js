var express = require('express')
var crypto = require('crypto')

var router = express.Router()

function generateState (req) {
  var state = crypto.randomBytes(20).toString('hex')
  req.session.state = state
  return state
}

router.get('/:owner/:repo', function (req, res, next) {
  req.session.redirect_url = req.query.redirect_url

  const uri = `https://github.com/login/oauth/authorize?client_id=${
    process.env.CLIENT_ID
  }&redirect_uri=${process.env.SERVER_URL}/auth&state=${generateState(req)}`
  res.header('accept', 'application/vnd.github.machine-man-preview+json')
  res.redirect(uri)
})

module.exports = router
