var jsonfile = require('jsonfile'),
    debug = require('debug')('frame'),

    rest = require('./rest'),
    pm = require('./plugin-manager'),

    frame_file = './.frame.json',

    frame = module.exports = {};

frame.state = {};

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
        .catch(console.log);

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
                debug('Frame_findById - found', data);

                // - check diff between our current _state and incoming state
                // - do we need to add plugins?
                // - do we need to remove plugins?
                // - do we need to update settings?
                // var newState = data.obj,
                    // pluginsToAdd = _pluginsToAdd(newState),
                    // pluginsToRemove = _pluginsToRemove(newState);

                // if (pluginsToAdd.length) {
                //     // there are new plugins to install
                //     debug('----> ADD PLUGINS', pluginsToAdd);
                // }

                // if (pluginsToRemove.length) {
                //     // there are plugins to remove
                //     debug('----> REMOVE PLUGINS', pluginsToRemove);
                // }

                pm.installPlugins(data.obj.plugins)
                    .then(function() {
                        debug('-----> plugins installed');
                        // once we're done update the frame plugins / settings, persist the _state
                        frame.state = data.obj;
                        frame.persistStateToFile().then(function() {
                            resolve(frame.state);
                        });
                    });



            }).catch(reject);
        } else {
            reject();
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
    frame.save();
};


function _pluginsToAdd(_new_state) {
    return _objDiff(_new_state, frame.state);
}

function _pluginsToRemove(_new_state) {
    return _objDiff(frame.state, _new_state);
}

function _objDiff(a, b) {
    return a.filter(function(x) {
        return b.indexOf(x) < 0;
    });
}


