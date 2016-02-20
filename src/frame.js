var diff = require('deep-diff').diff,
    jsonfile = require('jsonfile'),
    debug = require('debug')('openframe:frame'),

    rest = require('./rest'),
    pm = require('./plugin-manager'),

    frame_file = './.frame.json',

    frame = module.exports = {};

// current state of the frame
frame.state = {};
// when the frame is updating, the incoming state from the server
frame.incoming_state = {};

frame.load = function() {
    debug('load');
    return new Promise(function(resolve, reject) {
        frame.inflateStateFromFile()
            .then(function(state) {
                resolve(state);
            })
            .catch(reject);
    });
};

/**
 * Save the current local frame state to the server,
 * and persist to local disk.
 *
 * @param {Boolean} persist Defaults to true
 * @return {Promise}
 */
frame.save = function(persist) {
    debug('save');
    var _persist = persist === false ? false : true;

    // careful about circular saving... save on the server triggers save locally, triggers save to server, etc...
    rest.client.Frame.Frame_upsert({
        data: frame.state,
        id: frame.state.id
    })
    .then(function(data) {
        debug('saved!');
    })
    .catch(debug);

    // TODO: save to server
    if (_persist) {
        frame.persistStateToFile();
    }
};

/**
 * Fetch the current frame state from the server
 * @return {Promise}
 */
frame.fetch = function() {
    debug('fetch');
    return new Promise(function(resolve, reject) {
        if (frame.state && frame.state.id) {
            // a frame with an ID is present
            rest.client.Frame.Frame_findById({
                id: frame.state.id
            }).then(function(data) {
                debug('Frame_findById - found');


                // frame.incoming_state = data.obj;

                // frame.updatePlugins()
                //     .then(frame.updateArtwork);

                // frame.updateSettings()
                //     .then(updatePlugins)
                //     .then(updateArtwork);


                // save updated frame to local disk
                frame.state = data.obj;
                frame.persistStateToFile().then(function() {
                    resolve(frame.state);
                });
            }).catch(reject);
        } else {
            reject();
        }
    });
};

frame.updateSettings = function() {
    return new Promise(function(resolve, reject) {
        var differences = diff(frame.state.settings, frame.incoming_state.settings);

        if (!differences) return resolve();

        if (differences.length) {
            differences.forEach(function(difference) {
                if (difference.kind === 'D') {
                    // setting removed
                }
                if (difference.kind === 'E') {
                    // setting edited
                }
                if (difference.kind === 'N') {
                    // setting added
                }
            });
        }
    });
};

/**
 * Calculate the diff between the current frame's plugins and previous plugins
 * @return {Promise}
 */
frame.updatePlugins = function() {
    return new Promise(function(resolve, reject) {
        var differences = diff(frame.state.plugins, frame.incoming_state.plugins),
            installPromise,
            removePromise,
            pluginPromises = [],
            toRemove = {},
            toInstall = {};

        // no differences, nothing to update
        if (!differences) {
            return resolve();
        }

        // iterate through differences, build hashes of those to install and those to remove
        differences.forEach(function(difference) {
            if (difference.kind === 'D') {
                // plugin removed
                toRemove[difference.path[0]] = difference.lhs;
            }
            if (difference.kind === 'E' || difference.kind === 'N') {
                // plugin edited or added (N for New), either way install
                toInstall[difference.path[0]] = difference.rhs;
            }
        });

        pluginPromises.push(pm.installPlugins(toInstall));
        pluginPromises.push(pm.removePlugins(toRemove));

        Promise.all(pluginPromises).then(resolve).catch(reject);

    });
};

/**
 * Calculate the diff between currently displayed artwork and incoming artwork
 * @return {Promise}
 */
frame.updateArtwork = function() {
    return new Promise(function(resolve, reject) {
        var differences = diff(frame.state._current_artwork, frame.incoming_state._current_artwork);

        // no differences, nothing to update
        if (!differences) {
            return resolve();
        }

        // there are differences, continue updating
        if (frame.state._current_artwork) {
            // frame is currently displaying something
        } else {
            //
        }

    });
};

/**
 * Persist the local frame state to disk
 * @return {Promise}
 */
frame.persistStateToFile = function() {
    debug('persistStateToFile');
    return new Promise(function(resolve, reject) {
        jsonfile.writeFile(frame_file, frame.state, {
            spaces: 2
        }, function(err) {
            if (err) {
                reject(err);
                return;
            }
            resolve(frame.state);
        });
    });
};

/**
 * Synchronously persist the local frame state to disk
 * @return {Promise}
 */
frame.persistStateToFileSync = function() {
    debug('persistStateToFileSync');
    jsonfile.writeFileSync(frame_file, frame.state, {
        spaces: 2
    });
};



/**
 * Laod the local frame state
 * @return {Promise}
 */
frame.inflateStateFromFile = function() {
    debug('inflateStateFromFile');
    return new Promise(function(resolve, reject) {
        jsonfile.readFile(frame_file, function(err, state) {
            frame.state = state || {};
            resolve(state);
        });
    });
};

/**
 * Add a new format to this frame.
 *
 * This function is passed along to plugins' init method as part of
 * the sandboxed pluginApi, allowing plugins to add formats to a frame.
 *
 * @param {object} format a format object, defining details of the format
 */
frame.addFormat = function(format) {
    debug('addFormat');
    frame.state.formats = frame.state.formats || {};
    frame.state.formats[format.name] = format;
    frame.persistStateToFile();
};
