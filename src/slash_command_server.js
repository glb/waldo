var path = require('path')
var express = require('express')
var bodyParser = require('body-parser')
var whereis = require('./whereis.js')
var help = require('./help.js')

var VERIFY_TOKEN = process.env.SLACK_VERIFY_TOKEN
if (!VERIFY_TOKEN) {
  console.error('SLACK_VERIFY_TOKEN is required')
  process.exit(1)
}
var PORT = process.env.PORT || 45678
if (!PORT) {
  console.error('PORT is required')
  process.exit(1)
}

var app = express()

console.log('path: ' + path.resolve(__dirname, '../assets'))

app.use('/static', express.static(path.resolve(__dirname, '../assets')))

app.route('/whereis')
  .get(function (req, res) {
    res.sendStatus(200)
  })
  .post(bodyParser.urlencoded({ extended: true }), function (req, res) {
    if (req.body.token !== VERIFY_TOKEN) {
      return res.sendStatus(401)
    }

    var response = {}
    var input = req.body.text

    if (input === 'help') {     // Handle any help requests
      res.json(help.whereis())
    } else {                    // Lookup user location
      whereis(input)
        .then(response => {
          res.json(response)
        })
    }
  })

app.route('/map/:mapId')
  .get((req, res) => {
    let mapId = req.params.mapId
    if (mapId === '20k') {
      res.redirect('/static/20k-under-sea-with-waldo.jpg')
    } else {
      res.sendStatus(404)
    }
  })

app.listen(PORT, function (err) {
  if (err) {
    return console.error('Error starting server: ', err)
  }

  console.log('Server successfully started on port %s', PORT)
})
