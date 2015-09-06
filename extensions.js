'use strict';
var fs = require('fs'),
    pubsub = require('./pubsub');

// require('./artwork');
// require('./users');
// require('./frames');

function loadPlugins(socket) {
  fs.readdirSync('./plugins').forEach(function (file) {
    if (file.substr(-3, 3) === '.js' && file !== 'index.js') {
      require('./plugins/' + file.replace('.js', ''))(socket);
    }
  });
}


// When the frame connects, load any extensions from the plugins dir
pubsub.on('connected', function(socket) {
    console.log('loading plugins');
    loadPlugins(socket);
});