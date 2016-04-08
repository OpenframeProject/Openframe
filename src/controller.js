/**
 * The main controller for the frame.
 */

// app dependencies
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
    Spinner = require('cli-spinner').Spinner,
    spinner = new Spinner('[%s]'),

    // --> EXPORT
    fc = module.exports = {};

// inherit from EventEmitter
util.inherits(fc, EventEmitter);

/**
 * Initialize the frame controller
 * - login user
 * - connect frame
 * - update frame
 * - update plugins
 * - if necessary, install plugins
 * - init plugins
 */
fc.init = function() {
    debug('init');

    console.log('\n');
    spinner.setSpinnerString(1);
    spinner.start();

    this.login()
        .then(this.connect)
        .then(this.ready)
        .catch(function(err) {
            debug(err);
        });
};

/**
 * Install a plugin.
 * - login user
 * - pull latest frame state
 * - install plugin package
 * - add plugin to frame.plugins
 * - exit with user-facing success/error message
 *
 * @param  {String} plugin An npm-style dependency string (package[@version]);
 */
fc.installPlugin = function(plugin) {
    debug('installPlugin', plugin);

    var pluginParts = plugin.split('@'),
        packageName = pluginParts[0],
        version = pluginParts.length > 1 ? pluginParts[1] : '';

    this.login()
        .then(function() {
            frame.fetch()
                .then(function() {
                    pm.installPlugin(packageName, version, true)
                        .then(function() {
                            debug('Installed ' + plugin + ' successfully, saving frame...');
                            // successfully installed plugin locally, add to frame
                            frame.state.plugins[packageName] = version;
                            frame.save()
                                .then(function() {
                                    console.log('[o]   Extension installed successfully!\n');
                                });
                        });
                })
                .catch(function(err) {
                    if (err.status === 404) {
                        console.log('[o]   ERROR: This frame has been set up perviously, but is not attached this user.');
                        console.log('\n');
                        console.log('To reset the frame entirely, restart using: openframe -r');
                    }
                });
        });
};

/**
 * Uninstall a plugin.
 * - login user
 * - pull latest frame state
 * - uninstall plugin package
 * - remove plugin to frame.plugins
 * - exit with user-facing success/error message
 *
 * @param  {String} plugin name (npm package);
 */
fc.uninstallPlugin = function(packageName) {
    debug('uninstallPlugin', packageName);

    this.login()
        .then(function() {
            frame.fetch()
                .then(function() {
                    pm.uninstallPlugin(packageName)
                        .then(function() {
                            debug('Uninstalled ' + packageName + ' successfully, saving frame...');
                            // successfully installed plugin locally, add to frame
                            if (packageName in frame.state.plugins) {
                                delete frame.state.plugins[packageName];
                            }
                            frame.save()
                                .then(function(resp) {
                                    // debug(resp);
                                    console.log('[o]   Extension uninstalled successfully!\n');
                                });
                        }).catch(function(err) {
                            console.log('[o]   ERROR: Problem uninstalling the extension. Are you sure it is installed?\n');
                        });
                })
                .catch(function(err) {
                    if (err.status === 404) {
                        console.log('[o]   ERROR: This frame has been set up perviously, but is not attached this user.');
                        console.log('\n');
                        console.log('To reset the frame entirely, restart using: openframe -r');
                    }
                });
        });
};

/**
 * Called when the frame has finished initializing.
 */
fc.ready = function() {
    debug('ready');
    spinner.stop(true);

    if (frame.state && frame.state._current_artwork) {
        fc.changeArtwork();
    } else {
        // remove port if it's 80
        var url_port = config.ofrc.network.api_url.split(':');
        var url = url_port[2] === '80' ? url_port[0] + url_port[1] : config.ofrc.network.api_url;


        // No current artwork... give the user a message:
        console.log('[o]   Connected! You can now push artwork to this frame.');
        console.log('\n');
        console.log('This frame should now appear as ' + frame.state.name + ' when you log in to Openframe at ' + url + '.');
        console.log('\n');
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
            rest.client.OpenframeUser.OpenframeUser_config().then(function(conf_resp) {
                debug(resp);
                config.ofrc.pubsub_url = conf_resp.obj.config.pubsub_url;
                config.save().then(function() {
                    resolve(resp.obj.userId);
                });
            });
        }).catch(function(err) {
            // login failed...
            debug('Login failed. Please try again.');
            spinner.stop(true);
            console.log('[o]   Login failed. Please try again.');
            console.log('\n');
            user.state = {};
            user
                .save()
                .then(function() {
                    process.exit(0);
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

        // XXX - POTENTIAL BUG - catch plugin init error separately, otherwise a new frame is created.
        frame
            .fetch()
            .then(function() {
                debug('ready to init...');
                // initPlugins now always resolves, is never rejected
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
 * TODO: should this be on the frame model? a create method?
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
        old_format = old_artwork && frame.state.formats[old_artwork.format],
        new_format = frame.state.formats[new_artwork.format],
        tokens = {},
        parsed, file_name;

    return new Promise(function(resolve, reject) {
        // old artwork is new artwork, don't update.
        if (old_artwork && JSON.stringify(old_artwork) === JSON.stringify(new_artwork)) {
            debug('new artwork same as current', old_artwork.id, new_artwork.id);
            return reject();
        }

        function swapArt() {
            debug('swapArt');
            if (old_artwork) {
                _endArt(old_format.end_command, tokens)
                    .then(function() {
                        _startArt(new_format.start_command, tokens).then(function() {
                            fc.current_artwork = new_artwork;
                            fc.pubsub.publish('/frame/'+frame.state.id+'/frame_updated', frame.state.id);
                            resolve();
                        });
                    })
                    .catch(reject);
            } else {
                _startArt(new_format.start_command, tokens).then(function() {
                    fc.current_artwork = new_artwork;
                    resolve();
                });
            }
        }

        if (new_format.download) {
            debug('download');
            // this artwork needs to be downloaded
            parsed = url.parse(new_artwork.url);
            file_name = path.basename(parsed.pathname);

            downloader.downloadFile(new_artwork.url, new_artwork.id + file_name)
                .then(function(filePath) {
                    tokens['$filepath'] = filePath;
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
    // let subscribers know the frame is updating
    fc.pubsub.publish('/frame/'+frame.state.id+'/frame_updating', frame.state.id);

    // fetch the latest frame state, and update as needed
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
    // access to the Swagger rest client
    getRest: function() {
        return rest.client;
    },
    // access to the frame model reference
    getFrame: function() {
        return frame;
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
