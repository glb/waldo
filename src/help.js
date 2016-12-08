
function message (text) {
  return {text}
}

function help () {
  return message('Need a hand? Try asking `/whereis @waldo` or message @waldo and ask for help.')
}
help.whereis = () => {
  return message('Just use `/whereis` followed by the username of the person you are trying to find. Example `/whereis @waldo`')
}

module.exports = help
