# Openframe Frame Controller

The Openframe Frame Controller application (POC).

> Note: This repo is under development and is not ready for use.

### Design Notes

This prototype of the FrameController is written in Node.js, and acts as a process manager for starting, stopping, and transitioning between artworks. It creates a websocket connection with the [Openframe-API](https://github.com/OpenframeProject/Openframe-API), allowing the frame to be controlled remotely. The goal is to work towards a system which supports the basic goals of Openframe, guided by a handful of [pilot use cases](#).

The block diagram below represents a proposed architecture for the Openframe platform. It will continue to evolve as development on the project progresses.

![alt tag](https://raw.github.com/OpenframeProject/Openframe-API/master/docs/img/API Diagram.jpg)

#### Modules

* `frame` - node script which starts the frame software
* `controller.js` - manages the actions around controlling the frame (changing artwork, updating settings, etc.)
* `process-manager.js` - manages starting and stopping processes for displaying artworks
* `pubsub.js` - used for intra-application communication
* `sockets.js` - sets up and provides the websocket connection to the server
* `downloader.js` - utility for downloading files
* `conf.js` - default configuration options
* `plugins.js` - manages installing and initializing plugins


### Usage
```
$ ./frame [options]
```

#### Options
```
-h, --help                       output usage information
-V, --version                    output the version number
-u, --username <username>        Username to which this frame will be linked.
-f, --framename <framename>      Name for the frame.
-d, --apidomain <apidomain>      The domain at which the Openframe API is accessible. Defaults to localhost.
-p, --apiport <apiport>          The port at which the Openframe API is accessible. Defaults to 8888.
-P, --apiprotocol <apiprotocol>  The domain at which the Openframe API is accessible. Defaults to localhost.
-i --installplugins              Install (or re-install) plugins at startup.
```

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
        "openframe-keystoke": "~0.1.0",
        "openframe-gpio": "git+https://git@github.com/jmwohl/Openframe-GPIO.git"
    }
}
```

Upon starting up the frame, the Plugins module will iterate through the `plugins` property in .ofrc, check whether each plugin has been installed, and if not go ahead and add it to package.json as a dependency and install it.

Once all plugins are installed, they are each individually initialized by calling their exported function, passing in a reference to the frame's socket connection and event system.

> Note: In the future, plugins might receive a single reference to a global event bus which unifies the local pubsub and web socket events.

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

### TODOs / Considerations / Questions

* Make sure plugins aren't re-installed if they already have been
* Auto-updating code? (e.g. https://github.com/grapeot/learn-expressjs/blob/master/bootstrap.js)
* Other code deployment approach? (e.g. chef, puppet, docker?)
* Manage plugins via API.
* Example plugins (e.g. GPIO access)
* How do artworks interact with plugins?
* Are plugins able to publish their own events? Should we define a namespace structure? Channels?