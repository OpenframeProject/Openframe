'use strict';

/**
 * A small utility for downloading files.
 */

// Dependencies
var exec = require('child_process').exec,
    debug = require('debug')('openframe:downloader'),
    artworkDir = '/tmp',
    http = require('http-request');

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
function downloadFile(file_url, file_output_name, cb) {
    return new Promise(function(resolve, reject) {
        var file_name = file_output_name,
            file_path = artworkDir + '/' + file_name;

        // simplified download using http-request module
        http.get({
            url: file_url,
            progress: function (current, total) {
                debug('downloaded %d bytes from %d', current, total);
            }
        }, file_path, function (err, res) {
            if (err) {
                reject(err);
                return;
            }
            resolve(res.file);
        });
    });

}

exports.downloadFile = downloadFile;
