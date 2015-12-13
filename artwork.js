'use strict';

var currentArtwork = null;

module.exports = {
    setCurrentArtwork: function(artwork) {
        currentArtwork = artwork;
    },

    getCurrentArtwork: function() {
        return currentArtwork;
    }
};