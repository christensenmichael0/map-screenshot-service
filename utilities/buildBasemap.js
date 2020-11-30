const Jimp = require('jimp');
const {generateTiles} = require('./tile');
const {getImageSeries, stitchImage, cropImage} = require('./image');


// "https://www.gebco.net/data_and_products/gebco_web_services/web_map_service/mapserv?"
// "https://www.gebco.net/data_and_products/gebco_web_services/web_map_service/mapserv?&SERVICE=WMS&REQUEST=GetMap&VERSION=1.1.1&LAYERS=GEBCO_LATEST&STYLES=&FORMAT=image%2Fpng&TRANSPARENT=true&HEIGHT=256&WIDTH=256&TYPE=TileLayerWMS&ID=gebco&BBOX=-20037508.342789244,-20037508.342789244,20037508.342789244,20037508.342789244&srs=EPSG:3857

const mockBaseMapUrl = "https://www.gebco.net/data_and_products/gebco_web_services/web_map_service/mapserv?&SERVICE=WMS&REQUEST=GetMap&VERSION=1.1.1&LAYERS=GEBCO_LATEST&STYLES=&FORMAT=image%2Fpng&TRANSPARENT=true&HEIGHT=256&WIDTH=256&TYPE=TileLayerWMS&ID=gebco&BBOX=__box__&srs=EPSG:3857";

// https://www.gebco.net/data_and_products/gebco_web_services/web_map_service/mapserv?&SERVICE=WMS&REQUEST=GetMap&VERSION=1.1.1&LAYERS=GEBCO_LATEST&STYLES=&FORMAT=image%2Fpng&TRANSPARENT=true&HEIGHT=256&WIDTH=256&TYPE=TileLayerWMS&ID=gebco&BBOX=-20037508.342789244,-20037508.342789244,20037508.342789244,20037508.342789244&srs=EPSG:3857

const BBOX_REPLACE_STR = '__box__';
const TILE_REPLACE_STR = 'z/x/y';

/**
 *
 * @param bbox
 * @return {*}
 */
const usePacificMapStitch = bbox => {
    let updatedBbox = bbox.slice();

    // keep coordinates on the -180 to +180 scale
    if (bbox[0] > 180) updatedBbox[0] -= 360;
    if (bbox[2] > 180) updatedBbox[2] -= 360;

    return updatedBbox;
};

/**
 *
 * @param url
 * @return {(boolean|void|string|*)[]}
 */
const getBasemapTemplate = url => {
    let bboxRegex = /(bbox=)([\d.-]+,[\d.-]+,[\d.-]+,[\d.-]+)/i;
    let tileRegex = /\d+\/\d+\/\d+/i;

    let isBboxMatch = url.match(bboxRegex);
    let isTileMatch = url.match(tileRegex);

    if (!!isBboxMatch) url = url.replace(isBboxMatch[2], BBOX_REPLACE_STR);
    if (!!isTileMatch) url = url.replace(isTileMatch[0], TILE_REPLACE_STR);

    return {splitOnTile: !!isBboxMatch, url};
};

/**
 *
 * @param ulTileBbox
 * @param lrTileBbox
 * @return {[*, *, *, *]}
 */
const getOuterBbox = (ulTileBbox, lrTileBbox) => {
    let field = 'bboxDD';

    let minX = ulTileBbox[field][0];
    let minY = lrTileBbox[field][1];
    let maxX = lrTileBbox[field][2];
    let maxY = ulTileBbox[field][3];

    return [minX, minY, maxX, maxY];
};

/**
 *
 * @param tiles
 * @param gridSize
 * @param zoom
 * @param bboxInfo
 * @param tileSize
 * @return {Promise<void>}
 */
const assembleBasemap = async (tiles, gridSize, zoom, bboxInfo, tileSize = 256) => {
    let counter = 0;
    let imageTiles = [];
    for (let rowIndx = 0; rowIndx < gridSize[0]; rowIndx++) {
        for (let colIndx = 0; colIndx < gridSize[1]; colIndx++) {
            // let image = Jimp.read(tiles[counter]);
            let image = tiles[counter];
            imageTiles.push(image);
            counter++;
        }
    }

    // wait for all images to be read
    // let subImages = null;
    // try {
    //     subImages = await Promise.all(imageTiles);
    // } catch (err) {
    //     throw err;
    // }

    // stitch tiles
    let stitchedImage;
    try {
        // stitchedImage = await stitchImage(subImages, gridSize, tileSize);
        stitchedImage = await stitchImage(imageTiles, gridSize, tileSize);
    } catch (err) {
        throw err;
    }

    // crop image
    let croppedImage;
    try {
        croppedImage = await cropImage(stitchedImage, bboxInfo, zoom)
    } catch (err) {
        throw err;
    }

    return croppedImage;
};

const buildBasemap = async (url, bbox, zoom, splitOnTile = true,
                               useXYZ = false, tileSize = 256) => {

    ({splitOnTile, url} = getBasemapTemplate(url));

    let tileArr = generateTiles(bbox, zoom);

    // assemble bbox information
    let ulTileBbox = tileArr[0][0]; // upper left tile
    let lrTileBbox = tileArr[tileArr.length - 1][tileArr[0].length - 1]; // lower right tile
    let bboxInfo = {innerBbox: usePacificMapStitch(bbox),
        outerBbox: usePacificMapStitch(getOuterBbox(ulTileBbox,lrTileBbox))};

    // fetch each tile, stitch, then crop and return image as binary blob
    let tileUrls = [];
    for (let rowIndx = 0; rowIndx < tileArr.length; rowIndx++) {
        for (let colIndx = 0; colIndx < tileArr[0].length; colIndx++) {
            let tileUrl;
            if (splitOnTile) {
                tileUrl = url.replace(BBOX_REPLACE_STR, tileArr[rowIndx][colIndx]['bboxMeter'].join(','));
                tileUrls.push(tileUrl)
            } else {
                let tileLoc = tileArr[rowIndx][colIndx]['googleTile'].slice().reverse();
                tileUrl = url.replace(TILE_REPLACE_STR, tileLoc.join('/'));
                tileUrls.push(tileUrl)
            }
        }
    }

    let basemapImageTiles = null;
    try {
        basemapImageTiles = await getImageSeries(tileUrls, [tileSize, tileSize]);
    } catch (err) {
        console.log(err);
    }

    let basemapImage = null;
    try {
        basemapImage = await assembleBasemap(basemapImageTiles,
            [tileArr.length, tileArr[0].length], zoom, bboxInfo, tileSize) // [rows, cols]
    } catch (err) {
        console.log(err);
    }

    return basemapImage;
};


module.exports = buildBasemap;
