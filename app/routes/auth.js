import express from 'express'
import request from '@octokit/request'
import asyncHandler from 'express-async-handler'

const router = express.Router()

async function fetchAccessToken (req, code) {
  // POST https://github.com/login/oauth/access_token
  const response = await request('POST /login/oauth/access_token', {
    baseUrl: 'https://github.com',
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
    code: code,
    state: req.session.state,
    headers: {
      accept: 'application/json'
    }
  })

  if (response && response.status === 200) {
    return response.data
  } else {
    throw new Error('Authentication error')
  }
}

function verifyBaseParams (req) {
  if (!req.session.owner) {
    throw new Error('Owner must be specified')
  }
  if (!req.session.repo) {
    throw new Error('Repo must be specified')
  }
}

router.get(
  '/',
  asyncHandler(async (req, res, next) => {
    verifyBaseParams(req)

    const code = req.query.code
    const state = req.query.state
    let redirectUrl = req.session.redirect_url

    try {
      if (!code) {
        throw new Error('No code returned')
      }

      if (state !== req.session.state) {
        throw new Error('Invalid state returned')
      }

      let response = {}
      try {
        response = await fetchAccessToken(req, code)
      } catch (err) {
        throw new Error('Unable to fetch access token')
      }

      const accessToken = response.access_token
      if (!accessToken) {
        throw new Error('Invalid access token')
      }

      redirectUrl = `${redirectUrl}?access_token=${accessToken}`
    } catch (err) {
      redirectUrl = `${redirectUrl}?err=${err.message}`
    }

    res.redirect(redirectUrl)
  })
)

module.exports = router
