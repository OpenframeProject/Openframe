var assert = require('assert'),
    sinon = require('sinon'),
    npm = require('npm'),
    ext_man = require('../src/extension-manager');

var frame = {
    state: {
        extensions: {
            "lodash": "4.0.0"
        }
    }
}

before(function() {
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

describe('installExtension', function() {
    this.timeout(0);
    it('should install an npm package with a version specified', function(done) {
        ext_man.installExtension("lodash", "4.0.0")
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
        ext_man.installExtension("lodash")
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

        ext_man.installExtension("openframe-this-is-not-real")
            .catch(function(err) {
                done();
            });
    });

});


describe('installExtensions', function() {
    this.timeout(0);
    it('should install all extensions passed in an npm dependency object', function(done) {
        ext_man.installExtensions(frame.state.extensions)
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
