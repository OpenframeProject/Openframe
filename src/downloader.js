// 'use strict';

/**
 * A small utility for downloading files.
 */

// Dependencies
const { exec, spawn } = require('child_process');

var debug = require('debug')('openframe:downloader'),
    artworkDir = '/tmp';

// unused at present
function _mkdirp(dir) {
    var mkdir = 'mkdir -p ' + dir;
    exec(mkdir, function(err) {
        if (err) {
            throw err;
        }
    });
}

/**
 * Download a file using HTTP get.
 *
 * @param  {String}   file_url
 * @param  {String}   file_output_name
 */
function downloadFile(file_url, file_output_name) {
    debug('downloading %s', file_url);
    return new Promise(function(resolve, reject) {
        var file_name = file_output_name,
            file_path = artworkDir + '/' + file_name;

        const curl = spawn('curl', ['-L', '-o', file_path, file_url]);

        curl.stdout.on('data', (data) => {
            debug(`stdout: ${data}`);
        });

        curl.stderr.on('data', (data) => {
            debug(`stderr: ${data}`);
        });

        curl.on('close', (code) => {
            debug(`child process exited with code ${code}`);
            if (code !== 0) {
                reject('Download failed');
            } else {
                resolve(file_path);
            }
        });
    });

}

exports.downloadFile = downloadFile;
