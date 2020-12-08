const {stackImages, getImageSeries} = require('./image');

/**
 *
 * @param legendUrls
 * @return {Promise<*>}
 */
const buildLegend = async legendUrls => {

    let legendImages;
    try {
        legendImages = await getImageSeries(legendUrls, [0,0]);
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
