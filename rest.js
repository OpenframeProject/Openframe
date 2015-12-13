
// app dependencies
var Swagger = require('swagger-client'),
    debug = require('debug')('rest'),
    config = require('./config'),
    // --> EXPORT
    rest = module.exports = {};

rest.client;

rest.init = function() {
    var network = config.ofrc.network,
        api_url = network.api_protocol + '://' + network.api_domain + ':' + network.api_port;

    return new Promise(function(resolve, reject) {
        new Swagger({
            url: api_url + '/explorer/swagger.json',
            usePromise: true
        }).then(function(client) {
            // To see all available methods:
            // debug(client);

            rest.client = client;
            resolve(client);
        }).catch(function(err) {
            reject(err);
        });
    });
};
