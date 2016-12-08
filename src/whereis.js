var UserList = require('./user_list.js')
var pg = require('pg');
var DB_URL = process.env.DATABASE_URL
pg.defaults.ssl = true

/**
 * Returns the location of a user's desk or an error message
 */
function whereis (input) {
  // clean up input
  var user = input.split(' ')[0]    // take first word
  if (user.indexOf('?') > -1) {     // remove potential trailing question mark (ie: /whereis @waldo?)
    user = user.substring(0, user.indexOf('?'))
  }

  var message
  var location

  if (invalidSlackUsername(user)) {        // Check for invalid Slack username
    message = `'${user}' doesn't look like a valid Slack username!`
  } else if (slackUserExists(user)) {      // Check if user exists in Slack (aka SQL sanitize)
    // Check for user location
    if (user === '@waldo') {               // Easter egg: @waldo
      message = `@waldo is 20000 leagues under the sea! http://floating-reef-60921.herokuapp.com/map/20k`
    } else if (userRow = dbUserExists(user)) {       // Check if user exists in db location table
      // get user location for msg
      // location = getLocation(user)
      message = user + `'s desk is:` // + parselocation(location)
    } else {                               // Return suggestion to talk to @waldo to add location
      message = `I don't know where ${user} is.  If you find out, please tell me! (@waldo)`
    }
  } else {                                  // Return error bc user does not exist in Slack
    message = `Hmm... ${user} doesn't seem to be a current Slack user!`
  }

  var response = {
    text: message
    // TODO: add attachment image based on office and floor if one exists
    // attachment : getFloorImage(location)
  }

  return response
}

/**
 * @param location {office, floor, seat}
 */
whereis.updateUser = function updateUser (userId, location) {
  console.log('TODO add update user functionality')
}

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
  return UserList.getUser(username)   // returns undefined=false if user does not exist
}

function dbUserExists (username) {
  userInfo = false;
  pg.connect(DB_URL, function (err, client) {
    if (err) {
      console.log('Failed to connect to postgres: ' + err)
    }

    client
      .query('SELECT * FROM user_locations WHERE username = \'' + username + '\');', function (err, result) {
        if (err) {
          console.log('Error querying database: ' + err)
        } else {
          console.log(result.rows)
          userInfo = result.rows
        }
      })

  return userInfo
}

module.exports = whereis
