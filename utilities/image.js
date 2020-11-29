const axios = require('axios');
const async = require('async');
const Jimp = require('jimp');
const {lngLat2Px, xMaxPixel} = require('./tile');

/**
 *
 * @param url
 * @param index
 * @param fallbackDimensions
 * @param callback
 * @return {Promise<void>}
 */
const getImage = async (url, index, fallbackDimensions = null, callback) => {
    let jimpImage;

    try {
        let resp = await axios.get(url,{responseType: 'arraybuffer'});
        if (!resp.headers['content-type'].match(/image/i)) throw 'image not returned';

        try  {
            jimpImage = await Jimp.read(Buffer.from(resp.data, 'binary'));
        } catch (err) {
            throw err;
        }

        callback(null, {index, img: jimpImage})
    } catch (err) {

        if (fallbackDimensions) {
            try {
                jimpImage = await createEmptyImage(...fallbackDimensions);
            } catch(e) {
                console.log(e)
            }
        }

        // return an empty image and if that fails then trigger the error control flow
        if (jimpImage) {
            callback(null, {index, img: jimpImage});
        } else {
            callback(err);
        }
    }
};

/**
 *
 * @param urls
 * @param fallbackDimensions
 * @return {Promise<unknown>}
 */
const getImageSeries = async (urls, fallbackDimensions) => {

    // preserve all buffered images in object
    return new Promise((resolve, reject) => {
        const layerImages = {};

        // create a queue object with concurrency 2
        let q = async.queue(function(task, callback) {
            const {action, url, fallbackDimensions, index} = task;
            console.log(`task ${task.name}: ${task.index}`);

            // call action and trigger callback on completion
            action(url, index, fallbackDimensions, callback);
        }, 2);

        // assign a callback
        q.drain(function() {
            console.log('all items have been processed');
            resolve(layerImages);
        });

        // assign an error callback
        q.error(function(err, task) {
            console.error('task experienced an error');
            reject(err);
        });

        for (let i = 0; i < urls.length; i++) {

            let task = {
                name: `fetching image: ${urls[i]}`,
                action: getImage,
                fallbackDimensions,
                url: urls[i],
                index: i
            };

            q.push(task, function (err, data) {
                if (!err) {
                    layerImages[data['index']] = data['img']
                }
            })
        }
    });
};

/**
 *
 * @param width
 * @param height
 * @return {Promise<*>}
 */
const createEmptyImage = async (width, height) => {
    let image;

    try {
        image = await new Jimp(width, height, 0x0);
    } catch (err) {
        console.log(err);
        throw err;
    }

    return image
};

/**
 *
 * @param subImages
 * @param gridSize
 * @param tileSize
 * @return {Promise<*>}
 */
const stitchImage = async (subImages, gridSize, tileSize = 256) => {

    let baseImage = null;
    try  {
        baseImage = await createEmptyImage(tileSize * gridSize[1], tileSize * gridSize[0]);
    } catch (err) {
        throw err;
    }

    // stitching occurs from left -> right and top -> bottom
    let counter = 0;
    for (let rowIndx = 0; rowIndx < gridSize[0]; rowIndx++) {
        for (let colIndx = 0; colIndx < gridSize[1]; colIndx++) {
            baseImage.composite(subImages[counter], colIndx * 256, rowIndx * 256);
            counter++;
        }
    }

    return baseImage;
};

/**
 *
 * @param image
 * @param bboxInfo
 * @param zoom
 * @return {Promise<void>}
 */
const cropImage = async  (image, bboxInfo, zoom) => {
    let {innerBbox, outerBbox} = bboxInfo;

    let ulPixelsOuter = lngLat2Px([outerBbox[0], outerBbox[3]], zoom);
    let ulPixelsInner = lngLat2Px([innerBbox[0], innerBbox[3]], zoom);
    let lrPixelsInner = lngLat2Px([innerBbox[2], innerBbox[1]], zoom);

    let xOffset = ulPixelsInner[0] - ulPixelsOuter[0];
    let yOffset = ulPixelsOuter[1] - ulPixelsInner[1];

    let width = parseInt(lrPixelsInner[0] - ulPixelsInner[0]);
    let height = parseInt(ulPixelsInner[1] - lrPixelsInner[1]);

    let crossesIDL = innerBbox[0] - innerBbox[2] > 0 ? true : false;
    if (crossesIDL) width = parseInt(xMaxPixel(zoom)[0] - ulPixelsInner[0] + lrPixelsInner[0]);

    // crop image
    return image.crop(xOffset, yOffset, width, height );
};

/**
 *
 * @param images
 * @return {Promise<*>}
 */
const composeImage = async images => {

    // loop through images in reverse order so first one is put on top
    let baseImage;
    for (let i = images.length - 1; i >= 0; i--) {
        if (!baseImage) {
            baseImage = images[i];
            continue;
        }

        baseImage.composite(images[i], 0, 0);
    }

    return baseImage;
};

/**
 * Stack images vertically with some padding in between them
 *
 * @param images
 * @param padding
 * @return {Promise<*>}
 */
const stackImages = async (images, padding = 10) => {

    let sortedImageKeys = Object.keys(images).map(key =>
        Number(key)).sort((a,b) => a - b);

    let maxWidth = 0, maxHeight = 0, totalHeight = 0;

    for (let i of sortedImageKeys) {
        let imgHeight = images[i].getHeight();
        let imgWidth = images[i].getWidth();

        if (imgHeight > maxHeight) maxHeight = imgHeight;
        if (imgWidth > maxWidth) maxWidth = imgWidth;

        totalHeight += imgHeight;
    }

    // add padding between images
    totalHeight += (Object.keys(images).length - 1) * padding;

    let container = null;
    try  {
        container = await createEmptyImage(maxWidth, maxHeight);
    } catch (err) {
        throw err;
    }

    let xPos = 0, yPos = 0;
    for (let i of sortedImageKeys) {
        let imgHeight = images[i].getHeight();

        // add image
        container.composite(images[i], xPos, yPos);

        // update y-position
        yPos = imgHeight + padding
    }

    return container
};

/**
 *
 * @param image
 * @param width
 * @param height
 * @return {Promise<*>}
 */
const resizeImage = async (image, width, height) => {
    let initWidth = image.getWidth();
    let initHeight = image.getHeight();

    if (!width) width = Jimp.AUTO;
    if (!height) height = Jimp.AUTO;

    if (!initWidth && !initHeight) {
        width = initWidth;
        height = initHeight;
    }

    let resizedImage;
    try {
        resizedImage = await image.resize(width, height);
    } catch (err) {
        throw err;
    }

    return resizedImage;
};

/**
 *
 * @param mapTime
 * @param dataLayers
 * @param baseImage
 * @param legendImage
 * @return {Promise<*>}
 */
const assembleImageComponents = async (mapTime, dataLayers, baseImage, legendImage, frameInfo = null) => {

    const outerMargin = 10;
    const extraPadding = 5;

    const imageWidth = baseImage.getWidth();
    const imageHeight = baseImage.getHeight();

    const legendWidth = legendImage.getWidth();
    const legendHeight = legendImage.getHeight();

    const textHeight = 16;
    const extraHeaderLines = 1;
    const headerHeight  = (dataLayers.length + extraHeaderLines) * textHeight;

    const jimpFont = Jimp.FONT_SANS_16_BLACK;
    const font = await Jimp.loadFont(jimpFont);

    // determine width and height of outer container
    const containerWidth = (outerMargin * 2) + imageWidth + extraPadding +
        legendWidth;

    const containerHeight = (outerMargin * 2) + headerHeight + extraPadding +
        Math.max(imageHeight, legendHeight);

    // create outer container
    let container;
    try {
        container = await createEmptyImage(containerWidth, containerHeight);
        container.background(0xFFFFFFFF)
    } catch (err) {
        throw err;
    }

    // TODO: need padding between text lines
    // TODO: put frame info on its own line

    // add header text
    let frameText = frameInfo ? ` (${frameInfo['val']} of ${frameInfo['total']})` : '';

    container.print(font, outerMargin, 0, `Map Time - ${mapTime}${frameText}`);

    for (let i = 0; i < dataLayers.length; i++) {
        let yPos = outerMargin + (i * textHeight) + extraHeaderLines;
        let layerTitle = `${dataLayers[i]['title']} (valid: ${dataLayers[i]['time']})`;

        if (!layerTitle) continue;

        container.print(font, outerMargin, yPos, layerTitle);
    }

    // add base image
    let baseImageXPos = outerMargin;
    let baseImageYPos = outerMargin + textHeight + extraPadding;
    container.composite(baseImage, baseImageXPos, baseImageYPos);

    // add legend image
    let legendImageXPos = outerMargin + imageWidth + extraPadding;
    let legendImageYPos = baseImageYPos;
    container.composite(legendImage, legendImageXPos, legendImageYPos);

    return container;
};

module.exports = {
    getImage,
    getImageSeries,
    createEmptyImage,
    stitchImage,
    cropImage,
    composeImage,
    assembleImageComponents,
    resizeImage,
    stackImages
};
