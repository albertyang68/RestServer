var express = require("express");
var config = require('./config.json');
var fs = require('fs')
var googleApis = require('googleapis');
var request = require('request');
var app = express();
var analyticsreporting = googleApis.analyticsreporting("v4");

app.post("/", function(req, res) {
  var type = req.get("Type").toLowerCase().replace(/ /g, '');
  if(type == 'googleanalytics') {

    config.googleanalytics.client_email = req.get("clientemail").trim();
    config.googleanalytics.private_key = req.get("privatekey").replace(/\\n/g, "\n");
    config.googleanalytics.reportRequests[0].viewId = req.get("viewid").trim();
    fs.writeFileSync('./config.json', JSON.stringify(config));
    console.log(config.googleanalytics.client_email);
    Google(res)
  }
})

var Google = function(res) {
    console.log(config.googleanalytics.private_key);
    this.jwtClient = new googleApis.auth.JWT(config.googleanalytics.client_email, null, config.googleanalytics.private_key, ["https://www.googleapis.com/auth/analytics.readonly", "https://www.googleapis.com/auth/analytics"], null);
    this.jwtClient.authorize(function(err, tokens) {
        if (err) {
            console.log(err);
            return;
        }
    });
    analyticsreporting.reports.batchGet({
        auth: this.jwtClient,
        resource: {
            reportRequests: config.googleanalytics.reportRequests
        }
    },function(err, response) {
      console.log(response);
      if(err) res.send(err)
      res.send(response)
    })
}

app.listen(3000)
