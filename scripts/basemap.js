const Jimp = require('jimp');
const {createEmptyImage, stitchImage} = require('../utilities/image');

const buildBasemap = async (tiles, gridSize, tileSize = 256) => {

    let counter = 0;
    let imageTiles = [];
    for (let rowIndx = 0; rowIndx < gridSize[0]; rowIndx++) {
        for (let colIndx = 0; colIndx < gridSize[1]; colIndx++) {
            let image = Jimp.read(tiles[counter]);
            imageTiles.push(image);
            counter++;
        }
    }

    // wait for all images to be read
    let subImages = null;
    try {
        subImages = await Promise.all(imageTiles);
    } catch (err) {
        throw err;
    }

    // let stitchedImage = await stitchImage(baseImage, subImages, gridSize);
    let stitchedImage = await stitchImage(subImages, gridSize, tileSize);
    console.log('now stitch');

    // now trim

};

// LL to UR
// [minX, minY, maxX, maxY] = [minLon, minLat, maxLon, maxLat]

// var zoom = 3;
// // var llCoord = [96.65977478027344, 43.04179445290156];
// // var lrCoord = [293.3589935302735, -65.01360601658364];
// var llCoord = [96.65977478027344, -65.01360601658364]; // minX, minY
// var urCoord = [293.3589935302735, 43.04179445290156]; // maxX, maxY

// var llTile = globalMercator.pointToTile(llCoord, zoom); // [6,5,3]
// var urTile = globalMercator.pointToTile(urCoord, zoom); // [ 2, 2, 3 ]

// get absolute difference between and use globalMercator.wrapTile (only for x - direction)

// globalMercator.wrapTile([0, 3, 2])

module.exports = {
    buildBasemap
};

