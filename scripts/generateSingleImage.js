const buildBasemapCache = require('../utilities/buildBasemapCache');
const buildLegendCache = require('../utilities/buildLegendCache');
const buildLayers = require('../utilities/buildLayers');
const {cleanupLayerParams} = require('../utilities/layer');
const {assembleImageComponents, composeImage,
    resizeImage} = require('../utilities/image');
const {putObject} = require('../services/aws');
const {MAX_IMAGE_HEIGHT} = require('../config');


const generateSingleImage = async layerInfo => {

    // Note: data is an array of objects -- 1 object per layer
    const {id, data} = layerInfo;
    let {basemap_thumbnail: basemapUrl, zoom, use_bbox} = data[0];

    let bbox = use_bbox.split(',').map(coord => Number(coord));

    // create basemap
    let basemapImage;
    try {
        basemapImage = await buildBasemapCache(basemapUrl, bbox, zoom, id);
    } catch (err) {
        console.log(err);
        throw err;
    }

    //  cleanup query parameters
    let layerArr = cleanupLayerParams(data);

    // assemble all legends
    let legendImage;
    try {
        legendImage = await buildLegendCache(layerArr, id);
    } catch (err) {
        console.log(err);
        throw err;
    }

    // assemble all data layers
    let dataImage;
    try {
        dataImage = await buildLayers(layerArr);
    } catch (err) {
        console.log(err);
        throw err;
    }

    // overlay data layers onto basemap
    let composedImage;
    try {
        composedImage = await composeImage([dataImage, basemapImage])
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
        outputImage = await assembleImageComponents(layerArr, resizedImage, legendImage);
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

    try {
        await putObject(`${id}.${mimeType.split('/')[1]}`, buffer);
    } catch (err) {
        console.log(err);
        throw err;
    }

    return buffer;
};


module.exports = generateSingleImage;
