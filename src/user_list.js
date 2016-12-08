var slack = require('slack-promise')

class UserList {

  constructor (apiToken) {
    this.token = apiToken
    this.users = null
  }

  _refresh () {
    return slack.users.list({token: this.token})
      .then(res => {
        this.users = res.members.reduce((newUsers, member) => {
          newUsers[member.name] = member
          newUsers[member.id] = member
          return newUsers
        }, {})
      })
      .catch(res => {
        console.error('Failed to update user list')
        console.error(res)
      })
  }

  getUser (userId) {
    var promise

    if (this.users === null || !this.users[userId]) {
      // if we don't know about the user, refresh the list
      promise = this._refresh()
        .then(() => {
          if (!this.users[userId]) {
            console.error("Couldn't find info for user:" + userId)
          }
          return this.users[userId]
        })
    } else {
      promise = Promise.resolve(this.users[userId])
    }
    return promise
  }

  // TODO maybe accept a comma delimited list
  getUsers () {
    return this._refresh().then(() => { return this.users })
  }
}

module.exports = UserList
