var pkg = require('../package.json');
var parser = new require('argparse').ArgumentParser({addHelp: true, version: pkg.version});

/* Define parse and return command line arguments */
module.exports.parse = function(){
  parser.addArgument(
    '--sourceRegion',
    {
      help: 'Required: The region holding the source tables',
      required: true
    }
  );
  parser.addArgument(
    '--replicaRegion',
    {
      help: 'Required: The region holding the replica tables',
      required: true
    }
  );

  parser.addArgument(
    '--table',
    {
      help: 'Required: Name of the table to check',
      required: true
    }
  );

  parser.addArgument(
    '--throughputRatio',
    {
      help: 'Required: Percent of provisioned read throughput to consume (0 - 1)',
      required: true
    }
  );

  parser.addArgument(
    '--profile',
    {
      help: 'Optional: AWS profile to assume',
      defaultValue: 'default'
    }
  );

  return parser.parseArgs();
};
