/**
 * User file-based persistence module. Very basic, just saves/loads json to/from a file on disk.
 */

var jsonfile = require('jsonfile'),
    debug = require('debug')('openframe:user'),
    config = require('./config'),
    user_file = config.getOpenframeDir() + '/.openframe/user.json',

    user = module.exports = {};

// Current state of the user
user.state = {};

/**
 * Save the current state to disk
 */
user.save = function() {
    debug('save');
    var self = this,
        p = new Promise(function(resolve, reject) {
            jsonfile.writeFile(user_file, self.state, {
                spaces: 2
            }, function(err) {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(self.state);
            });
        });

    return p;
};

/**
 * Load the current state from disk
 */
user.load = function() {
    debug('load');
    var self = this,
        p = new Promise(function(resolve, reject) {
            jsonfile.readFile(user_file, function(err, state) {
                // if error reading from file, just return the current state
                user.state = state || {};
                resolve(user.state);
            });
        });

    return p;
};
