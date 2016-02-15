// to start frame, run `$ npm start`
//
//
/**
 *
 * - read config file for email, password, framename
 * - if not found, prompt user for these details and save them to the file
 * - authenticate user
 * - if this frame is already registered with user, connect it
 * - if this frame is new, create it and add it to the user
 * - install plugins
 * - initialize plugins
 * - fetch current artwork
 */

'use strict';

var inquirer = require('inquirer'),
    debug = require('debug')('openframe:index'),
    config = require('./src/config'),
    rest = require('./src/rest'),
    frame = require('./src/frame'),
    frame_controller = require('./src/controller'),
    initializers;

// load config and frame
initializers = [
    config.load(),
    frame.load()
];

Promise.all(initializers)
    .then(rest.init)
    .then(function() {
        debug(config.ofrc);
        debug(frame.state);

        var auth = config.ofrc.auth || {},
            questions = [];

        if (!auth.username) {
            // ask for user
            questions.push({
                name: 'username',
                message: 'Enter your Openframe username:'
            });
        }

        if (!auth.password) {
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
                saveAnswers(answers);
            });
        } else {
            init();
        }

    }).catch(function(err) {
        debug(err);
    });


/**
 * Save the answers from the prompt to .ofrc file.
 * @param  {Object} answers
 */
function saveAnswers(answers) {
    var ofrc = config.ofrc;
    if (!ofrc.auth) {
        ofrc.auth = {};
    }
    if (answers) {
        if (answers.username) {
            ofrc.auth.username = answers.username;
        }
        if (answers.password) {
            ofrc.auth.password = answers.password;
        }
        if (answers.frame_name) {
            frame.state.name = answers.frame_name;
        }
    }

    config
        .save()
        .then(init);
}

/**
 * Start up the frame
 */
function init() {
    debug('Initializing Frame Controller');
    frame_controller.init();
}

