const async = require('async');
const axios = require('axios');
const {generateTiles} = require('../utilities/tile');
const {getImage, getImageSeries} = require('../utilities/image');
const {buildBasemap} = require('./basemap');

// "https://www.gebco.net/data_and_products/gebco_web_services/web_map_service/mapserv?"
// "https://www.gebco.net/data_and_products/gebco_web_services/web_map_service/mapserv?&SERVICE=WMS&REQUEST=GetMap&VERSION=1.1.1&LAYERS=GEBCO_LATEST&STYLES=&FORMAT=image%2Fpng&TRANSPARENT=true&HEIGHT=256&WIDTH=256&TYPE=TileLayerWMS&ID=gebco&BBOX=-20037508.342789244,-20037508.342789244,20037508.342789244,20037508.342789244&srs=EPSG:3857

const mockImgUrl = 'https://coastmap.com/ecop/wms.aspx?service=WMS&request=GetMap&version=1.1.1&layers=WW3_WAVE_HEIGHT&styles=WAVE_HEIGHT_STYLE-Jet-0-8&format=image%2Fpng&transparent=true&colorscalerange=0%2C8&autoscalerange=false&time=2020-11-05T12%3A00%3A00Z&exceptions=application%2Fvnd.ogc.se_xml&width=1119&height=765&srs=EPSG%3A3857&bbox=-9403846.942725986%2C3716846.046652051%2C-6666789.833890395%2C5588024.4990731655&ABOVEMAXCOLOR=extend&BELOWMINCOLOR=extend';
const mockBaseMapUrl = "https://www.gebco.net/data_and_products/gebco_web_services/web_map_service/mapserv?&SERVICE=WMS&REQUEST=GetMap&VERSION=1.1.1&LAYERS=GEBCO_LATEST&STYLES=&FORMAT=image%2Fpng&TRANSPARENT=true&HEIGHT=256&WIDTH=256&TYPE=TileLayerWMS&ID=gebco&BBOX=__box__&srs=EPSG:3857";



// function getImage(url, index, callback) {
//
//     axios.get(mockImgUrl,{ responseType: 'arraybuffer' }).then(function (response) {
//         callback(null, {index, binary: Buffer.from(response.data, 'binary')})
//     }).catch(function(err) {
//         callback(err);
//     });
// }

async function generateBaseMap(url, bbox, zoom, splitOnTile = true,
                               useXYZ = false, tileSize = 256) {

    // hard-code for testing
    url = mockBaseMapUrl;

    // hard-code for testing
    zoom = 3;
    bbox = [96.65977478027344, -65.01360601658364, 293.3589935302735, 43.04179445290156];

    let tileArr = generateTiles(bbox, zoom);
    // fetch each tile, stitch, then crop and return image as binary blob
    let tileUrls = [];
    for (let rowIndx = 0; rowIndx < tileArr.length; rowIndx++) {
        for (let colIndx = 0; colIndx < tileArr[0].length; colIndx++) {
            let tileUrl;
            if (splitOnTile) {
                tileUrl = url.replace('__box__', tileArr[rowIndx][colIndx]['bboxMeter'].join(','));
                tileUrls.push(tileUrl)
            }
        }
    }

    console.log(tileUrls);

    let basemapImageTiles = null;
    try {
        basemapImageTiles = await getImageSeries(tileUrls, [tileSize, tileSize]);
    } catch (err) {
        console.log(err);
    }

    let basemapImage = null;
    try {
        let response = await buildBasemap(basemapImageTiles,
            [tileArr.length, tileArr[0].length]) // [rows, cols]
    } catch (err) {
        console.log(err);
    }

}

// TODO: should be able to simplify this to call getImageSeries like generateBasemap does above
// you will need a multiple calls to getImageSeries if there is more than 1 layer
function generateLayerOverlays(layers) {

    // preserve all buffered images in object (may need to have an array of objects in the case we have more
    // than one layer

    // layers.map => {}

    // return new Promise((resolve, reject) => {
    //     const layerImages = {};
    //
    //     // create a queue object with concurrency 2
    //     let q = async.queue(function(task, callback) {
    //         const {action, url, index} = task;
    //         console.log(`task ${task.name}: ${task.index}`);
    //
    //         // call action and trigger callback on completion
    //         action(url, index, callback);
    //     }, 2);
    //
    //
    //     // assign a callback
    //     q.drain(function() {
    //         console.log('all items have been processed');
    //         console.log(layerImages);
    //         // TODO: add this point add layers to basemap image and add legend
    //         resolve();
    //     });
    //
    //
    //     // assign an error callback
    //     q.error(function(err, task) {
    //         console.error('task experienced an error');
    //         reject(err);
    //     });
    //
    //
    //     // // add some items to the queue (batch-wise)
    //     // q.push([{name: 'baz'},{name: 'bay'},{name: 'bax'}], function(err) {
    //     //     console.log('finished processing item');
    //     // });
    //
    //     let datetimes = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    //     for (let i = 0; i < datetimes.length; i++) {
    //
    //         q.push({name: 'getImage', action: getImage, url: mockImgUrl, index: i}, function (err, data) {
    //             if (err) console.log('An error occurred during the image fetch');
    //             // console.log(`finished processing getImage:${imgBuff}`);
    //             layerImages[data['index']] = data['binary']
    //         })
    //     }
    // });
}

// TODO: the below func should call generateBaseMap and generateLayerOverlays... so extract some logic from it
// maybe wait for basemap and legend to be fetched and built before moving forward

async function generateAnimation (layers, dateTimeRange, dimensions, outputFormat) {
    // for each layer need to determine the available times between start/end by looking at getCaps

    // TODO: function -- assembleLayerData
    // assemble packet of information needed to generate an individual image file
    // this includes an array of datetimes and the other properties

    //{layerParams: {...}, dateTimes: [...]}



    return new Promise(async (resolve,reject) => {

        // basemap and legend should be cached once they are grabbed the first time
        try {
            let blah = await generateBaseMap();
        } catch (err) {
            console.log('hi');
        }
        // let blah = await generateBaseMap();
        // console.log('hi');


    // limited parallel execution for frame generation

    // this function should return a Promise
    // return new Promise((resolve,reject) => {
    //

    })
}

module.exports = generateAnimation;
