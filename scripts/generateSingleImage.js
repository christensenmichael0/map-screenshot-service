const buildBasemap = require('../utilities/buildBasemap');

const generateSingleImage = async layerInfo => {

    const {id, data} = layerInfo;
    let {basemap_thumbnail: basemapUrl, zoom, use_bbox: bbox} = data[0]; // data is an array of objects -- 1 per layer

    let url = 'blah';
    bbox = bbox.split(',').map(coord => Number(coord));


    // TODO parse out info for basemap
    console.log(data);

    try {
        let blah = await buildBasemap(basemapUrl, bbox, zoom);
    } catch (err) {
        console.log('hi');
    }

    // TODO: do necessary cleanup of data before starting the process
    // wrap in promise so we can reject if any error occurs

    // return new Promise((resolve, reject) => {
    //     setTimeout(resolve(id), 5000)
    // })
};


module.exports = generateSingleImage;
