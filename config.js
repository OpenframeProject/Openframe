'use strict';

/**
 * Configuration object.
 */

module.exports = (function() {
    var options = {
        api_protocol: 'http',
        api_domain: 'localhost',
        api_port: '8888',
        download_dir: './artwork/'
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
