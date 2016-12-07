
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
  bot.postMessageToUser('morganw', 'Waldo reporting for duty!')
  bot.postMessageToUser('grahamm', 'Waldo reporting for duty!')
})

bot.run()
