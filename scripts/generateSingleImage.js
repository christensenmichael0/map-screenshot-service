const buildBasemap = require('../utilities/buildBasemap');
const buildLayers = require('../utilities/buildLayers');
const {cleanupLayerParams} = require('../utilities/layer');
const {composeImage} = require('../utilities/image');

const generateSingleImage = async layerInfo => {

    const {id, data} = layerInfo;
    let {basemap_thumbnail: basemapUrl, zoom, use_bbox} = data[0]; // data is an array of objects -- 1 per layer

    let bbox = use_bbox.split(',').map(coord => Number(coord));

    let basemapImage;
    try {
        basemapImage = await buildBasemap(basemapUrl, bbox, zoom);
    } catch (err) {
        console.log(err);
    }

    //  cleanup query parameters
    let layerArr = cleanupLayerParams(data);

    // assemble all data layers
    let dataImage;
    try {
        dataImage = await buildLayers(layerArr);
    } catch (err) {
        console.log(err);
    }

    // overlay data layers onto basemap
    let composedImage;
    try {
        composedImage = await composeImage([dataImage, basemapImage])
    } catch (err) {
        console.log(err);
    }

    // TODO: remove.. for testing only
    await composedImage.writeAsync(`output/${Date.now()}_test.png`);
    return composedImage;
};


module.exports = generateSingleImage;
