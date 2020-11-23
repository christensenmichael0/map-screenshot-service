const buildBasemap = require('../utilities/buildBasemap');
const buildLayers = require('../utilities/buildLayers');
const {cleanupLayerParams} = require('../utilities/layer');
const {composeImage} = require('../utilities/image');

const generateSingleImage = async layerInfo => {

    const {id, data} = layerInfo;
    let {basemap_thumbnail: basemapUrl, zoom, use_bbox: bbox} = data[0]; // data is an array of objects -- 1 per layer

    let url = 'blah';
    bbox = bbox.split(',').map(coord => Number(coord));


    // TODO parse out info for basemap
    console.log(data);

    let basemapImage;
    try {
        basemapImage = await buildBasemap(basemapUrl, bbox, zoom);
    } catch (err) {
        console.log(err);
    }

    //  cleanup query parameters
    // transparency...
    let layerArr = cleanupLayerParams(data);

    let dataImage;
    try {
        dataImage = buildLayers(layerArr);
    } catch (err) {
        console.log(err);
    }

    // composed imaged
    let composedImage;
    try {
        // TODO: these inputs need to be JIMP images i think
        composedImage = await composeImage([dataImage, basemapImage])
    } catch (err) {
        console.log(err);
    }

    await composedImage.writeAsync(`output/${Date.now()}_test.png`);
    console.log('here');



    // TODO: generate an image for each layer

    // TODO: overlay images onto basemap

    // wrap in promise so we can reject if any error occurs

    // return new Promise((resolve, reject) => {
    //     setTimeout(resolve(id), 5000)
    // })
};


module.exports = generateSingleImage;
