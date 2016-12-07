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

    var responseType = 'ephemeral'  // default for all help/error message responses
    var message = ''

    // Handle any help requests
    if (req.body.text === 'help') {
      message = 'Need a hand? Try asking \'/whereis @waldo\' or message @waldo and ask for help.'
    } else if (true) {                        // Check if user exists in Slack
      var user = req.body.text

      // Easter egg: @glb
      if (user === '@glb') {
        // TODO: call Waldo bot to message with /shrug and make sure actual location also given
      }

      // Check for user location
      if (user === '@waldo') {                // Easter egg: @waldo
        responseType = 'in_channel'
        message = '@waldo is 20000 leagues under the sea!'
      } else if (false) {                     // Check if user exists in db location table
        responseType = 'in_channel'
        message = user + ' is ???'        // get user location for msg
      } else {                                // Return suggestion to talk to @waldo to add location
        message = 'I don\'t know where ' + user + ' is.  If you find out, please message @waldo and tell me!'
      }
    } else {                                  // Return error bc user does not exist in Slack
      message = 'Hmm... ' + req.body.text + 'doesn\'t seem to be a current Slack user!'
    }

    res.json({
      response_type: responseType,
      text: message
    })
  })

app.listen(PORT, function (err) {
  if (err) {
    return console.error('Error starting server: ', err)
  }

  console.log('Server successfully started on port %s', PORT)
})
