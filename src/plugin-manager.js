var debug = require('debug')('openframe:plugin_manager'),
    execFile = require('child_process').execFile,
    exec = require('child_process').exec,

    config = require('./config'),

    pm = module.exports = {};

/**
 * Initialize plugins module
 *
 * TODO: UNUSED - delete me?
 *
 * @param  {Object} ofrc config object
 */
pm.init = function() {
    debug('init');
};

/**
 * Install plugins.
 *
 * TODO: since we're just running npm cli via exec(), and reason not to install
 * all plugins at once instead of one at a time?
 *
 * @param {object} plugins A hash of plugins to install
 * @param {Boolean} force Install the plugin even if it's already installed (skip the check)
 * @return {Promise} A promise resolved with all of the npmi results for each plugin
 */
pm.installPlugins = function(plugins, force) {
    debug('installPlugins');

    var promises = [],
        key,
        _force = force === true ? true : false;

    // install each plugin
    for (key in plugins) {
        if (plugins.hasOwnProperty(key)) {
            promises.push(_installPlugin(key, plugins[key], _force));
        }
    }

    return Promise.all(promises);
};

/**
 * Add a new plugin to this frame.
 *
 * Installs the plugin, and if that's successful then adds it to the plugins list.
 *
 * TODO: deal with conflicting versions of plugins
 *
 * @param  {String} package_name NPM package name
 * @param  {String} version      NPM package version (or repo URL for plugins not in NPM)
 * @return {Promise} A promise resolving with the result from npmi
 */
pm.addPlugin = function(package_name, version) {
    debug('addPlugin', package_name, version);
    return new Promise((resolve, reject) => {
        pm.installPlugin(package_name, version)
            .then(function() {
                pm.plugins[package_name] = version;
                config.save();
                resolve(package_name);
            })
            .catch(function(err) {
                debug(err);
                reject(err);
            });
    });
};

/**
 * Initialize plugins.
 *
 * @param  {String} plugin
 * @param  {Object} ofPluginApi An interface to the frame provided to each plugin
 */
pm.initPlugins = function(plugins, ofPluginApi) {
    debug('initPlugins', plugins);
    var promises = [],
        key;

    return new Promise((resolve, reject) => {
        // add each plugin to package.json
        for (key in plugins) {
            if (plugins.hasOwnProperty(key)) {
                promises.push(_initPlugin(key, ofPluginApi));
            }
        }

        Promise.all(promises)
            .then(resolve)
            .catch(resolve);
    });
};

/**
 * Install a single plugin via NPM
 *
 * Uses machine's npm as a child_process so that we don't have to depend on the npm package.
 *
 * @private
 *
 * @param  {String} package_name NPM package name
 * @param  {String} version      NPM package version (or repo URL for plugins not in NPM)
 * @param {Boolean} force Install the plugin even if it's already installed (skip the check)
 * @return {Promise} A promise resolving with the package_name
 */
function _installPlugin(package_name, version, force) {
    debug('installPlugin', package_name, version);
    var cmd = 'npm install -g ' + package_name;
    if (version) {
        cmd += '@'+version;
    }
    cmd += ' --save';
    return new Promise((resolve, reject) => {
        if (force) {
            _runNpmCommand(cmd).then(function() {
                resolve(package_name);
            });
        } else {
            _checkPlugin(package_name, version).then(function(is_installed) {
                if (!is_installed) {
                    // only install if it's not already installed.
                    _runNpmCommand(cmd).then(function() {
                        resolve(package_name);
                    }).catch(function(err) {
                        debug('Could not install', package_name, version);
                        reject(err);
                    });
                } else {
                    // otherwise just resolve
                    resolve(package_name);
                }
            });
        }
    });
}

// public exposure
pm.installPlugin = _installPlugin;

/**
 * Removes a single plugin by removing it from the npm package.
 *
 * @param  {String} package_name NPM package name
 * @return {Promise} A promise resolving with the package_name
 */
function _removePlugin(package_name) {
    debug('removePlugin', package_name);
    var cmd = 'npm remove -g ' + package_name;
    cmd += ' --save';
    return new Promise((resolve, reject) => {
        _runNpmCommand(cmd).then(function() {
            resolve(package_name);
        }).catch(reject);
    });
}

// public exposure
pm.uninstallPlugin = _removePlugin;

/**
 * Check whether a plugin is already installed.
 *
 * @param  {String} package_name NPM package name
 * @param  {String} version      NPM package version (or repo URL for plugins not in NPM)
 * @return {Promise} A promise resolving with either true (plugin installed) or false (plugin not installed)
 */
function _checkPlugin(package_name, version) {
    debug('checkPlugin', package_name, version);
    var cmd = 'npm list -g ' + package_name;
    if (version) {
        cmd += '@'+version;
    }
    return new Promise((resolve, reject) => {
        _runNpmCommand(cmd)
            .then(function() {
                debug('plugin installed');
                resolve(true);
            }).catch(function() {
                debug('plugin NOT installed');
                resolve(false);
            });
    });
}

/**
 * Initialize a single plugin.
 *
 * If the plugin has an install.sh file, execute it. Then call the plugin's init method
 * passing in a reference to the frame controller.
 *
 * TODO: initialize plugins with sandboxed API?
 * - addFormat
 * - installDeps (?)
 *
 * TODO: should install.sh execute as part of NPM install?
 *
 * @private
 *
 * @param  {String} plugin_name
 * @param  {Object} ofPluginApi An interface to the frame provided to each plugin
 * @return {Promise}
 */
function _initPlugin(plugin_name, ofPluginApi) {
    debug('_initPlugin', plugin_name);
    var plugin;
    return new Promise((resolve, reject) => {
        try {
            plugin = require(plugin_name);
            plugin.init(ofPluginApi);
            resolve(plugin);
        } catch (e) {
            // problem trying to require plugin
            debug('ERROR - ', e);
            reject(e);
        }
    });
}



function _runNpmCommand(cmd) {
    return new Promise((resolve, reject) => {
        exec(cmd, (err, stdout, stderr) => {
            debug(`stdout: ${stdout}`);
            debug(`stderr: ${stderr}`);
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}
