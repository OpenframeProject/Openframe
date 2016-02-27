# Openframe Frame Controller

> Note: This repo is under development and is not ready for serious use.

### Design Notes

The Openframe controller acts as a process manager for starting, stopping, and transitioning between artworks. It communicates with an [Openframe API Server](https://github.com/OpenframeProject/Openframe-APIServer) server via a REST API, and connects to a [global event system](https://github.com/OpenframeProject/Openframe-PubSubServer) allowing for realtime updates. The idea is to work towards a system which supports the basic goals of Openframe, guided by a handful of [pilot use cases](https://github.com/OpenframeProject/Openframe-API/wiki/Pilot-Use-Cases).

The block diagram below represents a proposed architecture for the Openframe platform. It will continue to evolve as development on the project progresses.

![alt tag](https://raw.github.com/OpenframeProject/Openframe-APIServer/restify/docs/img/API Diagram.jpg)

#### Modules

* `index.js` - node script which starts the frame software
* `controller.js` - manages the actions around controlling the frame (changing artwork, updating settings, etc.)
* `process-manager.js` - manages starting and stopping processes for displaying artworks
* `plugin-manager.js` - manages installing and initializing plugins
* `frame.js` - a wrapper for the Frame model
* `user.js` - a wrapper for the User model
* `pubsub.js` - creates and manages connection to global event system
* `downloader.js` - utility for downloading files
* `config.js` - configuration options


### Usage

> FYI: Pardon the lack of detail and documentation. We'll be updating frequently over the coming weeks / months!

If you're just trying to get a frame up and running on a Raspberry Pi, please hold tight :). We'll be updating the install instructions soon!

If you're interested in hacking on Openframe, feel free to fork/clone this repo. Run `npm install` to install the deps, then start up the openframe software:

```
$ npm start
```

### Plugins

Plugins are npm packages which add functionality to the frame, either by adding support for a new artwork format (i.e. media type) or by adding other functionality.

For more info on plugins, see the [Openframe-PluginExample](https://github.com/OpenframeProject/Openframe-PluginExample) repo.

### TODOs / Considerations / Questions

* Auto-updating code? (e.g. https://github.com/grapeot/learn-expressjs/blob/master/bootstrap.js)
* Manage plugins via API... this is sort of there, as Frames and Artworks both have a `plugins` property.
* More example plugins.
* Should we define a namespace structure for plugin-specific events? Channels?
