'use strict';

/**
 * A very basic pubsub for inter-module async communication
 */

var EventEmitter = require('events').EventEmitter;

module.exports = new EventEmitter();

