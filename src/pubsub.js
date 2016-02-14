'use strict';

var faye = require('faye'),
    config = require('./config'),
    frame = require('./frame'),

    ps = module.exports = {};

ps.client = {};

ps.init = function(fc) {
    var network = config.ofrc.network,
        pubsub_url = network.pubsub_protocol + '://' + network.pubsub_domain + ':' + network.pubsub_port;

    // add a pubsub client for the API server
    ps.client = new faye.Client(pubsub_url + '/faye');

    // handlers for pubsub connection events
    ps.client.on('transport:down', function() {
        // the pubsub client is offline
        console.log('pubsub client dsconnected');
    });

    ps.client.on('transport:up', function() {
        // the pubsub client is online
        console.log('pubsub client connected');
        ps.client.publish('/frame/connected', frame.state.id);
    });

    ps.client.subscribe('/frame/' + frame.state.id + '/updated', function(data) {
        console.log(data);
        frame.fetch()
            .then(fc.changeArtwork);
    });

    return ps.client;
};
