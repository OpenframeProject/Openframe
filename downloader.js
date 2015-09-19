'use strict';

/**
 * A small utility for downloading files.
 */

// Dependencies
var fs = require('fs'),
    url = require('url'),
    http = require('http'),
    exec = require('child_process').exec;

var config = require('./config');

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
 * @param  {String}   file_url
 * @param  {String}   file_output_name
 * @param  {Function} cb
 */
function downloadFile(file_url, file_output_name, cb) {
    var options = {
        host: url.parse(file_url).host,
        port: 80,
        path: url.parse(file_url).pathname
    };

    var file_name = file_output_name,
        file_path = config('download_dir') + file_name,
        file = fs.createWriteStream(file_path);

    http.get(options, function(res) {
        res.on('data', function(data) {
            file.write(data);
        }).on('end', function() {
            file.end();
            cb(file);
            console.log(file_name + ' downloaded to ' + config('download_dir'));
        });
    });
}

/**
 * Set the download directory.
 * @param {String} dir_path
 */
function setDownloadDir(dir_path) {
    config('download_dir', dir_path || config('download_dir'));
    _mkdirp(config('download_dir'));
}

exports.setDownloadDir = setDownloadDir;
exports.downloadFile = downloadFile;