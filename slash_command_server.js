var express = require('express')
var bodyParser = require('body-parser')
var whereis = require('./whereis_lookup.js')

var VERIFY_TOKEN = process.env.SLACK_VERIFY_TOKEN
if (!VERIFY_TOKEN) {
  console.error('SLACK_VERIFY_TOKEN is required')
  process.exit(1)
}
var PORT = process.env.PORT || 45678
if (!PORT) {
  console.error('PORT is required')
  process.exit(1)
}

var app = express()

app.route('/whereis')
  .get(function (req, res) {
    res.sendStatus(200)
  })
  .post(bodyParser.urlencoded({ extended: true }), function (req, res) {
    if (req.body.token !== VERIFY_TOKEN) {
      return res.sendStatus(401)
    }

    var response = {}

    // Handle any help requests
    if (req.body.text === 'help') {
      response = whereis.whereisHelp()
    } else if (false) {      // Check if formatted incorrectly for user name
      // TODO: add actual check of username format and more detailed message/attachment
      response = { text: 'That doesn\'t look like a Slack username!'}
    } else {                // Lookup user location
      response = whereis.whereis(req.body.text)
    }

    res.json(response)
  })

app.listen(PORT, function (err) {
  if (err) {
    return console.error('Error starting server: ', err)
  }

  console.log('Server successfully started on port %s', PORT)
})
