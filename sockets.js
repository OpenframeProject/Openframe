'use strict';

/**
 * Small wrapper for the websocket connection (socket.io)
 */

var io = require('socket.io-client'),
    config = require('./config'),
    // controller = require('./controller'),
    pubsub = require('./pubsub');


var socket;

/**
 * Open the socket connection, and binds the default socket events and hands them off to the pubsub.
 *
 * Emits a 'connected' application event, which triggers loading of extensions.
 */
function connect() {
    var url = config('api_protocol') + '://' + config('api_domain') + ":" + config('api_port');

    console.log(url);

    socket = io.connect(url);

    socket.on('connect', function() {
        console.log("socket connected");
        pubsub.emit('connected', socket);
    });

    socket.on('artwork:update', function(data) {
        console.log('artwork:update', data);
        pubsub.emit('artwork:update', data);
    });

    socket.on('display:off', function() {
        pubsub.emit('display:off');
    });

    socket.on('display:on', function() {
        pubsub.emit('display:on');
    });
}

/**
 * Get the socket.io socket connection.
 * @return {Object} The socket.
 */
function getSocket() {
    return socket;
}



exports.connect = connect;
exports.getSocket = getSocket;