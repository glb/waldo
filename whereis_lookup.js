module.exports = {
  whereis: function (user) {
    var responseType = 'ephemeral'  // defaultm used for all error message responses
    var message = ''

    if (true) {                        // Check if user exists in Slack
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
  },

  whereisHelp: function () {
    var response = {
      text: 'Need a hand? Try asking \'/whereis @waldo\' or message @waldo and ask for help.'
    }
    return response
  }
}

