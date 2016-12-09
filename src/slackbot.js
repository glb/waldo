
if (!process.env.DEFAULT_MAP_MESSAGE) {
  console.error('ERROR: Missing environment variable DEFAULT_MAP_MESSAGE')
  process.exit(1)
}

if (!process.env.DEFAULT_MAP_URL) {
  console.error('ERROR: Missing environment variable DEFAULT_MAP_URL')
  process.exit(1)
}

var SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN
if (!SLACK_BOT_TOKEN) {
  console.error('ERROR: Missing environment variable SLACK_BOT_TOKEN')
  process.exit(1)
}

var slack = require('slack-promise')
var whereis = require('./whereis.js')
var UserList = require('./user_list.js')
var help = require('./help.js')

var rtmClient = slack.rtm.client()
var token = SLACK_BOT_TOKEN
var userList = new UserList(token)
var botUser

rtmClient.started(() => {
  userList.getUsers()
    .then(users => {
      botUser = users['waldo']

      if (!botUser) {
        console.error('ERROR: bot could not find it\'s own user id')
        process.exit(1)
      }

      // let people know bot is online
      slack.channels.list({token})
      .then(response => {
        let statusChannel = response.channels.filter(channel => {
          return channel.name === 'waldo-status'
        })[0]

        if (!statusChannel) {
          throw new Error('Channel not found')
        }

        postMessage({
          channel: statusChannel.id,
          text: 'Waldo reporting for duty!'
        })
      })
      .catch(err => {
        console.error('Couldn\'t open status channel #waldo-status You may need to create that channel and invite me.', err)
      })

      console.log('Started...')
    })
})

rtmClient.message(message => {
  // only want to monitor chat messages, and waldo should ignore his own messages
  if (message.type !== 'message' || !botUser || message.user === botUser.id) {
    return
  }
  if (!message.text) {
    console.error('ERROR weird message:', message)
    return
  }
  // if waldo is mentioned, or direct messaged, reply
  if (message.channel[0] === 'D' || message.text.indexOf('@' + botUser.id) > -1) {
    console.log(`user messaged me: "${message.text}"`)

    let command = message.text

    // if @mentioned trim the command
    if (command.indexOf('@' + botUser.id) > -1) {
      let index = command.indexOf('@' + botUser.id) + ('@' + botUser.id).length
      command = command.substring(index)
    }
    console.log(`command: ${command}`)

    // whereis
    let matches = command.match(/\bwhere\s?is\s+<@(\S+)>/i)
    if (matches !== null) {
      let userId = matches[1]
      userList.getUser(userId)
        .then(user => {
          return whereis('@' + user.name)
        })
        .then(response => {
          response.channel = message.channel
          return postMessage(response)
        })
      return
    }

    if (/\bhelp\b|(\bhow do i)/i.test(command)) {
      if (/\bupdate\b/.test(command)) {
        postMessage({
          channel: message.channel,
          text: help.update().text
        })
      } else if (/\bwhere\s?is\b/i.test(command)) {
        postMessage({
          channel: message.channel,
          text: help.whereis().text
        })
      } else if (/\bmap\b/i.test(command)) {
        postMessage({
          channel: message.channel,
          text: help.map().text
        })
      } else {
        postMessage({
          channel: message.channel,
          text: help().text
        })
      }
      return
    }

    // Update location
    let update = parseLocationData(command)
    if (update) {
      userList.getUser(update.userId)
        .then(user => {
          whereis.updateUser('@' + user.name, update.location)
          postMessage({
            channel: message.channel,
            text: 'Updating...'
          })
        })
      return
    }

    // TODO this should show a map of the user's current location, if known, otherwise a random map from giphy as punishment
    if (/show me a map/i.test(command.toLowerCase())) {
      postMessage({
        channel: message.channel,
        text: DEFAULT_MAP_MESSAGE,
        attachments: [
          {
            fallback: DEFAULT_MAP_URL,
            image_url: DEFAULT_MAP_URL
          }
        ]
      })
      return
    }
  }
})

function parseLocationData (input) {
  let location = {}
  let matches
  let userId = null

  // update office
  matches = input.match(/<@(\S+)>.*\b(\w+)\s+office/i)
  if (matches !== null) {
    userId = matches[1]
    location.office = matches[2]
  }

  // update floor
  matches = input.match(/<@(\S+)>.*\b([0-9]\w*)\s+floor/i) ||
    input.match(/<@(\S+)>.*\bfloor\s+([0-9]\w*)/) ||
    input.match(/<@(\S+)>.*\b(\w+)\s+floor/)
  if (matches !== null) {
    userId = matches[1]
    location.floor = matches[2]
  }

  // update seat
  matches = input.match(/<@(\S+)>.*seat\s+([0-9]+)/i)
  if (matches !== null) {
    userId = matches[1]
    location.seat = matches[2]
  }

  return (userId) ? {userId, location} : null
}

function postMessage (config) {
  config.token = token
  config.as_user = 'waldo'
  return slack.chat.postMessage(config)
    .catch(err => {
      console.error('Couldn\'t send message', err)
    })
}

rtmClient.listen({token})
