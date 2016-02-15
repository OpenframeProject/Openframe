#! /usr/bin/env node

var program = require('commander'),
    inquirer = require('inquirer'),
    debug = require('debug')('openframe:cli'),
    p = require('../package.json'),
    version = p.version.split('.').shift(),
    config = require('../src/config'),
    frame = require('../src/frame'),
    user = require('../src/user'),
    rest = require('../src/rest'),
    frame_controller = require('../src/controller'),
    initializers;

program
    .version(version)
    .option('-r, --reset', 'Reset this frame. Erases current frame data, and registers this as a new frame.')
    // .option('-d, --domain [domain]', 'The domain where the API server sits.')
    // .option('-p, --port [port]', 'The port on which the API server is listening.')
    .arguments('[username] [password] [framename]')
    // .action(function(username, password, framename) {

    // })
    .parse(process.argv);

// load config and frame from local dot files
initializers = [
    config.load(),
    frame.load(),
    user.load()
];

Promise.all(initializers)
    .then(rest.init)
    .then(function() {
        debug(config.ofrc);
        debug(frame.state);
        debug(user.state);

        if (program.reset) {
            reset()
                .then(processArgs)
                .catch(debug);
        } else {
            processArgs();
        }

    }).catch(function(err) {
        debug(err);
    });


function processArgs() {
    debug('processArgs');
    // if username was passed, set it
    user.state.username = program.username || user.state.username;
    // if password was passed, set it
    user.state.password = program.password || user.state.password;
    // if framename passed, set it
    frame.state.name = program.framename || frame.state.name;

    debug(user.state, frame.state);

    var questions = [];

    if (!user.state.username) {
        // ask for user
        questions.push({
            name: 'username',
            message: 'Enter your Openframe username:'
        });
    }

    if (!user.state.password) {
        // ask for pass
        questions.push({
            name: 'password',
            type: 'password',
            message: 'Enter your Openframe password:'
        });
    }

    if (!frame.state.name) {
        // ask frame name
        questions.push({
            name: 'frame_name',
            message: 'Enter a name for this Frame:'
        });
    }

    if (questions.length) {
        inquirer.prompt(questions, function(answers) {
            saveAnswers(answers)
                .then(init);
        });
    } else {
        init();
    }
}

/**
 * Reset the frame. This means:
 * - delete current frame state
 * - delete current user state
 *
 * @return {Promise} A promise resolving when the user and frame have been reset
 */
function reset() {
    debug('Reseting frame.');
    return new Promise(function(resolve, reject) {
        user.state = {};
        frame.state = {};
        user.save()
            .then(frame.persistStateToFile)
            .then(resolve)
            .catch(reject);
    });
}

/**
 * Save the answers from the prompt to .ofrc file.
 * @param  {Object} answers
 * @return {Promise}
 */
function saveAnswers(answers) {
    if (answers) {
        if (answers.username) {
            user.state.username = answers.username;
        }
        if (answers.password) {
            user.state.password = answers.password;
        }
        if (answers.frame_name) {
            frame.state.name = answers.frame_name;
        }
    }

    return user.save();
}

/**
 * Start up the frame
 */
function init() {
    debug('Initializing Frame Controller');
    frame_controller.init();
}

