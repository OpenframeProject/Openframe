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
    debug = require('debug')('index'),
    config = require('./config'),
    rest = require('./rest'),
    frame = require('./frame'),
    frame_controller = require('./controller'),
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
        // console.log(rest.client);

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


// config.load() // load the config from file
//     .then(frame.init) // load the frame state from file
    // .then(function(ofrc) {
    //     console.log('config loaded...', ofrc);
    //     var auth = ofrc.auth || {},
    //         questions = [];

    //     if (!auth.username) {
    //         // ask for user
    //         questions.push({
    //             name: 'username',
    //             message: 'Enter your Openframe username:'
    //         });
    //     }

    //     if (!auth.password) {
    //         // ask for pass
    //         questions.push({
    //             name: 'password',
    //             type: 'password',
    //             message: 'Enter your Openframe password:'
    //         });
    //     }

    //     if (!ofrc.frame || !ofrc.frame.name) {
    //         // ask frame name
    //         questions.push({
    //             name: 'frame_name',
    //             message: 'Enter a name for this Frame:'
    //         });
    //     }

    //     if (questions.length) {
    //         inquirer.prompt(questions, function(answers) {
    //             saveAnswers(answers, ofrc);
    //         });
    //     } else {
    //         init(ofrc);
    //     }
    // })
//     .catch(function(err) {
//         if (err) {
//             console.error(err);
//             return;
//         }
//     });


/**
 * Save the answers from the prompt to .ofrc file.
 * @param  {Object} answers
 */
function saveAnswers(answers) {
    console.log('saveAnswers');
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
    console.log('init');

    frame_controller.init();

    // // instantiate the frame controller
    // new FrameController();
}

