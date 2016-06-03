var express = require("express");
var app = express();
var google = require("./Modules/googleanalytics")
var elasticSearch = require("./Modules/elasticsearch")
var Aws = require("./Modules/aws")
var bodyParser = require('body-parser');

app.use(bodyParser.json());

app.post("/", function(req, res) {
    var type = req.get("Type").toLowerCase().replace(/ /g, '');

    if (type == 'googleanalytics') {
  	console.log('Connecting to Google Analytics Server...');
        var Module = new google(req)
    } else if (type == 'elk') {
        var Module = new elasticSearch(req);
    } else if (type == 'aws') {
        console.log('Connecting to AWS...');
        var Module = new Aws(req);
    } else {
        res.send("You sent the wrong type, please choose between elk, aws, or googleanalytics");
        return;
    }
  	
    try{
      Module.getData(function(response) {
        console.log('Connected');
        res.send(response)
      })
    } catch(err) {
      console.log('Failed to connect to the server' + err);
    }
})

app.listen(3000)
