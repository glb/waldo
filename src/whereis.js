const UserList = require('./user_list.js')
const pg = require('pg')

// Database setup
if (!process.env.DATABASE_URL) {
  console.error("ERROR: Missing environment variable DATABASE_URL")
  process.exit(1)
}
const dbParams = url.parse(process.env.DATABASE_URL);
const dbAuth = dbParams.auth.split(':');
const dbConfig = {
  user: dbAuth[0],
  password: dbAuth[1],
  host: dbParams.hostname,
  port: dbParams.port,
  database: dbParams.pathname.split('/')[1],
  ssl: true
};
pg.defaults.ssl = true
const pool = new pg.Pool(dbConfig);


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
                let result = {
                  text: username + ' location:\n' + printLocation(userRow)
                }
                if (username === '@glb') {
                  result.text = '¯\\_(ツ)_/¯ \n.\n.\nOk, but actually...\n' + result.text
                }
                if (userRow.office && userRow.floor) {
                  let imgUrl = `http://floating-reef-60921.herokuapp.com/map/${userRow.office}-${userRow.floor}`
                  result.attachments = [
                    {
                      fallback: imgUrl,
                      image_url: imgUrl
                    }
                  ]
                }
                return result
              } else {                               // Return suggestion to talk to @waldo to add location
                return {text: `I don't know where ${username} is.  If you find out, please tell me! (@waldo)`}
              }
            })
            .catch(() => {
              return {text: `Hmm... something went wrong with my database when searching for ${username}`}
            })
        }
      } else {                                  // Return error bc user does not exist in Slack
        console.log(`does not exist: ${username}`)
        message = `Hmm... ${username} doesn't seem to be a current Slack user!`
      }

      return {text: message}
    })
    .catch(reason => {
      console.error('Failed in whereis', reason)
    })
}

/**
 * @param location {office, floor, seat}
 */
whereis.updateUser = function updateUser (username, location) {
  location.office = location.office || null
  location.floor = location.floor || null
  location.seat = location.seat || null

  console.log('update user functionality')

  // insert on user just in case, on conflict do nothing
  console.log('connecting for insert...')
  pool.connect(function (err, client, done) {
    console.log('connect callback')
    if (err) {
      console.error('error fetching client from pool', err)
      return
    }

    var queryString = `INSERT INTO user_locations (username, office, floor, seat)
                        VALUES ('${username}', '${location.office}', '${location.floor}, '${location.seat}')
                        ON CONFLICT DO UPDATE
                        SET username = EXCLUDED.username` +
                        (location.office ? ',office = EXCLUDED.office' : '') +
                        (location.floor ? ',floor = EXCLUDED.floor' : '') +
                        (location.seat ? ',seat = EXCLUDED.seat' : '')

    console.log("Sending query: ", queryString)

    client.query(queryString, function (err, result) {
      //call `done()` to release the client back to the pool
      done();

      if (err) {
        console.error('Error updating database: ', err)
      } else {
        console.log('Query successful', queryString)
      }
    })
  })
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
  let promise = new Promise((resolve, reject) => {
    console.log('connecting...')
    pool.connect(function (err, client, done) {
      console.log('connect callback')
      if (err) {
        console.error('Failed to connect to postgres: ', err)
        reject(err)
        return
      }

      var queryString = 'SELECT * FROM user_locations WHERE username = \'' + username + '\';'

      client.query(queryString, function (err, result) {
        //call `done()` to release the client back to the pool
        done();

        if (err) {
          console.error('Error querying database: ', err)
          reject(err)
        } else {
          console.log(queryString)
          console.log(result.rows)
          if (result.rows && result.rows.length > 0) {
            resolve(result.rows[0])
          } else {
            resolve(false)
          }
        }
      })

    })
  })
  return promise
}

function printLocation (loc) {
  return `Office: ${loc.office}\n Floor: ${loc.floor}\n Seat: ${loc.seat}`
}

module.exports = whereis
