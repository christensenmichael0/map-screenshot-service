const axios = require('axios');
const async = require('async');
const Jimp = require('jimp');

const mockImgUrl = 'https://coastmap.com/ecop/wms.aspx?service=WMS&request=GetMap&version=1.1.1&layers=WW3_WAVE_HEIGHT&styles=WAVE_HEIGHT_STYLE-Jet-0-8&format=image%2Fpng&transparent=true&colorscalerange=0%2C8&autoscalerange=false&time=2020-11-05T12%3A00%3A00Z&exceptions=application%2Fvnd.ogc.se_xml&width=1119&height=765&srs=EPSG%3A3857&bbox=-9403846.942725986%2C3716846.046652051%2C-6666789.833890395%2C5588024.4990731655&ABOVEMAXCOLOR=extend&BELOWMINCOLOR=extend';


const getImage = async (url, index, fallbackDimensions = null, callback) => {
    try {
        let resp = await axios.get(url,{responseType: 'arraybuffer'});
        // if (!/image/i.test(resp.headers['content-type'])) throw 'image not returned';

        callback(null, {index, buff: Buffer.from(resp.data, 'binary')})
    } catch (err) {
        let imageBuffer;

        if (fallbackDimensions) {
            try {
                imageBuffer = await createEmptyImage(...fallbackDimensions);
            } catch(e) {
                console.log(e)
            }
        }

        callback(err, {index, buff: imageBuffer});
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

        // // add some items to the queue (batch-wise)
        // q.push([{name: 'baz'},{name: 'bay'},{name: 'bax'}], function(err) {
        //     console.log('finished processing item');
        // });

        for (let i = 0; i < urls.length; i++) {

            let task = {
                name: `fetching image: ${urls[i]}`,
                action: getImage,
                fallbackDimensions,
                url: urls[i],
                index: i
            };

            q.push(task, function (err, data) {
                if (err) {
                    console.log('An error occurred during the image fetch');
                    // still add the blank image
                    if (data) layerImages[data['index']] = data['buff']
                }

                layerImages[data['index']] = data['buff']
            })
        }
    });
};


const createEmptyImage = async (width, height) => {
    let image = null, buffer = null;

    try {
        image = await new Jimp(width, height, 0x0);
    } catch (err) {
        console.log(err);
        throw err;
    }

    try {
        buffer = await image.getBufferAsync(image.getMIME());
    } catch (err) {
        console.log(err);
        throw err;
    }

    return buffer;
};

const stitchImage = async (subImages, gridSize, tileSize = 256) => {

    let containerBuffer = null;
    try {
        containerBuffer = await createEmptyImage(tileSize * gridSize[1], tileSize * gridSize[0]);
    } catch (err) {
        throw err;
    }

    let baseImage = null;
    try  {
        baseImage = await Jimp.read(containerBuffer);
    } catch (err) {
        throw err;
    }

    // stitching occurs from left -> right and top -> bottom
    // TODO: do a check that the baseimage is the right size and throw an error if not
    let counter = 0;
    for (let rowIndx = 0; rowIndx < gridSize[0]; rowIndx++) {
        for (let colIndx = 0; colIndx < gridSize[1]; colIndx++) {
            baseImage.composite(subImages[counter], colIndx * 256, rowIndx * 256);
            counter++;
        }
    }

    // let image = await Jimp.read(tiles[counter]);
    // await baseImage.writeAsync(`output/${Date.now()}_test.png`);
    return baseImage;
};

// need to know lat/lng of upper left corner and lower right corner of the tiles
// turn both into pixels

// find the difference in pixels in x direction and y direction to get x and y
// get pixel
const cropImage = async  (image, bboxInfo) => {

    // bbox info contains both outer bbox and inner bbox as key/val pairs
    // image.crop( x, y, w, h )
};

// image.composite( src, x, y );

module.exports = {
    getImage,
    getImageSeries,
    createEmptyImage,
    stitchImage
};
