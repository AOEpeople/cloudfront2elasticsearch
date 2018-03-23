
var s3ToLogstore = require('s3-to-logstore');
var winston = require('winston');
require('winston-elasticsearch');

var elasticsearch = require('elasticsearch');

var client = new elasticsearch.Client({
  host: process.env.ES_HOST,
  log: 'trace'
});

var transport = new winston.transports.Elasticsearch({
  indexPrefix: process.env.ES_INDEXPREFIX,
  client: client
});

var options = {
  format: process.env.FORMAT,
  transport: transport,
  reformatter: function(data){
    data.environment = process.env.STAGE;
    data.origin = process.env.FORMAT;
    return data;
  }
};

exports.handler = s3ToLogstore(options);
