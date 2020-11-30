const async = require('async');
const axios = require('axios');

// https://stackoverflow.com/questions/61690101/node-js-ffmpeg-creating-a-mp4-video-from-2-or-more-jpg-images

// TODO: the below func should call generateBaseMap and generateLayerOverlays... so extract some logic from it
// maybe wait for basemap and legend to be fetched and built before moving forward

async function generateAnimation (layers, dateTimeRange, dimensions, outputFormat) {
    // for each layer need to determine the available times between start/end by looking at getCaps

    // TODO: function -- assembleLayerData
    // assemble packet of information needed to generate an individual image file
    // this includes an array of datetimes and the other properties

    //{layerParams: {...}, dateTimes: [...]}
}

module.exports = generateAnimation;
