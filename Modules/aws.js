var AWS = require('aws-sdk');
var async = require('async');


var aws = function(req) {
  // Load credentials from the Qlik Rest Connector
  this.accessKeyId = req.get("accessKeyId").trim();
  this.secretAccessKey = req.get("secretAccessKey").trim();
  this.region = req.get("region").trim();
  this.time_ago = req.get("timeago").trim();
  this.metrics = JSON.parse(req.get("metrics").replace(/ /g, ""));
  this.params = {
    Namespace: req.get("namespace").trim(),
    Period: 60,
    Statistics: ["Minimum", "Maximum", "Average", "SampleCount", "Sum"],
    Dimensions: JSON.parse(req.get("dimensions").trim().replace(/ /g, ""))
  };

  // Authorize the credentials
  AWS.config.update({region: this.region});
  this.cloudwatch = new AWS.CloudWatch({accessKeyId:this.accessKeyId, secretAccessKey: this.secretAccessKey});


  // calculate start and end times for cloudwatch.getMetricStatistics use in params
  var now = new Date();
  var start = new Date(now.getTime() - this.time_ago * 60000);
  // Add the fields to params
  this.params.StartTime = start.toISOString().substring(0, 19) + 'Z';
  this.params.EndTime = now.toISOString().substring(0, 19) + 'Z';

};

aws.prototype.rename = function(obj, prefix){
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

aws.prototype.getData = function(callback) {
  var hits = {};
  var hitsArray = [];
  var _this = this;

  async.each(_this.metrics, function(metric, callback) {

    // per metric
    _this.params.MetricName = metric.name;
    _this.params.Unit = metric.units;

    // conduct a search
    _this.cloudwatch.getMetricStatistics(_this.params, function(err, data) {
      if (err) {
        res.send(err);
      } else if (data.Datapoints !== null && data.Datapoints.length !== 0) {
        // rename datapoints
        var modifiedKeys = data.Datapoints;
        data.Datapoints.forEach(function(datapoint) {
          datapoint = _this.rename(datapoint, metric.name + ".");
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
        callback();
      } else {
        callback()
      }
    });
  }, function(err) {
    if (err) {
      callback(err + "bottom error");
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
      callback(hitsArray);
    }
  });
}

module.exports = aws;
