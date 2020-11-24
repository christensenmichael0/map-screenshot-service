const Jimp = require('jimp');
const {buildLayerUrl} = require('./layer');
const {composeImage, getImageSeries} = require('./image');


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

const buildLayers = async layerArr => {

    // fetch each tile, stitch, then crop and return image as binary blob
    let imageUrls = [];
    for (let i = 0; i < layerArr.length; i++) {
        let {url, queryParams} = layerArr[i];
        let imageUrl = buildLayerUrl(url, queryParams);

        imageUrls.push(imageUrl);
    }

    // TODO: add some error handling if these params arent available
    let fallbackDims = [layerArr[0]['queryParams']['width'],
        layerArr[0]['queryParams']['height']];

    let layerImages;
    try {
        layerImages = await getImageSeries(imageUrls, fallbackDims);
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
