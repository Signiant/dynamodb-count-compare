var AWS = require('aws-sdk');
var DynamoLimiter = require('./DynamoLimiter');

function DynamoScanner(region, throughput, limit){
  this.client = new AWS.DynamoDB({region: region});
  this.scanLimit = limit;
  this.limiter = new DynamoLimiter(throughput);
}

//Scan and return the total item count for a table
DynamoScanner.prototype.count = function(table, callback){
  var self = this;
  var count = 0;

  //Count a page of items from the table
  (function getCount(lastEvaluated){
    var params = {
      TableName: table,
      ReturnConsumedCapacity: "TOTAL",
      Select: "COUNT",
      Limit: self.scanLimit
    };

    if(lastEvaluated)
      params.ExclusiveStartKey = lastEvaluated;

    self.client.scan(params, function(err, data){
      if(err)
        return callback(err);

      // Add page count to the total
      count += data.Count;

      // If there are more items to scan count, get the next page
      if(data.LastEvaluatedKey)
        self.limiter.consume(data.ConsumedCapacity.CapacityUnits, function(){
          getCount(data.LastEvaluatedKey);
        });
      //Otherwise, return the total count
      else
        return callback(null, count);
    });
  }());
};

module.exports = DynamoScanner;
