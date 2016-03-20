
// app dependencies
var Swagger = require('swagger-client'),
    debug = require('debug')('openframe:rest'),
    config = require('./config'),
    // --> EXPORT
    rest = module.exports = {};

rest.client;

rest.init = function() {
    var api_url = config.ofrc.network.api_url;

    return new Promise(function(resolve, reject) {
        new Swagger({
            url: api_url + '/explorer/swagger.json',
            usePromise: true
        }).then(function(client) {
            // To see all available methods:
            console.log(client);

            rest.client = client;
            resolve(client);
        }).catch(function(err) {
            console.log('\n');
            console.log('[o]   ERROR: The server is not available.');
            console.log('\n');
            reject(err);
        });
    });
};
