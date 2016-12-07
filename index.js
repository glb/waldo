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
      username    varchar(22) PRIMARY KEY,
      office      varchar,
      floor       varchar,
      seat        integer
    ); `, function (err, result) {
      if (err) {
        console.log('Error querying database: ' + err)
      } else {
        console.log('User location table exists or was created')
      }
    })
})

// Setup slack bot
childProcess.spawn('node', ['slackbot.js'], {stdio: 'inherit'})

// Setup slash command
childProcess.spawn('node', ['slash_command_server.js'], {stdio: 'inherit'})
