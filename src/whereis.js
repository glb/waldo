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
        console.log(` exists: ${user.name}`)
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
          console.log('before call db method')
          return dbUserExists(username)
            .then(userRow => {
              console.log(`got db result`)
              if (userRow) {
                message = username + ' location:\n' + printLocation(userRow)
              } else {                               // Return suggestion to talk to @waldo to add location
                message = `I don't know where ${username} is.  If you find out, please tell me! (@waldo)`
              }
              return {text: message}
            })
            .catch(() => {
              return {text: 'DB Error'}
            })
        }
      } else {                                  // Return error bc user does not exist in Slack
        console.log(`does not exist: ${username}`)
        message = `Hmm... ${username} doesn't seem to be a current Slack user!`
      }

      // TODO: add attachment image based on office and floor if one exists
      // attachment : getFloorImage(location)
      return {text: message}
    })
    .catch(reason => {
      console.error('Failed in whereis', reason)
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
  let promise = new Promise(() => {
    console.log('connecting...')
    pg.connect(DB_URL, function (err, client) {
      console.log('connect callback')
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
    })
  })
  return promise
}

function printLocation (loc) {
  return loc
}

module.exports = whereis
