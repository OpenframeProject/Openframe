/**
 * The main controller for the frame.
 */

// app dependencies
const assert = require('assert');
var util = require('util'),
    url = require('url'),
    path = require('path'),
    debug = require('debug')('openframe:frame_controller'),
    EventEmitter = require('events').EventEmitter,
    Swagger = require('swagger-client'),

    downloader = require('./downloader'),
    pubsub = require('./pubsub'),
    proc_man = require('./process-manager'),
    pm = require('./plugin-manager'),
    config = require('./config'),
    frame = require('./frame'),
    user = require('./user'),
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
    debug('ready');

    if (frame.state && frame.state._current_artwork) {
        fc.changeArtwork();
    }
};


/**
 * Authenticate with the API server using the supplied user/pass.
 *
 * @return {Promise} A promise resolving with the logged-in user's ID
 */
fc.login = function() {
    debug('login');

    var creds = user.state;
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
            // login failed...
            debug('Login failed. Please try again.');
            user.state = {};
            user
                .save()
                .then(function() {
                    reject(err);
                });
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
                        debug(err);
                        reject(err);
                    });
            });
    });
};

/**
 * Register this as a new frame for user [userId]. This creates a new
 * Frame object on the server via the REST api.
 *
 * On successful frame creation, this sets the frame.state and persists it,
 * then installs the plugins listed on the frame (i.e. the default plugins).
 *
 * TODO: should this be on the frame module? a create method?
 *
 * @param  {String} userId
 * @return {Promise} A promise resolving with the newly created Frame object
 */
fc.registerNewFrame = function(userId) {
    debug('registerNewFrame', userId);

    return new Promise(function(resolve, reject) {
        rest.client.OpenframeUser.OpenframeUser_prototype_create_owned_frames({
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
                })
                .catch(function(err) {
                    reject(err);
                });
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
    debug('changeArtwork', fc.current_artwork, frame.state._current_artwork);

    var old_artwork = fc.current_artwork || undefined,
        new_artwork = frame.state._current_artwork,
        old_format = old_artwork && old_artwork.format ? frame.state.formats[old_artwork.format] : null,
        new_format = frame.state.formats[new_artwork.format],
        tokens = {},
        parsed, file_name;

    return new Promise(function(resolve, reject) {
        // old artwork is new artwork, don't update.
        if (old_artwork && old_artwork.id === new_artwork.id) {
            debug('new artwork same as current', old_artwork.id, new_artwork.id);
            return reject();
        }

        function swapArt() {
            debug('swapArt');
            if (old_artwork) {
                fc.endArt(old_format.end_command, tokens)
                    .then(function() {
                        fc.startArt(new_format.start_command, tokens);
                        fc.current_artwork = new_artwork;
                        resolve();
                    })
                    .catch(reject);
            } else {
                fc.startArt(new_format.start_command, tokens);
                fc.current_artwork = new_artwork;
                resolve();
            }
        }

        if (new_format.download) {
            debug('download');
            // this artwork needs to be downloaded
            parsed = url.parse(new_artwork.url);
            file_name = path.basename(parsed.pathname);

            downloader.downloadFile(new_artwork.url, new_artwork.id + file_name)
                .then(function(file) {
                    tokens['$filepath'] = file.path;
                    swapArt();
                })
                .catch(reject);
        } else {
            debug('DO NOT download');
            // this artwork can be displayed via the url
            tokens['$url'] = new_artwork.url;
            swapArt();
        }

    });
};

fc.updateFrame = function() {
    frame.fetch()
        .then(function(new_state) {
            pm.installPlugins(new_state.plugins)
                .then(function() {
                    debug('-----> plugins installed');
                    pm.initPlugins(frame.state.plugins, fc.pluginApi)
                        .then(function() {
                            // once we're done updating/initializing the frame plugins, call change artwork
                            // TODO: we could add logic here to only update necessary items...
                            // For now, changeArtwork should exit if old and new artwork are the same
                            // TODO: DRY with else below
                            if (frame.state._current_artwork) {
                                fc.changeArtwork()
                                    .then(function() {
                                        // success changing artwork
                                    })
                                    .catch(function() {
                                        // error changing artwork, reset frame.state._current_artwork to true current
                                        frame.state._current_artwork = fc.current_artwork;
                                    });
                            }
                        });
                })
                .catch(debug);
        });
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
    },

    // get the current state of the frame,
    // as most recently fetched from the server
    getFrameState: function() {
        return frame.state;
    },

    // access to the Swagger rest client
    // TODO: either document this more thoroughly, or
    // better yet provide a custom and more useful rest client
    rest: rest.client
};

/**
 * Start an artwork.
 * @param  {string} _command
 * @param  {object} tokens
 * @return {Promise}
 */
fc.startArt = function(_command, tokens) {
    var command = fc.replaceTokens(_command, tokens);
    debug('startArt', command);

    return new Promise(function(resolve, reject) {
        // TODO: proc_man.startProcess doesn't return Promise
        // can we know when the process is ready without ipc?
        proc_man.startProcess(command);
        resolve();
    });
};

/**
 * End a playing artwork.
 * @param  {string} _command
 * @param  {object} tokens
 * @return {Promise} Resolves when command is complete.
 */
fc.endArt = function(_command, tokens) {
    debug('endArt');
    var command = fc.replaceTokens(_command, tokens);
    return new Promise(function(resolve, reject) {
        proc_man.exec(command, function(err) {
            if (err) {
                debug(err);
            }
            resolve();
        });
    });
};

/**
 * Replace placeholder tokens in a string.
 *
 * TODO: move to a util module
 *
 * @param  {string} _str
 * @param  {object} tokens
 * @return {string} The string with tokens replaced.
 */
fc.replaceTokens = function(_str, tokens) {
    var str = _str,
        key;
    for (key in tokens) {
        if (tokens.hasOwnProperty(key)) {
            // TODO: better token replacement (global replacement?)
            str = _str.replace(key, tokens[key]);
        }
    }
    return str;
};
