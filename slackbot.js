
var SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN
if (!SLACK_BOT_TOKEN) {
  console.error('SLACK_BOT_TOKEN is required')
  process.exit(1)
}

var Bot = require('slackbots')

var settings = {
  token: SLACK_BOT_TOKEN,
  name: 'Waldo'
}
var bot = new Bot(settings)
bot.on('start', function () {
  bot.user = bot.users.filter(function (user) {
    return user.name.toLowerCase() === 'waldo'
  })[0]
  if (!bot.user) {
    console.error('ERROR: bot could not find it\'s own user id')
    process.exit(1)
  }

  bot.postMessageToUser('morganw', 'Waldo reporting for duty!', {'as_user': 'true'})
  bot.postMessageToUser('grahamm', 'Waldo reporting for duty!', {'as_user': 'true'})
  console.log('Started...')
})
bot.on('message', function (message) {
  if (message.type !== 'message') {
    return
  }
  if (message.user === bot.user.id ||
        message.text.indexOf('@' + bot.user.id) === -1) {
    console.log('skipping message')
    return
  }
  console.log('ok to reply')
  bot.getUser(message.user)
    .then(function (res) {
      console.log(res)
    })
  replyToMessage(message, "I'M ALIVE")
})

function replyToMessage (message, response) {
  if (message.channel[0] === 'D') {
    bot.postMessageToUser(message.user, response)
  } else {
    bot.postMessageToChannel(message.channel, response)
  }
}

