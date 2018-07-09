var aws  = require('aws-sdk');
var zlib = require('zlib');
var async = require('async');
const CloudFrontParser = require('cloudfront-log-parser');

var elasticsearch = require('elasticsearch');

var s3 = new aws.S3();

var client = new elasticsearch.Client({
  host: process.env.ES_HOST,
  log: 'error',
  keepAlive: false
});


function get_date(record_date, record_time){
  var year = record_date.split('-')[0];
  var month = record_date.split('-')[1];
  var day = record_date.split('-')[2];
  var hours = record_time.split(':')[0];
  var minutes = record_time.split(':')[1];
  var seconds = record_time.split(':')[2];
  return new Date(year, month - 1, day, hours, minutes, seconds, 0).toISOString();
}

exports.handler = function(event, context, callback) {
    var srcBucket = event.Records[0].s3.bucket.name;
    var srcKey = event.Records[0].s3.object.key;

    async.waterfall([
        function fetchLogFromS3(next){
            console.log('Fetching compressed log from S3...');
            s3.getObject({
               Bucket: srcBucket,
               Key: srcKey
            },
            next);
        },
        function uncompressLog(response, next){
            console.log("Uncompressing log...");
            zlib.gunzip(response.Body, next);
        },
        function publishNotifications(jsonBuffer, next) {
            console.log('Filtering log...');
            var json = jsonBuffer.toString();

            var records;
            CloudFrontParser.parse(json, { format: 'web' }, function (err, accesses) {
              if(err){
                return callback(err);
              } else {
                records = accesses;
              }
            });

            var bulk = [];
            records.forEach(function(record) {
              record["@timestamp"] = get_date(record.date, record.time);
              record["environment"] = process.env.STAGE;
              bulk.push({"index": {}});
              bulk.push(record);
            });

            client.bulk({
              index: process.env.ES_INDEXPREFIX + '-' +((new Date()).toJSON().slice(0, 10).replace(/[-T]/g, '.')),
              type: 'log',
              body: bulk
            }, function(err, resp, status) {
              if(err) {
                console.log('Error: ', err);
                return callback(err);
              }
              // console.log(resp);
              next();
            });
            // console.log('CloudFront parsed:', records);
        }
    ], function (err) {
        if (err) {
            console.error('Failed to send data: ', err);
            return callback(err);
        } else {
            console.log('Successfully send data.');
            callback(null, "success");
        }
    });
};
