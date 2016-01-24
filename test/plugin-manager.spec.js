var assert = require('assert'),
    sinon = require('sinon'),
    npm = require('npm'),
    pm = require('../plugin-manager');

var config = {
    ofrc: {
        frame: {
            plugins: {
                "lodash": "4.0.0"
            }
        }
    },
    save: sinon.spy()
};

before(function() {
    pm.init(config);
});

afterEach(function(done) {
    this.timeout(0);
    npm.load({
        logLevel: 'silent'
    }, function(err) {
        if (err) {
            console.error(err);
            return;
        }
        npm.commands.remove(['lodash'], function(err, data) {
            if (err) {
                console.error(err);
            }
            // command succeeded, and data might have some info
            done();
        });
    });
});

describe('init', function() {
    // it('should store a local reference to the plugin list', function(done) {
    //     assert.equal(pm.plugins["lodash"], "4.0.0");
    //     done();
    // });
});

describe('installPlugin', function() {
    this.timeout(0);
    it('should install an npm package with a version specified', function(done) {
        pm.installPlugin("lodash", "4.0.0")
            .then(function() {
                npm.load({
                    logLevel: 'silent'
                }, function(err) {
                    if (err) {
                        console.error(err);
                        return;
                    }
                    npm.commands.ls(['lodash'], function(err, data) {
                        if (err) {
                            console.error(err);
                        }
                        assert.equal(data._found, 1);
                        // command succeeded, and data might have some info
                        done();
                    });
                });

            });
    });

    it('should install an npm package without a version specified', function(done) {
        pm.installPlugin("lodash")
            .then(function() {
                npm.load({
                    logLevel: 'silent'
                }, function(err) {
                    if (err) {
                        console.error(err);
                        return;
                    }
                    npm.commands.ls(['lodash'], function(err, data) {
                        if (err) {
                            console.error(err);
                        }
                        assert.equal(data._found, 1);
                        // command succeeded, and data might have some info
                        done();
                    });
                });

            });
    });

    it('should fail to install an npm package that does not exist', function(done) {

        pm.installPlugin("openframe-this-is-not-real")
            .catch(function(err) {
                done();
            });
    });

});


describe('installPlugins', function() {
    this.timeout(0);
    it('should install all plugins passed in an npm dependency object', function(done) {
        pm.installPlugins(config)
            .then(function() {
                npm.load({
                    logLevel: 'silent'
                }, function(err) {
                    if (err) {
                        console.error(err);
                        return;
                    }
                    npm.commands.ls(['lodash'], function(err, data) {
                        if (err) {
                            console.error(err);
                        }
                        assert.equal(data._found, 1);
                        done();
                    });
                });

            });
    });
});

describe('addPlugin', function() {
    this.timeout(0);
    it('should add and install a new plugin', function(done) {
        pm.addPlugin("lodash")
            .then(function() {
                npm.load({
                    logLevel: 'silent'
                }, function(err) {
                    if (err) {
                        console.error(err);
                        return;
                    }
                    npm.commands.ls(['lodash'], function(err, data) {
                        if (err) {
                            console.error(err);
                        }
                        // openframe-keystroke found
                        assert.equal(data._found, 1);

                        // check that the config was saved
                        assert(config.save.called);
                        done();
                    });
                });

            });
    });

    it('should fail to add and install a non existent plugin', function(done) {
        pm.addPlugin("openframe-this-is-not-real")
            .catch(function(err) {
                done();
            });
    });
});
