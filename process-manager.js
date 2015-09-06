'use strict';

var spawn = require('child_process').spawn,
    exec = require('child_process').exec,
    psTree = require('ps-tree');

// module members
var proceses = {},
    processStack = [];


/**
 * Kick off a new child process
 * @param  {String} command The command to execute.
 */
function startProcess(command) {
    var child = exec(command);
    _setupChildProcessEvents(child);
    proceses[child.pid] = child;
    processStack.push(child.pid);
}

/**
 * Kill a child process
 * @param  {Number} pid The process id of the process to kill.
 */
function killProcess(pid) {
    // proceses[pid].kill();
    _killAllDescendents(pid);
    delete proceses[pid];
    var stack_idx = processStack.indexOf(pid);
    if (stack_idx !== -1) {
        processStack.splice(stack_idx, 1);
    }
}

function killCurrentProcess() {
    var cur_proc = getCurrentProcess();
    if (cur_proc) {
        killProcess(cur_proc);
    }
}

function getCurrentProcess() {
    if (processStack.length) {
        return processStack[0];
    } else {
        return null;
    }
}

function _setupChildProcessEvents(child) {
    child.stdout.on('data', function(data) {
        console.log('stdout: ' + data);
    });

    child.stderr.on('data', function(data) {
        console.log('stdout: ' + data);
    });

    child.on('close', function(code) {
        console.log('closing code: ' + code);
    });
}

function _killAllDescendents(pid, signal, callback) {
    signal = signal || 'SIGKILL';
    callback = callback || function() {};
    var killTree = true;
    if (killTree) {
        psTree(pid, function(err, children) {
            [pid].concat(
                children.map(function(p) {
                    return p.PID;
                })
            ).forEach(function(tpid) {
                try {
                    process.kill(tpid, signal);
                } catch (ex) {}
            });
            callback();
        });
    } else {
        try {
            process.kill(pid, signal);
        } catch (ex) {}
        callback();
    }
}


// setTimeout(function() {
//     var topPid = processStack[0];
//     proceses[topPid].kill();
// }, 3000);


exports.startProcess = startProcess;
exports.killProcess = killProcess;
exports.killCurrentProcess = killCurrentProcess;
exports.stack = processStack;
