var jsonfile = require('jsonfile'),
    debug = require('debug')('openframe:frame'),

    rest = require('./rest'),
    config = require('./config'),
    frame_file = config.getOpenframeDir() + '/frame.json',

    frame = module.exports = {};

frame.state = {};

/**
 * Load the current frate state from disk.
 * @return {Promise}
 */
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

    // TODO: save to server
    if (_persist) {
        frame.persistStateToFile();
    }

    // careful about circular saving... save on the server triggers save locally, triggers save to server, etc...
    return rest.client.Frame.Frame_upsert({
        data: frame.state,
        id: frame.state.id
    }).catch(debug);
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

                frame.state = data.obj;
                frame.persistStateToFile().then(function() {
                    resolve(frame.state);
                });


            }).catch(function(err) {
                reject();
            });
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
    frame.persistStateToFile();
};
