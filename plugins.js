'use strict';
var fs = require('fs'),
    jsonfile = require('jsonfile'),
    pubsub = require('./pubsub'),
    exec = require('child_process').exec,
    child,
    socket;

// When the frame connects, load any plugins from the plugins dir
pubsub.on('connected', function(_socket) {
    socket = _socket;
    console.log('loading plugins');
    Plugins.installPlugins();
});

pubsub.on('plugins:installed', function() {
    console.log('loading plugins');
    Plugins.initPlugins(socket, pubsub);
});


var Plugins = (function() {

    /**
     * Adds a package to the package.json file.
     * @param {String} package_name the name of the package, e.g. openframe-gpio
     * @param {String} version      the version of the package, or the git repo location
     */
    function _addToPackages(package_name, version, do_install) {
        do_install = do_install === true;
        var package_file = './package.json';

        jsonfile.readFile(package_file, function(err, obj) {
            if (err) {
                console.error(err);
                // if file doesn't exist, create it.
                // var new_obj = { plugins: {} };
                // new_obj.plugins[package_name] = version;
            }
            obj.dependencies = obj.dependencies || {};
            obj.dependencies[package_name] = version;

            jsonfile.writeFile(package_file, obj, {
                spaces: 2
            }, function(err) {
                console.error(err);
                if (err) {
                    return;
                }
                if (do_install) {
                    _installPackages();
                }
            });
        });
    }

    /**
     * Installs the packages via npm install.
     */
    function _installPackages() {
        // TODO: maybe reload the application? or at least run initPlugins?

        child = exec('npm install',
            function(error, stdout, stderr) {
                console.log('stdout: ' + stdout);
                console.log('stderr: ' + stderr);
                if (error !== null) {
                    console.log('exec error: ' + error);
                }
            });

        child.on('exit', function(exit_code, signal) {
            if (exit_code === 0) {
                pubsub.emit('plugins:installed');
            }
        });
    }

    /**
     * Add the plugins listed in plugins.json to package.json.
     *
     * By default, npm install will be run at the end. To stop this,
     * pass false as the first argument.
     *
     * @param {Boolean} do_install Whether or not to run npm install. Defaults to true.
     */
    function _addPluginsToPackages(do_install) {
        do_install = do_install !== false;
        // load plugins file and add this thing.
        var plugins_file = './plugins.json',
            package_file = './package.json';

        // open plugins file
        jsonfile.readFile(plugins_file, function(err, plugins_obj) {
            if (err) {
                console.error(err);
                return;
            }
            var plugins = plugins_obj.plugins || {};

            // open package file, add plugins as dependencies
            jsonfile.readFile(package_file, function(err, package_obj) {
                if (err) {
                    console.error(err);
                }

                // add each plugin to package.json
                for (var key in plugins) {
                    if (plugins.hasOwnProperty(key)) {
                        package_obj.dependencies[key] = plugins[key];
                    }
                }

                jsonfile.writeFile(package_file, package_obj, {
                    spaces: 2
                }, function(err) {
                    console.error(err);
                    if (err) {
                        return;
                    }
                    // install the packages if so chosen
                    if (do_install) {
                        _installPackages();
                    }
                });
            });
        });
    }

    /**
     * Install all of the plugins currently listed in plugins.json
     */
    function installPlugins() {
        _addPluginsToPackages();
    }


    function initPlugins(socket, pubsub) {
        console.log('initPlugins()');
        // load plugins file and add this thing.
        var plugins_file = './plugins.json';

        jsonfile.readFile(plugins_file, function(err, obj) {
            console.log(obj);
            if (err) {
                console.error(err);
                return;
            }
            obj.plugins = obj.plugins || {};

            for (var key in obj.plugins) {
                if (obj.plugins.hasOwnProperty(key)) {
                    console.log('requiring ', key);
                    require(key)(socket, pubsub);
                }
            }
        });
    }


    function installPlugin(package_name, version) {
        version = version || '*';

        // load plugins file and add this thing.
        var plugins_file = './plugins.json';

        jsonfile.readFile(plugins_file, function(err, obj) {
            if (err) {
                console.error(err);
                // if file doesn't exist, create it.
                // var new_obj = { plugins: {} };
                // new_obj.plugins[package_name] = version;
            }
            obj.plugins = obj.plugins || {};
            obj.plugins[package_name] = version;

            jsonfile.writeFile(plugins_file, obj, {
                spaces: 2
            }, function(err) {
                console.error(err);

            });
        });
    }

    return {
        installPlugins: installPlugins,
        installPlugin: installPlugin,
        initPlugins: initPlugins
    };
})();

module.exports = Plugins;
