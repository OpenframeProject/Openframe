'use strict';

var io = require('socket.io-client'),
    config = require('./conf'),
    controller = require('./controller'),
    pubsub = require('./pubsub');


var socket;


function connect() {
    var url = config.api_protocol + '://' + config.api_domain + ":" + config.api_port;

    socket = io.connect(url);

    socket.on('connect', function() {
        console.log("socket connected");
        pubsub.emit('connected', socket);
    });

    socket.on('artwork:update', function(data) {
        console.log(data);
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