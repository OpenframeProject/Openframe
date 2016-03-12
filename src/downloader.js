'use strict';

/**
 * A small utility for downloading files.
 */

// Dependencies
var fs = require('fs'),
    exec = require('child_process').exec,
    debug = require('debug')('openframe:downloader'),
    url = require('url'),
    artworkDir = '/tmp',
    request = require('request');

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
 * TODO: use Promises instead of a callback.
 *
 * @param  {String}   file_url
 * @param  {String}   file_output_name
 */
function downloadFile(file_url, file_output_name, cb) {
    return new Promise(function(resolve, reject) {
        var file_name = file_output_name,
            file_path = artworkDir + '/' + file_name,
            file = fs.createWriteStream(file_path);

        request.get(file_url)
            .on('response', function(res) {
                // create file write stream
                res.pipe(file);

                res.on('end', function() {
                    // go on with processing
                    file.close(function() {
                        if (cb) cb();
                        resolve(file);
                    });
                });

                res.on('error', (e) => {
                    debug(`Got error: ${e.message}`);
                    reject(e);
                });
            }).on('error', (e) => {
                debug(`Got error: ${e.message}`);
                reject(e);
            });

        // http.get(file_url, function(res) {
        //     res.pipe(file);
        //     file.on('finish', function() {
        //         file.close(function() {
        //             if (cb) cb();
        //             resolve(file);
        //         }); // close() is async, call cb after close completes.
        //     });
        //     res.on('error', (e) => {
        //         debug(`Got error: ${e.message}`);
        //         reject(e);
        //     });
        // }).on('error', (e) => {
        //     debug(`Got error: ${e.message}`);
        //     reject(e);
        // });
    });

}

exports.downloadFile = downloadFile;
