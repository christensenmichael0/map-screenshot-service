const async = require('async');
const axios = require('axios');

// https://stackoverflow.com/questions/61690101/node-js-ffmpeg-creating-a-mp4-video-from-2-or-more-jpg-images

// TODO: the below func should call generateBaseMap and generateLayerOverlays... so extract some logic from it
// maybe wait for basemap and legend to be fetched and built before moving forward

async function generateAnimation (layers, dateTimeRange, dimensions, outputFormat) {
    // layers array has a length equal to the number of layers on the map being animated
    // each layer object must contain a key: map_times which will be an array of times,
    // additionally key: valid_times should be provided and container an array of times equal in length
    // to the aforementioned map_times. Map times are a reflection the the timeslider ticks
    // provided by the application UI. If more than 2 layers are being animated
    // then each of these layers will contain the same value for map_times. The map_time is
    // the frame time so it shouldn't change. The valid_times, however, could change. For any
    // map time an individual layer will have its own valid time. All of this needs to be resolved
    // outside of this service. The job of this service is to assemble WMS data and for future
    // maintainability and adoption it should do ONLY this. Other tasks are outside the scope of this
    // project and should have utilize a separate service.

    // TODO: function -- assembleLayerData
    // assemble packet of information needed to generate an individual image file
    // this includes an array of datetimes and the other properties

    //{layerParams: {...}, dateTimes: [...]}
}

module.exports = generateAnimation;
