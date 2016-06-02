var elasticsearch = require('elasticsearch');
var http_aws_es = require('http-aws-es');

var es = function(req) {
  this.url = req.get("url").trim();
  this.log = req.get("log").trim();
  this.region = req.get("region").trim();
  this.use_aws_auth = req.get("auth").toLowerCase().trim();
  this.aws_credentials = {};
  this.aws_credentials.access = req.get("awsaccess").trim();
  this.aws_credentials.secret = req.get("awssecret").trim();
  this.query = JSON.parse(req.get("query"));

  // Ask amazon server to authorize
  if (this.use_aws_auth == 'true') {
    this.client = new elasticsearch.Client({
      host: this.url,
      log:  this.log,
      connectionClass: require('http-aws-es'),
      amazonES: {
          region: this.region,
          accessKey: this.aws_credentials.access,
          secretKey: this.aws_credentials.secret,
      }
    });
  } else {
    this.client = new elasticsearch.Client({
      host: this.url,
      log:  this.log
    });
  }
};

es.prototype.getData = function(callback) {
  // Do the autual elasticsearch using the client
  this.client.search(
      this.query,
      function(err, response){
        if (err) {
          callback("Search failed: " + err);
        }

        var hits = response.hits.hits;
        callback(hits);
      }
  );
}

module.exports = es;
