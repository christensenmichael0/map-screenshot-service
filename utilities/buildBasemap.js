const Jimp = require('jimp');
const {generateTiles} = require('./tile');
const {getImageSeries, stitchImage} = require('./image');


// "https://www.gebco.net/data_and_products/gebco_web_services/web_map_service/mapserv?"
// "https://www.gebco.net/data_and_products/gebco_web_services/web_map_service/mapserv?&SERVICE=WMS&REQUEST=GetMap&VERSION=1.1.1&LAYERS=GEBCO_LATEST&STYLES=&FORMAT=image%2Fpng&TRANSPARENT=true&HEIGHT=256&WIDTH=256&TYPE=TileLayerWMS&ID=gebco&BBOX=-20037508.342789244,-20037508.342789244,20037508.342789244,20037508.342789244&srs=EPSG:3857

const mockBaseMapUrl = "https://www.gebco.net/data_and_products/gebco_web_services/web_map_service/mapserv?&SERVICE=WMS&REQUEST=GetMap&VERSION=1.1.1&LAYERS=GEBCO_LATEST&STYLES=&FORMAT=image%2Fpng&TRANSPARENT=true&HEIGHT=256&WIDTH=256&TYPE=TileLayerWMS&ID=gebco&BBOX=__box__&srs=EPSG:3857";

// https://www.gebco.net/data_and_products/gebco_web_services/web_map_service/mapserv?&SERVICE=WMS&REQUEST=GetMap&VERSION=1.1.1&LAYERS=GEBCO_LATEST&STYLES=&FORMAT=image%2Fpng&TRANSPARENT=true&HEIGHT=256&WIDTH=256&TYPE=TileLayerWMS&ID=gebco&BBOX=-20037508.342789244,-20037508.342789244,20037508.342789244,20037508.342789244&srs=EPSG:3857

const bbox_replace_str = '__box__';

const getBasemapTemplate = url => {
    let bboxRegex = /(bbox=)([\d.-]+,[\d.-]+,[\d.-]+,[\d.-]+)/i;
    let isBboxMatch = url.match(bboxRegex);

    if (!!isBboxMatch) url = url.replace(isBboxMatch[2],bbox_replace_str);

    return [!!isBboxMatch, url];
};


/**
 *
 * @param tiles
 * @param gridSize
 * @param tileSize
 * @return {Promise<void>}
 */
const assembleBasemap = async (tiles, gridSize, tileSize = 256) => {

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
    // TODO: here

};

const buildBasemap = async (url, bbox, zoom, splitOnTile = true,
                               useXYZ = false, tileSize = 256) => {

    // hard-code for testing
    // url = mockBaseMapUrl;

    // TODO: replace basemap bbox with an identifiable temp/replacment str
    // similar idea for tiles... replace with {{x}},{{y}}

    [splitOnTile, url] = getBasemapTemplate(url);

    // hard-code for testing
    // zoom = 3;
    // bbox = [96.65977478027344, -65.01360601658364, 293.3589935302735, 43.04179445290156];

    let tileArr = generateTiles(bbox, zoom);

    // TODO: find bbox of outer and we already know inner... then pass to assembleBasemap

    // fetch each tile, stitch, then crop and return image as binary blob
    let tileUrls = [];
    for (let rowIndx = 0; rowIndx < tileArr.length; rowIndx++) {
        for (let colIndx = 0; colIndx < tileArr[0].length; colIndx++) {
            let tileUrl;
            if (splitOnTile) {
                tileUrl = url.replace(bbox_replace_str, tileArr[rowIndx][colIndx]['bboxMeter'].join(','));
                tileUrls.push(tileUrl)
            }
        }
    }

    console.log(tileUrls);

    let basemapImageTiles = null;
    try {
        basemapImageTiles = await getImageSeries(tileUrls, [tileSize, tileSize]);
    } catch (err) {
        console.log(err);
    }

    let basemapImage = null;
    try {
        let response = await assembleBasemap(basemapImageTiles,
            [tileArr.length, tileArr[0].length]) // [rows, cols]
    } catch (err) {
        console.log(err);
    }
};


module.exports = buildBasemap;
