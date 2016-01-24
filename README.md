# Openframe Frame Controller

The Openframe Frame Controller application (POC).

> Note: This repo is under development and is not ready for use.

### Design Notes

This prototype of the FrameController is written in Node.js, and acts as a process manager for starting, stopping, and transitioning between artworks. It communicates with the [Openframe-API](https://github.com/OpenframeProject/Openframe-API) server via a REST Api, and connects to the [global event system](https://github.com/OpenframeProject/Openframe-PubSubServer) allowing for realtime updates. The idea is to work towards a system which supports the basic goals of Openframe, guided by a handful of [pilot use cases](https://github.com/OpenframeProject/Openframe-API/wiki/Pilot-Use-Cases).

The block diagram below represents a proposed architecture for the Openframe platform. It will continue to evolve as development on the project progresses.

![alt tag](https://raw.github.com/OpenframeProject/Openframe-API/master/docs/img/API Diagram.jpg)

#### Modules

* `index.js` - node script which starts the frame software
* `controller.js` - manages the actions around controlling the frame (changing artwork, updating settings, etc.)
* `process-manager.js` - manages starting and stopping processes for displaying artworks
* `plugin-manager.js` - manages installing and initializing plugins
* `frame.js` - a wrapper for the Frame model
* `pubsub.js` - creates and manages connection to global event system
* `downloader.js` - utility for downloading files
* `config.js` - configuration options


### Usage
```
$ npm start
```

### Plugins

Plugins are npm packages which add functionality to the frame, either by adding support for a new artwork format (i.e. media type) or by adding other functionality.

For more info on plugins, see the [Openframe-PluginExample](https://github.com/OpenframeProject/Openframe-PluginExample) repo.

### TODOs / Considerations / Questions

* Make sure plugins aren't re-installed if they already have been
* Auto-updating code? (e.g. https://github.com/grapeot/learn-expressjs/blob/master/bootstrap.js)
* Other code deployment approach? (e.g. chef, puppet, docker?)
* Manage plugins via API... this is sort of there, as Frames and Artworks both have a `plugins` property.
* How do artworks interact with plugins?
* Are plugins able to publish their own events? Should we define a namespace structure? Channels?
