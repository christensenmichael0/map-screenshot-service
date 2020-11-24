const axios = require('axios');
const async = require('async');
const Jimp = require('jimp');
const {lngLat2Px, xMaxPixel} = require('./tile');


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


module.exports = {
    getImage,
    getImageSeries,
    createEmptyImage,
    stitchImage,
    cropImage,
    composeImage
};
