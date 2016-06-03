var googleApis = require('googleapis');
var analyticsreporting = googleApis.analyticsreporting("v4");

var Google = function(req) {
    // load google credentials from Qlik Rest Connector
    this.client_email = req.get("clientemail").trim();
    this.private_key = req.get("privatekey").replace(/\\n/g, "\n");
    this.reportRequests = [];    
    this.reportRequests.push(req.body);

    // Create the google jwt client for authorization purpose
    this.jwtClient = new googleApis.auth.JWT(this.client_email, null, this.private_key, ["https://www.googleapis.com/auth/analytics.readonly", "https://www.googleapis.com/auth/analytics"], null);
    this.jwtClient.authorize(function(err, tokens) {
        if (err) {
            return ("Wrong credentials: " + err);
        }
    });
}

Google.prototype.getData = function(callback) {
  // Use analytics v4 search engine to get the data and callback with the it
  analyticsreporting.reports.batchGet({
      auth: this.jwtClient,
      resource: {
          reportRequests: this.reportRequests
      }
  },function(err, response) {
    if(err) {
      callback("We cannot get the data from google: " + err)
    }
    callback(response)
  })
}

module.exports = Google;
