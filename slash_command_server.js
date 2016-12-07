var express = require('express')
var bodyParser = require('body-parser')

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

    var message = 'Hold on, I\'m consulting a map...'

    // Handle any help requests
    if (req.body.text === 'help') {
      message = "Need a hand? Try this!"
    }
    // Check if user exists in Slack
    else if (true) {
      // Easter egg: @waldo
      if (req.body.text === '@waldo') {
        message = "20000 leagues under the sea!"
      }
      // Easter egg: @glb
      else if (req.body.text === '@glb') {
        // later call Waldo bot to message with /shrug
      }
      // Check if user exists in db location table
      else if (true) {

      }
      // Return suggestion to talk to @waldo to add location
      else {

      }
    }
    // Return error bc user does not exist in Slack
    else {

    }

    res.json({
      response_type: 'ephemeral',
      text: message
    })
  })

app.listen(PORT, function (err) {
  if (err) {
    return console.error('Error starting server: ', err)
  }

  console.log('Server successfully started on port %s', PORT)
})
