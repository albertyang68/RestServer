var express = require("express");
var app = express();
var google = require("./Modules/googleanalytics")
var elasticSearch = require("./Modules/elasticsearch")
var Aws = require("./Modules/aws")

app.post("/", function(req, res) {
    var type = req.get("Type").toLowerCase().replace(/ /g, '');

    if (type == 'googleanalytics') {
        var Module = new google(req)
    } else if (type == 'elk') {
        var Module = new elasticSearch(req);
    } else if (type == 'aws') {
        var Module = new Aws(req);
    } else {
        res.send("You sent the wrong type, please choose between elk, aws, or googleanalytics");
        return;
    }

    Module.getData(function(response) {
      res.send(response)
    })
})

app.listen(3000)
