const {buildLegendUrl} = require('./layer');
const {stackImages, getImageSeries} = require('./image');


const buildLegend = async layerArr => {

    let imageUrls = [];
    for (let i = 0; i < layerArr.length; i++) {
        let {url, queryParams} = layerArr[i];
        let imageUrl = buildLegendUrl(url, queryParams);

        imageUrls.push(imageUrl);
    }

    let legendImages;
    try {
        legendImages = await getImageSeries(imageUrls, [0,0]);
    } catch (err) {
        console.log(err);
        throw err;
    }

    let outputImage;
    try {
        outputImage = await stackImages(legendImages)
    } catch (err) {
        console.log(err);
        throw err;
    }

    return outputImage;
};

module.exports = buildLegend;
