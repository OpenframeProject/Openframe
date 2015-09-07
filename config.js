'use strict';

/**
 * Configuration module
 */

/**
 * try to detect the device platform (i.e. linux, mac, windows)
 * @return {String} the platform
 */
function getPlatform() {
    console.log(process.platform);

    if (/^linux/.test(process.platform)) {
        return 'linux';
    } else if(/^darwin/.test(process.platform)) {
        return 'mac';
    } else {
        return 'windows';
    }
}

module.exports = (function() {
    var options = {
        api_protocol: 'http',
        api_domain: 'localhost',
        api_port: '8888',
        download_dir: './artwork/',
        platform: getPlatform()
    };

    function option(name, value) {
        if (!name) {
            return undefined;
        }

        if (value !== undefined) {
            options[name] = value;
        }
        return options[name];
    }

    return option;
})();
