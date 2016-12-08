
var SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN
if (!SLACK_BOT_TOKEN) {
  console.error('SLACK_BOT_TOKEN is required')
  process.exit(1)
}

var slack = require('slack-promise')

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

    postMessage({
      channel: message.channel,
      text: `You said "${message.text}"`
    })
  }
})

function refreshUserList () {
  console.log('refreshing user list')
  return slack.users.list({token})
    .then(res => {
      users = res.members.reduce((map, member) => {
        map[member.name] = member
        return map
      }, {})
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
    return refreshUserList().then(userList => {
      if (!users[username]) {
        console.error("Couldn't find info for user named:" + username)
      }
      return userList[username]
    })
  } else {
    promise = new Promise().resolve(users[username])
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
