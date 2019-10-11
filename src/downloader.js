// 'use strict';

/**
 * A small utility for downloading files.
 */

// Dependencies
const fs = require('fs'),
  request = require('request'),
  progress = require('request-progress'),
  mkdirp = require('mkdirp'),
  path = require('path'),
  logSingleLine = require('single-line-log').stdout,
  debug = require('debug')('openframe:downloader'),
  status = require('http-status'),
  prettyBytes = require('pretty-bytes'),
  humanizeDuration = require('humanize-duration');  

const artworkDir = '/tmp';

let artworkRequest, finished = false
    
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

    mkdirp(artworkDir, function (err) {
        if (err) {
          console.log('Couldn\'t create artwork directory.')
          console.error(err)
        }
    });

    // debug('finished',finished)
    if (artworkRequest && !finished) artworkRequest.abort()
    finished = false 
    artworkRequest = request({ 
      url: file_url,
      headers: {
        'User-Agent': 'request'
      }
    })

    progress(artworkRequest, {
      throttle : 500
    })
    .on('response', function(response) {
      // console.log(response.statusCode)
      // console.log(response.headers['content-type'])
      if (!(/^2/.test('' + response.statusCode))) { // Status Codes other than 2xx
        console.log("The artwork is not available.")
        console.log("Server responded with this status code:", response.statusCode, status[response.statusCode]);
        reject()
      }
    })
    .on('error', function(err) {
      console.log("Error downloading artwork")
      console.error(err)
      reject()
    })
    .on('abort', function() {
      debug("Aborted downloading artwork")
      reject()
    })
    .on('progress', function (state) {
        if (debug.enabled) logSingleLine((state.percent*100).toFixed(2) + '% of ' + prettyBytes(state.size.total)+ ' – ' + humanizeDuration(state.time.remaining * 1000, { round: true }) + ' remaining – ' + (state.speed != null ? prettyBytes(state.speed) : '?') + '/s')
    })
    .pipe(fs.createWriteStream(file_path).on("error", function(err) {
      console.log("Error saving artwork")
      console.log(err)
      reject()
    }))
    .on('finish', function() {
      debug('Artwork downloaded')
      finished = true
            
      return resolve(file_path);
    });
  });
}

exports.downloadFile = downloadFile;
