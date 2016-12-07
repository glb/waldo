var SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN

var utils = require('./libs/utils.js')
import slack from 'slack-promise'

module.exports = {
  // Returns the location of a user's desk or an error message
  whereis: function (user) {
    var responseType = 'ephemeral'  // default used for all error message responses
    var message = ''

    if (invalidSlackUsername(user)) {        // Check for invalid Slack username
      message = '\'' + user + '\' doesn\'t look like a valid Slack username!'
    } else if (slackUserExists(user)) {                        // Check if user exists in Slack
      // Easter egg: @glb
      if (user === '@glb') {
        // TODO: call Waldo bot to message with /shrug and make sure actual location also given
      }

      // Check for user location
      if (user === '@waldo') {                // Easter egg: @waldo
        responseType = 'in_channel'
        message = '@waldo is 20000 leagues under the sea!'
      } else if (false) {                 // Check if user exists in db location table
        responseType = 'in_channel'
        message = user + ' is ???'        // get user location for msg
      } else {                                // Return suggestion to talk to @waldo to add location
        message = 'I don\'t know where ' + user + ' is.  If you find out, please message @waldo and tell me!'
      }
    } else {                                  // Return error bc user does not exist in Slack
      message = 'Hmm... ' + user + 'doesn\'t seem to be a current Slack user!'
    }

    var response = {
      response_type: responseType,
      text: message
    }

    return response

    // Check for an invalid Slack username
    function invalidSlackUsername (username) {
      // Dec 7 2016:
        // Usernames must be all lowercase, <= 21 characters (@x + up to 20 more)
        // Start with letter or number, contain only those and periods, hyphens, and underscores.
      var valid = /^@[a-z0-9][a-z0-9._-]{0,20}$/.test(username)
      return !valid
    }

    // Check if the user exists in Slack
    function slackUserExists (username) {
      slack.users.list({SLACK_BOT_TOKEN})
      .then(res => {
        return utils.find(res.members, { name: username })
      })
      .fail(res => {
        return false
      })
    }
  },

  // Returns
  whereisHelp: function () {
    var response = {
      text: 'Need a hand? Try asking \'/whereis @waldo\' or message @waldo and ask for help.'
    }
    return response
  }
}

