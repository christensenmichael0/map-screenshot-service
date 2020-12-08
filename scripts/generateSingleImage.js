const buildBasemapCache = require('../utilities/buildBasemapCache');
const buildLegendCache = require('../utilities/buildLegendCache');
const buildLayers = require('../utilities/buildLayers');
const {buildLayerUrl, addMapTimeProp} = require('../utilities/layer');
const {assembleImageComponents, composeImage,
    resizeImage} = require('../utilities/image');
const {MAX_IMAGE_HEIGHT} = require('../config');

const generateSingleImage = async payload => {

    const {id, data} = payload;
    let {url, zoom, bbox, params, map_time: mapTime} = data['basemap'];
    let basemapUrl = buildLayerUrl(url, params);

    let layers = data['overlays'];

    // create basemap
    let basemapImage;
    try {
        basemapImage = await buildBasemapCache(basemapUrl, bbox, zoom, id);
    } catch (err) {
        console.log(err);
        throw err;
    }

    //  cleanup query parameters
    // let layerArr = cleanupLayerParams(data);
    layers = addMapTimeProp(layers, mapTime);

    // assemble all legends
    let legendImage;
    try {
        let legendUrls = layers.map(layer => layer['legend']);
        legendImage = await buildLegendCache(legendUrls);
    } catch (err) {
        console.log(err);
        throw err;
    }

    // assemble all data layers
    let dataImage;
    try {
        let layerUrls = layers.map(layer => layer['url']);
        dataImage = await buildLayers(layerUrls);
    } catch (err) {
        console.log(err);
        throw err;
    }

    // overlay data layers onto basemap
    let composedImage;
    try {
        composedImage = await composeImage([dataImage, basemapImage.clone()])
    } catch (err) {
        console.log(err);
        throw err;
    }

    // resize the image if necessary
    let resizedImage = composedImage;
    try {
        if (composedImage.getHeight() > MAX_IMAGE_HEIGHT) {
            resizedImage = await resizeImage(composedImage.clone(), null, MAX_IMAGE_HEIGHT);
        }
    } catch (err) {
        resizedImage = composedImage;
        console.log(err);
    }

    // add headers and legends
    let outputImage;
    try {
        outputImage = await assembleImageComponents(layers, resizedImage, legendImage);
    } catch (err) {
        console.log(err);
        throw err;
    }

    let mimeType = outputImage.getMIME();

    // get image buffer
    let buffer;
    try {
        buffer = await outputImage.getBufferAsync(mimeType);
    } catch (err) {
        console.log(err);
        throw err;
    }

    return {key: `${id}.${mimeType.split('/')[1]}`, data: buffer}
};


module.exports = generateSingleImage;
