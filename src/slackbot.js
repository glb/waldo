
var SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN
if (!SLACK_BOT_TOKEN) {
  console.error('SLACK_BOT_TOKEN is required')
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
      slack.mpim.open({
        token,
        users: [users['grahamm'].id, users['morganw'].id].join(',')
      })
      .then(res => {
        postMessage({
          channel: res.group.id,
          text: 'Waldo reporting for duty!'
        })
      })
      .catch(err => {
        console.error('Couldn\'t open instant message', err)
      })

      console.log('Started...')
    })
})

rtmClient.message(message => {
  // only want to monitor chat messages, and waldo should ignore his own messages
  if (message.type !== 'message' || !botUser || message.user === botUser.id) {
    return
  }
  // if waldo is mentioned, or direct messaged, reply
  if (message.channel[0] === 'D' || message.text.indexOf('@' + botUser.id) > -1) {
    if (!message.text) {
      console.error('ERROR weird message:', message)
      return
    }
    console.log(`user messaged me: "${message.text}"`)

    let command = message.text

    // if @mentioned trim the command
    if (command.indexOf('@' + botUser.id) > -1) {
      let index = command.indexOf('@' + botUser.id) + ('@' + botUser.id).length
      command = command.substring(index)
    }
    console.log(`command: ${command}`)

    // whereis
    let matches = command.match(/\bwhere\s?is\s+<@(\S+)>/)
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

    var commandLC = command.toLowerCase()
    if (/\bhelp\b|(\bhow do i)/.test(commandLC)) {
      if (/\bupdate\b/.test(commandLC)) {
        postMessage({
          channel: message.channel,
          text: help.update().text
        })
      } else if (/\bwhere\s?is\b/.test(commandLC)) {
        postMessage({
          channel: message.channel,
          text: help.whereis().text
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

    if (/show me a map/.test(command.toLowerCase())) {
      postMessage({
        channel: message.channel,
        text: 'Map of the Ottawa 4th Floor',
        attachments: [
          {
            fallback: 'http://floating-reef-60921.herokuapp.com/map/ottawa-4th',
            image_url: 'http://floating-reef-60921.herokuapp.com/map/ottawa-4th'
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
  matches = input.match(/<@(\S+)>.*\b(\w+)\s+office/)
  if (matches !== null) {
    userId = matches[1]
    location.office = matches[2]
  }

  // update floor
  matches = input.match(/<@(\S+)>.*\b([0-9]\w*)\s+floor/) || input.match(/<@(\S+)>.*\bfloor\s+([0-9]\w*)/)
  if (matches !== null) {
    userId = matches[1]
    location.floor = matches[2]
  }

  // update seat
  matches = input.match(/<@(\S+)>.*seat\s+([0-9]+)/)
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
