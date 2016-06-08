# RestServer


## Introduction

This is a RestServer that allows you to get data from ELK, AWS and Google Analytics data source using Qlik Rest Connector
which builds in Qlik Sense Desktop(Windows Only). By providing simple credentials and your GET data query, you can import
data using Rest Connector by sending simple REST calls to this server and it will be able to do everything for you.


## Requirements

You must have:<br /><br />
1. Qlik Sense Desktop
   Get from here: http://www.qlik.com/products/qlik-sense
<br /><br />

You may need:("Quick Start" second method)<br /><br />
1. Terminal in your machine
2. Node.js installed(version 4.4.5 and above)
3. Port localhost:3000 is available to access

## Quick Start

There are two ways to install and start your data getting right away.<br />
The difference between these two methods is whether you need to set up your own server, due to security issues, the second
method is *RECOMMENDED*.<br />

1. Simply following the "Parameter Filling Instruction" below and make REST calls to the ec2 server which is already
running. This is fairly simple and do not need do set up and create your own REST Server on ec2 or local<br />

2. (Advanced) Clone this repo to your local machine or any VM<br />
   Then direct to this repo and do following in the terminal
   ```
   npm install
   ```

   Wait for its to complete and do
   ```
   node server.js
   ```
  Get the visit url of your running instance(like:100.00.00:3000 or localhost:3000) and follow the instruction bollow


## Instructions
Open Qlik Sense Desktop and find the app that you want to import the data from three sources, you can find the "Data Load Editor"
button after you get into the app the click the left corner compass button.<br /><br />

Click on "Create new connection" on the right column then find "Qlik REST Connector". After do all these, you can simply follow
the instructions bellow to each specific type of connectors.<br /><br />

After you finish the specific instruction, simply name your connector with a meaningful name and click 'Test Connection'
If there is a window pop up with 'Test Connection Successful' without any error, you can then create the connector and start to
import data right away!<br />

**COMMON:**<br /><br />
1. URL:<br />
Your url get from Quick Start part if you choose method 2 OR http://107.21.69.46:3000/ if you choose method 1<br /><br />
2. Method:<br />
**POST**<br /><br />
3. Query headers
```
Name            Value

Content-type    application/json
```

**NOTICE:**<br />
name of query headers is **NOT** case-sensitive

### ElasticSearch
**Request body**
```
'Your elk search query, {"query": {@@@}}, only fill in the @@@ part'
```
**Query headers**
```
Name             Value

type             elk
url              'Your url for elastic search'
log              debug
awsAccess        'Your AWS Access ID for the url above'
awsSecret        'Your AWS Secret Key for the url above'
region           'The region you want to do the elastic searc, like: us-east-1'
```

### Google Analytics
**Request body**
```
'The reportRequests you want to send to google, usually include viewId'
```
**Query headers**
```
Name             Value

type             googleanalytics
clientEmail      'Your client email'
privatekey       'Your private key'
```

The clientEmail and privateKey can get from https://console.developers.google.com -> Credentials -> Create credentials -> Service accout key
ONLY IF you have not done this before otherwise you can find them in the .json file you downloaded from google when you create it


### AWS (CloudWatch)
**Request body**
```
{
  "metrics": "your metrics ARRAY",
  "dimensions": "your dimensions ARRAY"
}
```
**Query headers**
```
Name             Value

type             aws
nameSpace        'AWS/EC2, AWS/S3 ...'
log              debug
timeago          'The time range you want to get the data'
*AccessKeyId      'Your AWS Access ID for the url above'
*SecretAccessKey  'Your AWS Secret Key for the url above'
region           'The region you want to do the elastic searc, like: us-east-1'
```
* These two headers is OPTIONAL, no need to fill if you do not using aws credentials to get elk data
