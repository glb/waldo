var childProcess = require('childProcess')

// Setup slack bot
childProcess.spawn('node', ['slackbot.js'], {stdio: 'inherit'})

// Setup slash command
childProcess.spawn('node', ['slash_command_server.js'], {stdio: 'inherit'})
