// Constants
var LIMIT_SPLIT = 4;

// Dependencies
var AWS = require('aws-sdk');
var async = require('async');
var DynamoScanner = require('./lib/DynamoScanner');
var args = require('./lib/arguments').parse();

// Initialize AWS client
AWS.config.credentials = new AWS.SharedIniFileCredentials({ profile: args.profile });
var dynamodb = new AWS.DynamoDB({ region: args.sourceRegion, apiVersion: '2012-08-10'});


// Get table description
dynamodb.describeTable({TableName: args.table}, function(err, data){
  if(err){
    console.error("Unable to describe table");
    console.error(err.code, "-", err.message);
    return process.exit(1);
  }

  // Consumeable throughput
  var throughput = Math.round(data.Table.ProvisionedThroughput.ReadCapacityUnits * args.throughputRatio);

  var scanLimit = 100;

  // If there is a tablesize and itemcount, calculate the scan limit required to use only the consumeable throughput
  if(data.Table.TableSizeBytes !== 0 && data.Table.ItemCount !== 0){
    var individualCapacityUnits = (data.Table.TableSizeBytes / data.Table.ItemCount) / 1024 / 2 /  4 * LIMIT_SPLIT;

    scanLimit = Math.round(throughput / individualCapacityUnits);
    if(scanLimit < 1)
      scanLimit = 1;
  }

  // Initialize source and replica scanners
  var sourceScanner = new DynamoScanner(args.sourceRegion, throughput, scanLimit);
  var replicaScanner = new DynamoScanner(args.replicaRegion, throughput, scanLimit);

  //Get count for source and replica tables
  async.parallel({
    source: function(done){
      sourceScanner.count(args.table, done);
    },
    replica: function(done){
      replicaScanner.count(args.table, done);
    }
  }, function(err, data){
    if(err){
      console.error("Failed to retrieve item count for tables");
      console.error(err.code, "-", err.message);
      return process.exit(1);
    }

    // Calculate and return the replica count's percent difference from the master
    var difference = Math.abs(data.source - data.replica);
    var percent = 0;
    if(difference !== 0)
      percent = Math.round((difference / data.source) * 100);

    return console.log(percent);
  });
});
