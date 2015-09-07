'use strict';

/**
 * Small wrapper for the websocket connection (socket.io)
 */

var io = require('socket.io-client'),
    config = require('./config'),
    controller = require('./controller'),
    pubsub = require('./pubsub');


var socket;

/**
 * Open the socket connection, and binds the default socket events.
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
        controller.changeArtwork(data);
    });
}

/**
 * Get the socket.io socket connection.
 *
 * This can be useful for adding event handlers.
 *
 * @return {Object} The socket.
 */
function getSocket() {
    return socket;
}



exports.connect = connect;
exports.getSocket = getSocket;