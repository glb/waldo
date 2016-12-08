var childProcess = require('child_process')

var pg = require('pg')
var DB_URL = process.env.DATABASE_URL

pg.defaults.ssl = true
pg.connect(DB_URL, function (err, client) {
  if (err) {
    console.log('Failed to connect to postgres: ' + err)
  }

  client
    .query(`CREATE TABLE IF NOT EXISTS user_locations (
      username      varchar(22) PRIMARY KEY,
      office        varchar,
      floor         varchar,
      seat          integer,
      lastUpdated   timestamp DEFAULT now()
    ); `, function (err, result) {
      if (err) {
        console.log('Error querying database: ' + err)
      } else {
        console.log('User location table exists or was created')
      }
    })

    client
      .query('SELECT * FROM user_locations);', function (err, result) {
        if (err) {
          console.error('Error querying database: ', err)
        } else {
          console.log(result.rows)
          // map = result.rows
          // console.log(map)
        }
      })
  })
})

// Setup slack bot
childProcess.spawn('node', ['src/slackbot.js'], {stdio: 'inherit'})

// Setup slash command
childProcess.spawn('node', ['src/slash_command_server.js'], {stdio: 'inherit'})
