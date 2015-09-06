// dependencies
var program = require('commander');

// app dependencies
var config = require('./conf'),
    sockets = require('./sockets'),
    extensions = require('./extensions');

program
    .version('0.0.1')
    .option('-u, --username <username>', 'Username to which this frame will be linked.')
    .option('-f, --framename <framename>', 'Name for the frame.')
    .option('-d, --api-dom <api_domain>', 'The domain at which the Openframe API is accessible. Defaults to localhost.')
    .option('-p, --api-port <api_port>', 'The port at which the Openframe API is accessible. Defaults to 8888.')
    .option('-r, --reset', 'If present, reset the configuration, i.e. treat this as an entirely new frame.')
    .parse(process.argv);

// set commandline defaults
if (!program.username) {
    console.log('Username is required.');
    program.outputHelp();
    process.exit();
} else {
    console.log('Starting as ' + program.username);
}

config.username = program.username;
config.root_domain = program.dom || "localhost:8888";
config.chromium = program.chromium;
config.reset = program.reset;
config.framename = program.framename || 'New Frame';

// Initiate websocket connection to the api server
sockets.connect();