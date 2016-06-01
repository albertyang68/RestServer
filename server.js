var express = require("express");
var config = require('./config.json');
var fs = require('fs')
var googleApis = require('googleapis');
var request = require('request');
var app = express();
var analyticsreporting = googleApis.analyticsreporting("v4");
var elasticsearch = require('elasticsearch');
var http_aws_es = require('http-aws-es');
var AWS = require('aws-sdk');

app.post("/", function(req, res) {
  var type = req.get("Type").toLowerCase().replace(/ /g, '');
  if(type == 'googleanalytics') {
    config.googleanalytics = {}
    config.googleanalytics.client_email = req.get("clientemail").trim();
    config.googleanalytics.private_key = req.get("privatekey").replace(/\\n/g, "\n");
    config.googleanalytics.reportRequests = [{}];
    config.googleanalytics.reportRequests[0].viewId = req.get("viewid").trim();
    console.log(config.googleanalytics.client_email);
    fs.writeFileSync('./config.json', JSON.stringify(config));
    Google(res)
  } else if(type == 'elk') {
    config.elasticSearch = {}
    config.elasticSearch.url = req.get("url").trim();
    config.elasticSearch.log = req.get("log").trim();
    config.elasticSearch.region = req.get("region").trim();
    config.elasticSearch.use_aws_auth = req.get("auth").trim();
    config.elasticSearch.aws_credentials = {};
    config.elasticSearch.aws_credentials.access = req.get("awsaccess").trim();
    config.elasticSearch.aws_credentials.secret = req.get("awssecret").trim();
    config.elasticSearch.query = JSON.parse(req.get("query"));
    fs.writeFileSync('./config.json', JSON.stringify(config));
    es(res)
  } else if(type == 'aws') {
    config.aws = {}
    config.aws.region = req.get("region").trim();
    config.aws.time_ago = req.get("timeage").trim();
    config.aws.metrics = []
    config.params = {};
    config.params.nameSpace = req.get("namespace").trim();
    config.params.period = 60;
    config.params.statistics = ["Minimum", "Maximum", "Average", "SampleCount", "Sum"],
    config.params.dimensions = [];
    console.log(req.body);
    res.send(req.body)
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

var es = function(res){
  config = config.elasticSearch;
  if (config.use_aws_auth == 'true') {
    this.client = new elasticsearch.Client({
      host: config.url,
      log:  config.log,
      connectionClass: require('http-aws-es'),
      amazonES: {
          region: config.region,
          accessKey: config.aws_credentials.access,
          secretKey: config.aws_credentials.secret,
      }
    });
  } else {
    this.client = new elasticsearch.Client({
      host: config.url,
      log:  config.log
    });
  }

  this.client.search(
      config.query,
      function(err, response){
        if (err)
          return res.send(err);
        var hits = response.hits.hits;
        res.send(hits);
      }
  );
};


app.listen(3000)
