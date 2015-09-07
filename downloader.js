'use strict';

/**
 * A small utility for downloading files.
 */

// Dependencies
var fs = require('fs'),
    url = require('url'),
    http = require('http'),
    exec = require('child_process').exec;

var conf = require('./conf');

function _mkdirp(dir) {
    var mkdir = 'mkdir -p ' + dir;
    exec(mkdir, function(err) {
        if (err) {
            throw err;
        }
    });
}

// Function to download file using HTTP.get
function downloadFile(file_url, file_output_name, cb) {
    var options = {
        host: url.parse(file_url).host,
        port: 80,
        path: url.parse(file_url).pathname
    };

    var file_name = file_output_name,
        file_path = conf.download_dir + file_name,
        file = fs.createWriteStream(file_path);

    http.get(options, function(res) {
        res.on('data', function(data) {
            file.write(data);
        }).on('end', function() {
            file.end();
            cb(file);
            console.log(file_name + ' downloaded to ' + conf.download_dir);
        });
    });
}

function setDownloadDir(dir_path) {
    conf.download_dir = dir_path || conf.download_dir;
    _mkdirp(conf.download_dir);
}

exports.setDownloadDir = setDownloadDir;
exports.downloadFile = downloadFile;