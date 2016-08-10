var DynamoLimiter = function (consumeable){
  this.consumeable = consumeable;
  this.interval = 1000;
  this.intervalStart = +new Date();
  this.intervalTotal = 0;
};


DynamoLimiter.prototype.consume = function(consumed, callback){
  var self = this;
  var now = Date.now();

  // If cycle is complete, reset
  if (now - this.intervalStart >= this.interval){
    this.intervalStart = now;
    this.intervalTotal = 0;
  }

  // Add consumed capacity to interval total
  this.intervalTotal += consumed;

  // If interval total exceeds the limit, wait until the next cycle to execute the request
  if(this.intervalTotal >= this.consumeable){
    var waitInterval = Math.ceil( this.intervalStart + this.interval - now);
    setTimeout(function(){
      self.intervalTotal = 0;
      callback();
    }, waitInterval);

  // Otherwise, execute immediately
  }else{
    callback();
  }
};

module.exports = DynamoLimiter;
