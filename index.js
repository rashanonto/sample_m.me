'use strict'

const token = process.env.FB_ACCESS_TOKEN
const vtoken = process.env.FB_VERIFY_TOKEN

const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const app = express()
var Client = require('node-rest-client').Client;
var client = new Client();

app.set('port', (process.env.PORT || 5000))

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))

// Process application/json
app.use(bodyParser.json())

// Index route
app.get('/', function (req, res) {
    res.send('Hello world, I am a chat bot')

})

// for Facebook verification
app.get('/webhook/', function (req, res) {
    if (req.query['hub.verify_token'] === vtoken) {
        res.send(req.query['hub.challenge'])
    }
    res.send('No sir')
})

app.post('/sample:id', function (req, res) {
    
    var id = req.query.id;

    var args = {
    data: { msisdn: id },
    headers: { "Content-Type": "application/x-www-form-urlencoded" }
    };
client.post("http://trufidelity.net/trufidelity_api/v1/index.php/getmemberptsmsisdn", args, function (data, response) {
  // console.log(data['cardnumbers']['cardnumber']);

  res.send(data["cardbalance"]);
});
   
})



// Spin up the server
app.listen(app.get('port'), function() {
    console.log('running on port', app.get('port'))
})

app.post('/webhook/', function (req, res) {
    let messaging_events = req.body.entry[0].messaging

    for (let i = 0; i < messaging_events.length; i++) {
      let event = req.body.entry[0].messaging[i]
      let sender = event.sender.id
      if (event.message && event.message.text) {
        let text = event.message.text
        if (text === 'Generic' || 'generic') {
            sendGenericMessage(sender)
            continue
        }
        sendTextMessage(sender, "Message received: " + text.substring(0, 200))
      }
      if (event.postback) {
        let text = JSON.stringify(event.postback)
        sendTextMessage(sender, text.substring(0, 200), token)
        continue
      }
    }
    res.sendStatus(200)
  })



function sendTextMessage(sender, text) {
    let messageData = { text:text }
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token:token},
        method: 'POST',
        json: {
            recipient: {id:sender},
            message: messageData,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('Error: ', response.body.error)
        }
    })
}

function sendGenericMessage(sender) {
    let messageData = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "generic",
                "elements": [{
                    "title": "Check your balance",
                    "subtitle": "Element #1 of an hscroll",
                    "buttons": [{
                        "type": "web_url",
                        "url": "http://www.funrewards.ph/users/login",
                        "title": "LOGIN"
                    }, {
                        "type": "postback",
                        "title": "Check Balance",
                        "payload": "Your current balance is 100000 points",
                    }],
                }, {
                    title: "Redeem Points",
                    subtitle: "Element #2 of an hscroll",
                    image_url: "http://messengerdemo.parseapp.com/img/gearvr.png",
                    buttons: [{
                        type: "postback",
                        title: "Redeem Points",
                        payload: "You have just redeemed 100 points",
                    }],
                }]
            }
        }
    }
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token:token},
        method: 'POST',
        json: {
            recipient: {id:sender},
            message: messageData,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('Error: ', response.body.error)
        }
    })
}