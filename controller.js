/**
 * The main controller for the frame.
 */

// app dependencies
var util = require('util'),
    url = require('url'),
    path = require('path'),
    debug = require('debug')('frame_controller'),
    EventEmitter = require('events').EventEmitter,
    Swagger = require('swagger-client'),

    downloader = require('./downloader'),
    pubsub = require('./pubsub'),
    proc_man = require('./process-manager'),
    pm = require('./plugin-manager'),
    config = require('./config'),
    frame = require('./frame'),
    rest = require('./rest'),

    // --> EXPORT
    fc = module.exports = {};

// inherit from EventEmitter
util.inherits(fc, EventEmitter);

/**
 * Initialize the frame controller
 * - generate Swagger client
 * - login user
 * - connect frame
 * - update frame
 * - update plugins
 * - if necessary, install plugins
 * - init plugins
 */
fc.init = function() {
    debug('init');

    this.login()
        .then(this.connect)
        .then(this.ready)
        .catch(function(err) {
            debug(err);
        });
};

/**
 * Called when the frame has finished initializing.
 */
fc.ready = function() {
    debug('ready', frame.state);

    if (frame.state && frame.state._current_artwork) {
        fc.changeArtwork();
    }
};


/**
 * Authenticate to the API server using the supplied user/pass.
 *
 * @return {Promise} A promise resolving with the logged-in user's ID
 */
fc.login = function() {
    debug('login');

    var creds = config.ofrc.auth;
    return new Promise(function(resolve, reject) {
        rest.client.OpenframeUser.OpenframeUser_login({
            credentials: creds
        }).then(function(resp) {
            if (resp.obj.id) {
                creds.access_token = resp.obj.id;
                rest.client.clientAuthorizations.add('access_token', new Swagger.ApiKeyAuthorization('access_token', resp.obj.id, 'query'));
            }
            resolve(resp.obj.userId);
        }).catch(function(err) {
            console.log('err', err);
            reject(err);
        });
    });
};

/**
 * Connect this Frame. If the Frame has not yet been created, i.e. there is no
 * id on the Frame object in ofrc, create a new Frame.
 *
 * @param  {String} userId
 * @return {Promise}
 */
fc.connect = function(userId) {
    debug('connect', userId);

    return new Promise(function(resolve, reject) {
        // called when frame is ready to connect
        function readyToConnect() {
            debug('readyToConnect');
            fc.pubsub = pubsub.init(fc);
            resolve();
        }

        frame
            .fetch()
            .then(function() {
                debug('ready to init...');
                return pm.initPlugins(frame.state.plugins, fc.pluginApi);
            })
            .then(readyToConnect)
            .catch(function(err) {
                debug(err);
                fc.registerNewFrame(userId)
                    .then(readyToConnect)
                    .catch(function(err) {
                        console.log(err);
                        reject(err);
                    });
            });
    });
};

/**
 * Register this as a new frame for user [userId]. This creates a new
 * Frame object on the server via the REST api.
 *
 * TODO: should this be on the frame model? a create method?
 *
 * @param  {String} userId
 * @return {Promise} A promise resolving with the newly created Frame object
 */
fc.registerNewFrame = function(userId) {
    debug('registerNewFrame', userId);

    return new Promise(function(resolve, reject) {
        rest.client.OpenframeUser.OpenframeUser_prototype_create_frames({
            data: {
                name: frame.state.name
            },
            id: userId
        }).then(function(data) {
            debug(data.obj);
            frame.state = data.obj;
            frame.persistStateToFile();
            pm.installPlugins(frame.state.plugins)
                .then(function() {
                    resolve(frame.state);
                });
            // update the plugins
            // fc.updatePlugins(frame)
            //     .then(function() {
            //         resolve(frame.state);
            //     });
        }).catch(function(err) {
            debug(err);
            reject(err);
        });
    });
};

/**
 * Change the artwork being displayed to that which is stored in the
 * Frame's _current_artwork.
 */
fc.changeArtwork = function() {
    debug('changeArtwork');

    var old_artwork = fc.current_artwork || undefined,
        new_artwork = frame.state._current_artwork,
        old_format = old_artwork && frame.state.formats[old_artwork.format],
        new_format = frame.state.formats[new_artwork.format],
        tokens = {},
        parsed, file_name;

    function swapArt() {
        debug('swapArt');
        if (old_artwork) {
            _endArt(old_format.end_command, tokens).then(function() {
                _startArt(new_format.start_command, tokens);
                fc.current_artwork = new_artwork;
            });
        } else {
            _startArt(new_format.start_command, tokens);
            fc.current_artwork = new_artwork;
        }
    }

    if (new_format.download) {
        // this artwork needs to be downloaded
        parsed = url.parse(new_artwork.url);
        file_name = path.basename(parsed.pathname);

        downloader.downloadFile(new_artwork.url, new_artwork._id + file_name)
            .then(function(file) {
                tokens['$filepath'] = file.path;
                swapArt();
            });
    } else {
        // this artwork can be displayed via the url
        tokens['$url'] = new_artwork.url;
        swapArt();
    }
};

/**
 * A sandboxed API passed into plugins' init function.
 * @type {Object}
 */
fc.pluginApi = {
    // let the plugin add a format to the frame
    addFormat: frame.addFormat,
    // give the plugin access to the global pubsub
    getPubsub: function() {
        return fc.pubsub;
    }
};

/**
 * Start an artwork.
 * @param  {string} _command
 * @param  {object} tokens
 * @return {Promise}
 */
function _startArt(_command, tokens) {
    debug('startArt');
    var command = _replaceTokens(_command, tokens);

    return new Promise(function(resolve, reject) {
        // TODO: proc_man.startProcess doesn't return Promise
        // can we know when the process is ready without ipc?
        proc_man.startProcess(command);
        resolve();
    });
}

/**
 * End a playing artwork.
 * @param  {string} _command
 * @param  {object} tokens
 * @return {Promise} Resolves when command is complete.
 */
function _endArt(_command, tokens) {
    debug('endArt');
    var command = _replaceTokens(_command, tokens);
    return new Promise(function(resolve, reject) {
        proc_man.exec(command, function(err) {
            if (err) {
                debug(err);
            }
            resolve();
        });
    });
}

/**
 * Replace placeholder tokens in a string.
 *
 * TODO: move to a util module
 *
 * @param  {string} _str
 * @param  {object} tokens
 * @return {string} The string with tokens replaced.
 */
function _replaceTokens(_str, tokens) {
    var str = _str,
        key;
    for (key in tokens) {
        if (tokens.hasOwnProperty(key)) {
            // TODO: better token replacement (global replacement?)
            str = _str.replace(key, tokens[key]);
        }
    }
    return str;
}
