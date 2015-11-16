## Openframe Frame Controller
This repo is a POC for a node-based frame controller application.

The Frame Controller creates a socket connection with the API server, and is responsible for managing processes required by artworks.

#### Design Notes:
- `frame` - command-line script which starts the frame software
- `controller.js` - manages the actions around controlling the frame (changing artwork, updating settings, etc.)
- `process-manager.js` - manages starting and stopping processes for displaying artworks
- `pubsub.js` - module used for application-wide communication
- `sockets.js` - module sets up and provides the websocket connection to the server
- `downloader.js` - utility for downloading files
- `conf.js` - default configuration options
-  `extensions.js` - loads plugins found in the plugins folder


#### TODO:
- Auto-updating code. (e.g. https://github.com/grapeot/learn-expressjs/blob/master/bootstrap.js)
- GPIO integration (https://github.com/JamesBarwell/rpi-gpio.js)
  - access to raw GPIO data via pubsub?
  - convert GPIO input to osc?
- Manage plugins via API.
- Example plugin which uses GPIO

### Usage
```
$ ./frame [options]
```

#### Options
-h, --help                       output usage information
-V, --version                    output the version number
-u, --username <username>        Username to which this frame will be linked.
-f, --framename <framename>      Name for the frame.
-d, --apidomain <apidomain>      The domain at which the Openframe API is accessible. Defaults to localhost.
-p, --apiport <apiport>          The port at which the Openframe API is accessible. Defaults to 8888.
-P, --apiprotocol <apiprotocol>  The domain at which the Openframe API is accessible. Defaults to localhost.
-i --installplugins              Install (or re-install) plugins at startup.


### Example:
```
$ ./frame -u thomas_marx -d api.openframe.io -p 80 -P https
```

### Plugins

#### Plugin Installation

Plugins are managed as dependencies through NPM. The .ofrc file, in the app root dir, contains a JSON configuration object which has a property called `plugins`. This property is an object of the same form as the NPM package.json's `dependencies` property:

```json
{
    "plugins": {
        "openframe-gpio": "~0.1.0"
    }
}
```

Upon starting up the frame, the Plugins module will iterate through the `plugins` property in .ofrc, check whether each plugin has been installed, and if not go ahead and add it to package.json as a dependency and install it.

Once all plugins are installed, they are each individually initialized by calling their exported function, passing in a reference to the frame's socket connection and event system.

#### Writing Plugins

Plugins must be modules that export a function which takes two arguments, `socket` and `pubsub`, references to the socket connection and application pubsub modules, respectively.

See the `keystrokes.js` plugin as an example:

```javascript
// keystrokes.js
module.exports = function(socket, pubsub) {
    console.log('loading keystrokes plugin');
    // bind to or emit additional socket / pubsub events here,
    // and do with them what you please.


    // here we're setting up the stdin to read in keystrokes
    var stdin = process.stdin;
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');

    // on any data into stdin
    stdin.on('data', function(key) {
        // ensure we can still exit (ctrl-c)
        if (key === '\u0003') {
            process.exit();
        }
        // write the key to stdout just because
        process.stdout.write(key + '\n');

        // let's emit a plugin-defined event which could be handled elsewhere
        // in this plugin, or by other plugins.
        pubsub.emit('plugin:keystrokes:keypress', key);

        // if 'r' is pressed, emit the built-in artwork:random event
        // over the socket connection
        if (key === 'r') {
            socket.emit('artwork:random');
        }
    });
};
```
