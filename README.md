## Openframe Frame Controller
This repo is a POC for a node-based frame controller application.

The Frame Controller creates a socket connection with the API server, and is responsible for managing processes required by artworks.

#### Design Notes:
- `frame` - command-line script which starts the frame software
- `controller.js` - manages the actions around controlling the frame (changing artwork, updating settings, etc.)
- `process-manager.js` - manages starting and stopping processes for displaying artworks
- `pubsub.js` - module used for application-wide communication
- `sockets.js` - module setps up and provides the websocket connection to the server
- `downloader.js` - utility for downloading files
- `conf.js` - default configuration options
-  `extensions.js` - loads plugins found in the plugins folder


#### TODO:
- Auto-updating code. (e.g. https://github.com/grapeot/learn-expressjs/blob/master/bootstrap.js)
- Manage plugins via API.
- GPIO integration (https://github.com/JamesBarwell/rpi-gpio.js)
- Example plugin which uses GPIO