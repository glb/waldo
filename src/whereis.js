var UserList = require('./user_list.js')
var pg = require('pg')
var DB_URL = process.env.DATABASE_URL
pg.defaults.ssl = true

var userList = new UserList(process.env.SLACK_BOT_TOKEN)
/**
 * Returns the location of a user's desk or an error message
 */
function whereis (input) {
  // clean up input
  var username = input.split(' ')[0]    // take first word
  if (username.indexOf('?') > -1) {     // remove potential trailing question mark (ie: /whereis @waldo?)
    username = username.substring(0, username.indexOf('?'))
  }

  var message

  if (invalidSlackUsername(username)) {
    return Promise.resolve({text: `'${username}' doesn't look like a valid Slack username!`})
  }

    // Check if user exists in Slack (+SQL sanitize)
  return slackUserExists(username.substring(1))
    .then(user => {
      if (user) {
        // Check for user location
        if (user.name === 'waldo') {               // Easter egg: @waldo
          return {
            text: `@waldo is 20000 leagues under the sea!`,
            attachments: [
              {
                fallback: 'http://floating-reef-60921.herokuapp.com/map/20k',
                image_url: 'http://floating-reef-60921.herokuapp.com/map/20k'
              }
            ]
          }
        } else {
          dbUserExists(username)
            .then(userRow => {
              if (userRow) {
                message = username + ' location:\n' + printLocation(userRow)
              } else {                               // Return suggestion to talk to @waldo to add location
                message = `I don't know where ${username} is.  If you find out, please tell me! (@waldo)`
              }
              return {
                text: message
                // attachment : getFloorImage(location)
              }
            })
            .catch(() => {
              return {text: `Hmm... something went wrong with my database when searching for ${username}`}
            })
        }
      } else {                                  // Return error bc user does not exist in Slack
        message = `Hmm... ${username} doesn't seem to be a current Slack user!`
      }

      return {text: message}
    })
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
  return userList.getUser(username)   // returns undefined=false if user does not exist
}

function dbUserExists (username) {
  let promise = new Promise()

  // consult the map

  /** pg.connect(DB_URL, function (err, client) {
    if (err) {
      console.error('Failed to connect to postgres: ', err)
      promise.reject(err)
    }

    var queryString = 'SELECT * FROM user_locations WHERE username = \'' + username + '\');'

    client
      .query(queryString, function (err, result) {
        if (err) {
          console.error('Error querying database: ', err)
          promise.reject(err)
        } else {
          console.log(queryString)
          console.log(result.rows)
          promise.resolve(result.rows || false)
        }
      })
  }) */
  return promise
}

function printLocation (loc) {
  return loc
}

module.exports = whereis
