const {buildLayerUrl} = require('./layer');
const {composeImage, getImageSeries} = require('./image');
const {getQueryParams} = require('./layer');


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

const buildLayers = async layerUrls => {

    let {width, height} = getQueryParams(layerUrls[0],['width', 'height']);
    let fallbackDims = [width, height];

    let layerImages;
    try {
        layerImages = await getImageSeries(layerUrls, fallbackDims);
    } catch (err) {
        console.log(err);
        throw err;
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
