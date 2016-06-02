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
var async = require('async');

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
    config.aws.accessKeyId = req.get("accessKeyId").trim();
    config.aws.secretAccessKey = req.get("secretAccessKey").trim();
    config.aws.region = req.get("region").trim();
    config.aws.time_ago = req.get("timeago").trim();
    //console.log(req.get("metrics").trim());
    config.aws.metrics = JSON.parse(req.get("metrics").replace(/ /g, ""));
    config.aws.params = {};
    config.aws.params.Namespace = req.get("namespace").trim();
    config.aws.params.Period = 60;
    config.aws.params.Statistics = ["Minimum", "Maximum", "Average", "SampleCount", "Sum"],
    config.aws.params.Dimensions = JSON.parse(req.get("dimensions").trim().replace(/ /g, ""));
    fs.writeFileSync('./config.json', JSON.stringify(config));
    // console.log(JSON.parase(config.aws.metrics));
    // console.log(JSON.parse(config.aws.dimensions));
    aws(res);
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

var aws = function(res) {
  config = config.aws;
  AWS.config.update({region: config.region});
  // credentials are found automatically
  this.cloudwatch = new AWS.CloudWatch({accessKeyId:config.accessKeyId, secretAccessKey: config.secretAccessKey});



  this.rename = function(obj, prefix){
    if (typeof obj !== 'object' || !obj) {
      return false;    // check the obj argument somehow
    }

    var keys = Object.keys(obj),
        keysLen = keys.length,
        prefix = prefix || '';

    for(var i = 0; i < keysLen; i++) {
      if (keys[i] !== 'Timestamp') {
        var newKey = prefix + keys[i];
        obj[newKey] = obj[keys[i]];
        if (typeof obj[keys[i]] === 'object') {
          this.rename(obj[prefix + keys[i]], prefix);
        }
        delete obj[keys[i]];
      }
    }
    return obj;
  };

  var hits = {};
  var hitsArray = [];

  // calculate start and end times
  var now = new Date();
  var start = new Date(now.getTime() - config.time_ago * 60000);

  config.params.StartTime = start.toISOString().substring(0, 19) + 'Z';
  config.params.EndTime = now.toISOString().substring(0, 19) + 'Z';

  console.log(config.metrics);

  async.each(config.metrics, function(metric) {
    // per metric
    config.params.MetricName = metric.name;
    config.params.Unit = metric.unit;

    // fs.writeFileSync('./config.json', JSON.stringify(config));
    console.log(config.params);
    console.log("fsafdasdfsad");
    // conduct a search
    this.cloudwatch.getMetricStatistics(config.params, function(err, data) {
      console.log(data);
      console.log('fadsfwe');
      if (err) {
        res.send(err);
        console.log(err);
      } else if (data.Datapoints !== null && data.Datapoints.length !== 0) {
        console.log("rewrweewqrewqrewqr3r34r34r334q");
        // rename datapoints
        var modifiedKeys = data.Datapoints;
        data.Datapoints.forEach(function(datapoint) {
          datapoint = this.rename(datapoint, metric.name + ".");
          // set the timestamp object if undefined or null
          if (!hits[datapoint.Timestamp]) {
            hits[datapoint.Timestamp] = {};
          }
          // push by keys
          Object.keys(datapoint).forEach(function(key) {
            if (key !== "Timestamp") {
              // push to array of results
              hits[datapoint.Timestamp][key] = datapoint[key];
            }
          });
        });
      }
    });
  }, function(err) {
    if (err) {
      console.log(err);
      res.send(err + "bottom error");
    } else {
      // now sorted by timestamp, convert to array
      Object.keys(hits).forEach(function(key) {
        // make the timestamp object
        var obj = {"Timestamp": key};
        for (var attr in hits[key]) {
          obj[attr] = hits[key][attr];
        }
        hitsArray.push(obj);
      });
      console.log(hitsArray);
      res.send(hitsArray);
    }
  });
};


app.listen(3000)
