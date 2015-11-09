#!/usr/local/bin/node
'use strict';

var proc_man = require('../process-manager');

var exec = require('child_process').exec;

var command = 'glslViewer /home/pi/Openframe-FrameController/artwork/55ecac34840c5ec003ff51actest.frag';
// var command = 'xinit ./.xinitrc';


console.log('running ' + command);
proc_man.startProcess(command);

// var child = exec(command, function (error, stdout, stderr) {
//     console.log('error: ' + error);
//     console.log('stdout: ' + stdout);
//     console.log('stderr: ' + stderr);
//     if (error !== null) {
//       console.log('exec error: ' + error);
//     }
// });

// console.log(child.pid);
