'use strict';

/**
 * Example plugin which reads keystrokes from standard in.
 */

module.exports = function(socket, pubsub) {
    console.log('loading keystrokes plugin');
    // bind to or emit additional socket / pubsub events here,
    // and do with them what you please.


    // here we're setting up the stdin to read in keystrokes
    var stdin = process.stdin;
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');

    // on any data into stdin
    stdin.on('data', function(key) {
        // ensure we can still exit (ctrl-c)
        if (key === '\u0003') {
            process.exit();
        }
        // write the key to stdout just because
        process.stdout.write(key + '\n');

        // let's emit a plugin-defined event which could be handled elsewhere
        // in this plugin, on by other plugins.
        pubsub.emit('plugin:keystrokes:keypress', key);

        // if 'r' is pressed, emit the built-in artwork:random event
        // over the socket connection
        if (key === 'r') {
            socket.emit('artwork:random');
        }
    });
};
