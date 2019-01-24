import express from 'express'
import request from '@octokit/request'
import App from '@octokit/app'
import asyncHandler from 'express-async-handler'
import Handlebars from 'handlebars'
import { Base64 } from 'js-base64'
import { readFileSync } from 'fs'

import * as errorCodes from '../data/errorCodes'

const PRIVATE_KEY = readFileSync('private-key.pem', 'utf8')

const router = express.Router()

function verifyBaseParams (req, res) {
  if (!res.locals.owner) {
    throw new Error('Owner must be specified')
  }
  if (!res.locals.repo) {
    throw new Error('Repo must be specified')
  }
}

function getQueryTitle (req) {
  const title = req.query.title

  if (!title) {
    throw new Error('Title must be specified')
  }

  return title
}

function getQueryPath (req) {
  let path = req.query.path
  if (path.charAt(0) === '/') path = path.slice(1)

  if (!path) {
    throw new Error('Path must be specified')
  }

  return path
}

function getQueryAccessToken (req) {
  const accessToken = req.query.access_token

  if (!accessToken) {
    throw new Error('Access token must be specified')
  }

  return accessToken
}

async function loadFileContents (path, res, iaToken) {
  try {
    const response = await request('GET /repos/:owner/:repo/contents/:path', {
      owner: res.locals.owner,
      repo: res.locals.repo,
      path: path,
      headers: {
        authorization: `token ${iaToken}`,
        accept: 'application/vnd.github.machine-man-preview+json'
      }
    })
    if (response.status === 200) {
      if (response.data.encoding === 'base64' && response.data.content) {
        return response.data.content
      }
    }
  } catch (err) {
    return undefined
  }
}

async function createIssue (title, body, res, accessToken) {
  try {
    const response = await request('POST /repos/:owner/:repo/issues', {
      owner: res.locals.owner,
      repo: res.locals.repo,
      title: title,
      body: body,
      headers: {
        authorization: `token ${accessToken}`,
        accept: 'application/vnd.github.machine-man-preview+json'
      }
    })
    return response
  } catch (err) {
    throw err
  }
}

async function addLabelToIssue (issueNumber, label, res, iaToken) {
  try {
    const response = await request(
      'POST /repos/:owner/:repo/issues/:number/labels',
      {
        owner: res.locals.owner,
        repo: res.locals.repo,
        number: issueNumber,
        labels: ['draft-content'],
        headers: {
          authorization: `token ${iaToken}`,
          accept: 'application/vnd.github.symmetra-preview+json'
        }
      }
    )
    return response
  } catch (err) {
    throw err
  }
}

async function addIssueToProject (issueId, columnId, res, iaToken) {
  try {
    const response = await request('POST /projects/columns/:column_id/cards', {
      column_id: columnId,
      content_id: issueId,
      content_type: 'Issue',
      headers: {
        authorization: `token ${iaToken}`,
        accept: 'application/vnd.github.inertia-preview+json'
      }
    })
    return response
  } catch (err) {
    throw err
  }
}

async function fetchInstallationAccessToken (res) {
  const app = new App({
    id: process.env.APP_ID,
    privateKey: PRIVATE_KEY
  })

  const jwt = await app.getSignedJsonWebToken()

  const response = await request('GET /repos/:owner/:repo/installation', {
    owner: res.locals.owner,
    repo: res.locals.repo,
    headers: {
      authorization: `Bearer ${jwt}`,
      accept: 'application/vnd.github.machine-man-preview+json'
    }
  })
  const installationId = response.data.id
  const iaToken = await app.getInstallationAccessToken({
    installationId
  })
  return iaToken
}

//
// CREATE NEW ISSUE
//

router.get(
  '/:owner/:repo/create',
  asyncHandler(async (req, res, next) => {
    verifyBaseParams(req, res)

    const title = getQueryTitle(req)
    const path = getQueryPath(req)
    const accessToken = getQueryAccessToken(req)

    const data = {
      owner: res.locals.owner,
      repo: res.locals.repo,
      title: title,
      path: path
    }

    const iaToken = await fetchInstallationAccessToken(res)

    if (!iaToken) {
      const err = new Error('No installation access token found')
      err.code = errorCodes.NO_INSTALLATION_TOKEN
      err.status = 404
      throw err
    }

    // CREATE ISSUE

    let newIssue64 = await loadFileContents(path, res, iaToken)

    if (!newIssue64) {
      const err = new Error('No issue template found')
      err.code = errorCodes.NO_ISSUE_TEMPLATE_FOUND
      err.status = 404
      throw err
    }

    let newIssueStr = Base64.decode(newIssue64)
    const handlebars = Handlebars.compile(newIssueStr)
    newIssueStr = handlebars(data)

    let issueResponse = await createIssue(title, newIssueStr, res, accessToken)

    if (!issueResponse.status === 201) {
      throw new Error("Couldn't create issue")
    }

    // ADD LABEL TO ISSUE

    await addLabelToIssue(
      issueResponse.data.number,
      'draft-content',
      res,
      iaToken
    )

    // ADD ISSUE TO PROJECT

    await addIssueToProject(
      issueResponse.data.id,
      process.env.NEW_ISSUE_PROJECT_COLUMN_ID,
      res,
      iaToken
    )

    res.send(issueResponse)
  })
)

module.exports = router
