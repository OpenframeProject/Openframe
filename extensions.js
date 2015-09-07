'use strict';
var fs = require('fs'),
    pubsub = require('./pubsub');

function loadPlugins(socket, pubsub) {
  fs.readdirSync('./plugins').forEach(function (file) {
    if (file.substr(-3, 3) === '.js' && file !== 'index.js') {
      require('./plugins/' + file.replace('.js', ''))(socket, pubsub);
    }
  });
}


// When the frame connects, load any extensions from the plugins dir
pubsub.on('connected', function(socket) {
    console.log('loading plugins');
    loadPlugins(socket, pubsub);
});