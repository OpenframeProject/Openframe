'use strict';

/**
 * Starts, stops, and tracks child processes. Used to open artworks with their specified container apps.
 */

// spawn would be necessary if we wanted to exchange data with child process (maybe for live coding?)
var spawn = require('child_process').spawn,
    exec = require('child_process').exec,
    debug = require('debug')('process_manager'),
    processes = {},
    processStack = [];


/**
 * Kick off a new child process
 * @param  {String} command The command to execute.
 */
function startProcess(command) {
    // debug('startProcess: ', command);
    var command_ary = command.split(' '),
        command_bin = command_ary[0],
        command_args = command_ary.slice(1);

    command_args.push('&>/dev/null');
    _blankScreen(function() {
        var child = spawn(command_bin, command_args, {
            // this is necessary in order to get glslViewer to display correctly:
            // https://nodejs.org/api/child_process.html#child_process_options_stdio
            stdio: 'inherit'
        });
        _setupChildProcessEvents(child);
        processes[child.pid] = child;
        processStack.push(child.pid);
    });
}

/**
 * Kill a child process
 * @param  {Number} pid The process id of the process to kill.
 */
function killProcess(pid) {
    // debug('killProcess: ', pid);
    // processes[pid].kill();
    // _killAllDescendents(pid);
    try {
        process.kill(-pid);
    } catch (e) {
        debug(e);
    }
    delete processes[pid];
    var stack_idx = processStack.indexOf(pid);
    if (stack_idx !== -1) {
        processStack.splice(stack_idx, 1);
    }
}

/**
 * Kill the currently running process (top of the stack)
 */
function killCurrentProcess() {
    // debug('killCurrentProcess');
    var cur_proc = getCurrentProcess();
    if (cur_proc) {
        killProcess(cur_proc);
    }
}

/**
 * Get the current process id (top of the stack);
 * @return {Number} pid
 */
function getCurrentProcess() {
    if (processStack.length) {
        return processStack[0];
    } else {
        return null;
    }
}

/**
 * Attach event handlers to the child processes.
 * @param  {Process} child
 */
function _setupChildProcessEvents(child) {
    if (child.stdout) {
        child.stdout.on('data', function(data) {
            debug('stdout: ' + data);
        });
    }

    if (child.stderr) {
        child.stderr.on('data', function(data) {
            debug('stdout: ' + data);
        });
    }

    child.on('close', function(code) {
        debug('child ' + child.pid + ' closing code: ' + code);
    });
}

/**
 * Write 0s to the framebuffer in order to ensure a black screen.
 */
function _blankScreen(_cb) {
    var cb = _cb || function() {};
    exec('dd if=/dev/zero of=/dev/fb0', cb);
}

exports.exec = exec;
exports.startProcess = startProcess;
exports.killProcess = killProcess;
exports.killCurrentProcess = killCurrentProcess;
exports.stack = processStack;
