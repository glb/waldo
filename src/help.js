
function message (text) {
  return {text}
}

var office = 'in the <Location> office'
var floor = '<n-th> floor'
var seat = 'in seat <##>'
var updatePrefix = '@username is now'
var sampleUpdateAll = `\`${updatePrefix} ${office} ${floor} ${seat} \``
// General help message
function help () {
  return message(`Things you can do:
    Find out where a person's desk is: \`where is @username\`
    Update a person's location: ${sampleUpdateAll}`)
}
help.whereis = () => {
  return message('Just use `/whereis` followed by the username of the person you are trying to find. Example `/whereis @waldo`')
}
help.update = () => {
  return message(`A person's location consists of an office location, a floor number and a seat number.
    This info can be updated all at once or in individual parts.
    To update all at once: ${sampleUpdateAll}
    To update the office: \`${updatePrefix} ${office}\`
    To update the floor: \`${updatePrefix} ${floor}\`
    To update the seat: \`${updatePrefix} ${seat}\` `)
}

module.exports = help
