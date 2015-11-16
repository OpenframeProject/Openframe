'use strict';

/**
 * The main controller for the frame.
 */

// app dependencies
var config = require('./config'),
    downloader = require('./downloader'),
    url = require('url'),
    path = require('path'),
    pubsub = require('./pubsub'),
    proc_man = require('./process-manager'),
    aw = require('./artwork'),
    brightness = require('brightness');

downloader.setDownloadDir(config('download_dir'));

/**
 * Display an artwork.
 * @param  {Object} artwork
 */
function changeArtwork(artwork) {
    console.log(artwork);

    var curArt = aw.getCurrentArtwork();

    if (artwork.format.download) {
        var parsed = url.parse(artwork.url),
            file_name = path.basename(parsed.pathname);

        downloader.downloadFile(artwork.url, artwork._id + file_name, function(file) {
            console.log('file downloaded: ', file);
            var command = artwork.format.start_command + ' ' + file.path;
            console.log(command);
            if (curArt) {
                proc_man.exec(curArt.format.end_command, function() {
                    proc_man.startProcess(command);
                    // proc_man.killCurrentProcess();
                    aw.setCurrentArtwork(artwork);
                });
            } else {
                proc_man.startProcess(command);
                // proc_man.killCurrentProcess();
                aw.setCurrentArtwork(artwork);
            }
        });
    } else {
        var command = artwork.format.start_command + ' ' + artwork.url;
        console.log(command);
        if (curArt) {
            proc_man.exec(curArt.format.end_command, function() {
                proc_man.startProcess(command);
                // proc_man.killCurrentProcess();
                aw.setCurrentArtwork(artwork);
            });
        } else {
            proc_man.startProcess(command);
            // proc_man.killCurrentProcess();
            aw.setCurrentArtwork(artwork);
        }
    }
}

/**
 * Turn on the frame display.
 */
function displayOn() {
    switch (config.option('platform')) {
        case 'mac':
            break;
        case 'windows':
            break;
        default:
            // linux

    }
}

/**
 * Turn off the frame display.
 * @return {[type]} [description]
 */
function displayOff() {
    switch (config.option('platform')) {
        case 'mac':
            break;
        case 'windows':
            break;
        default:
            // linux
    }
}

/**
 * Set the frame brightness.
 * @param {Number} val Brightness value between 0 and 1
 */
function setBrightness(val) {
    brightness.set(val, function() {
        console.log('brightness set to: ', val);
    });
}

/**
 * Set the frame display rotation.
 * @param  {Number} val Rotation value in degrees: 0, 90, 180, or 270
 */
function rotateDisplay(val) {
    // TODO
}


// wire up default pubsub 'command' events
pubsub.on('command:artwork:update', changeArtwork);
pubsub.on('command:display:rotate', rotateDisplay);
pubsub.on('command:display:brightness', setBrightness);
pubsub.on('command:display:on', displayOn);
pubsub.on('command:display:off', displayOff);


module.exports = {
    changeArtwork: changeArtwork,
    displayOn: displayOn,
    displayOff: displayOff,
    setBrightness: setBrightness
};