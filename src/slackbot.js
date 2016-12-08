
var SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN
if (!SLACK_BOT_TOKEN) {
  console.error('SLACK_BOT_TOKEN is required')
  process.exit(1)
}

var slack = require('slack-promise')
var whereis = require('./whereis.js')

var rtmClient = slack.rtm.client()
var token = SLACK_BOT_TOKEN

var users, botUser

rtmClient.started(() => {
  refreshUserList()
    .then(() => {
      botUser = users['waldo']

      if (!botUser) {
        console.error('ERROR: bot could not find it\'s own user id')
        process.exit(1)
      }

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
  if (message.type !== 'message' || message.user === botUser.id) {
    return
  }
  // if waldo is mentioned, or direct messaged, reply
  if (message.channel[0] === 'D') {
    // TODO add @mention when functionality is more complete
    // message.text.indexOf('@' + botUser.id) > -1 ||

    let matches = message.text.match(/where\s?is\s+<@(\S+)>/)
    if (matches !== null) {
      let userId = matches[1]
      getUserById(userId)
        .then(user => {
          postMessage({
            channel: message.channel,
            text: whereis('@' + user.name).text
          })
        })
    }

    console.log(`user messaged me: "${message.text}"`)
  }
})

function refreshUserList () {
  console.log('refreshing user list')
  var newUserMap = {}
  return slack.users.list({token})
    .then(res => {
      users = res.members.reduce((map, member) => {
        map[member.name] = member
        newUserMap[member.id] = member.name
        return map
      }, {})
      _userMap = newUserMap
      return users
    })
    .catch(res => {
      console.error('Failed to update user list')
      console.error(res)
      return []
    })
}

function getUser (username) {
  var promise

  if (!users[username]) {
    // if we don't know about the user, refresh the list
    return refreshUserList().then(_ => {
      if (!users[username]) {
        console.error("Couldn't find info for user named:" + username)
      }
      return users[username]
    })
  } else {
    promise = Promise.resolve(users[username])
  }
  return promise
}

var _userMap
function getUserById (userId) {
  var promise

  if (!_userMap[userId]) {
    // if we don't know about the user, refresh the list
    return refreshUserList().then(_ => {
      if (!_userMap[userId]) {
        console.error("Couldn't find info for user with id:" + userId)
      } else {
        return users[_userMap[userId]]
      }
    })
  } else {
    var value = users[_userMap[userId]]
    promise = Promise.resolve(value)
  }
  return promise
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
