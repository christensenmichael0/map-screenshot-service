const {composeImage, getImageSeries} = require('./image');
const {getQueryParams} = require('./layer');
const buildTileLayer = require('./buildBasemap');


/**
 *
 * @param tiles
 * @param gridSize
 * @param zoom
 * @param bboxInfo
 * @param tileSize
 * @return {Promise<void>}
 */
const assembleLayers = async images => {

    // sort images ascending order
    let sortedImageKeys = Object.keys(images).map(key =>
        Number(key)).sort((a,b) => a - b);

    let imageArr = [];
    for (let i of sortedImageKeys) {
        imageArr.push(images[i]);
    }

    let composedImage;
    try {
        composedImage = await composeImage(imageArr);
    } catch (err) {
        throw err;
    }

    return composedImage;
};

const buildLayers = async (layers, mapAttrs) => {

    let layerUrls = layers.map(layer => layer['url']);

    let {bbox, zoom, width: mapWidth, height: mapHeight} = mapAttrs;

    let {width, height} = getQueryParams(layerUrls[0],['width', 'height']);
    let fallbackDims = [mapWidth || width, mapHeight || height];

    // handle building of tilelayer images first so we can inject them later
    let tileLayers = {};
    for (let i = 0; i < layers.length; i++) {
        let layer = layers[i];
        if (layer['isTileLayer'].toLowerCase() === 'true') {
            tileLayers[i] = await buildTileLayer(layer['url'], bbox, zoom);
        }
    }

    let layerImages;
    try {
        layerImages = await getImageSeries(layerUrls, fallbackDims);
    } catch (err) {
        console.log(err);
        throw err;
    }

    // inject tile layer images into the correct positions (if there are any)
    for (let index of Object.keys(tileLayers)) {
        layerImages[index] = tileLayers[index];
    }

    let dataImage;
    try {
        dataImage = await assembleLayers(layerImages)
    } catch (err) {
        console.log(err);
        throw err;
    }

    return dataImage;
};


module.exports = buildLayers;
