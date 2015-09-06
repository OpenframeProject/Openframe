'use strict';

// app dependencies
var config = require('./conf'),
    downloader = require('./downloader'),
    url = require('url'),
    path = require('path'),
    proc_man = require('./process-manager');

downloader.setDownloadDir(config.download_dir);

function changeArtwork(artwork) {
    console.log(artwork);

    if (artwork.format.download) {
        var parsed = url.parse(artwork.url),
            file_name = path.basename(parsed.pathname);

        downloader.downloadFile(artwork.url, artwork._id + file_name, function(file) {
            console.log('file downloaded: ', file);

            var command = artwork.format.player + ' ' + file.path;
            console.log(command);
            proc_man.killCurrentProcess();
            proc_man.startProcess(command);
        });
    } else {
        var command = artwork.format.player + ' ' + artwork.url;
        console.log(command);
        proc_man.killCurrentProcess();
        proc_man.startProcess(command);
    }
}

exports.changeArtwork = changeArtwork;