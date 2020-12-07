const globalMercator = require('global-mercator');

const METER_MAX = 20037508;

/**
 * Convert decimal degree bbox into meters
 *
 * @param bbox [minLon, minLat, maxLon, maxLat] (decimal degrees)
 * @return {number[]}
 */
function ddBBox2Meters(bbox) {
    let llCoord = globalMercator.lngLatToMeters([bbox[0], bbox[1]]);
    let urCoord = globalMercator.lngLatToMeters([bbox[2], bbox[3]]);

    return [llCoord[0], llCoord[1], urCoord[0], urCoord[1]];
}

/**
 * Constrain bbox to valid range
 *
 * @param bbox
 * @return {*}
 */
function constrainMeterConversion(bbox) {
    return bbox.map(val => {
        let absVal = Math.abs(val);
        let multiplier = val < 0 ? -1 : 1;
        return absVal > METER_MAX ? multiplier * METER_MAX : val;
    });
}

/**
 *
 * @param bbox - [minLon, minLat, maxLon, maxLat]
 * @param zoom = map zoom level
 *
 * return array of arrays with objects (each inner array represents a row)
 */
function generateTiles(bbox, zoom) {

    let llCoord = bbox.slice(0,2);
    let urCoord = bbox.slice(2);

    let llTile = globalMercator.pointToTile(llCoord, zoom); // [6,5,3]
    let urTile = globalMercator.pointToTile(urCoord, zoom);

    let xArr = [], tileX = llTile[0], counter = 0;
    while (tileX !== urTile[0]) {
        xArr.push(tileX);
        counter++;

        [tileX] = globalMercator.wrapTile([llTile[0] + counter, llTile[1], zoom]);
        if (tileX === urTile[0]) xArr.push(tileX);
    }

    let yArr = [], tileY = urTile[1];
    while (tileY < llTile[1]) {
        yArr.push(tileY);
        tileY++;

        if (tileY === llTile[1]) yArr.push(tileY);
    }

    // build left -> right, top -> bottom
    let output = [];
    for (let i = 0; i < yArr.length; i++) {
        let yVal = yArr[i];
        let cols = [];
        for (let j = 0; j < xArr.length; j++) {
            let xVal = xArr[j];

            let tile = globalMercator.googleToTile([xVal, yVal, zoom]);
            let bboxDD = globalMercator.tileToBBox([tile[0], tile[1], zoom]);
            let bboxMeter = constrainMeterConversion(globalMercator.bboxToMeters(bboxDD));

            cols.push({googleTile: [xVal, yVal, zoom], tmsTile: tile, bboxDD, bboxMeter});
        }
        output = output.concat([cols]);
    }

    return output;
}

/**
 * Convert decimal degree coordinate into map pixels
 *
 * @param coordinate - [lng, lat]
 * @param zoom - the map zoom level
 * @return {Pixels}
 */
function lngLat2Px(coordinate, zoom) {
    let meters = globalMercator.lngLatToMeters(coordinate);

    return globalMercator.metersToPixels(meters, zoom);
}

/**
 * Determine the maximum x-direction pixel value at a given zoom level
 *
 * @param zoom
 * @return {Pixels}
 */
function xMaxPixel(zoom) {
    let [x,y,z] = globalMercator.wrapTile([-1, 0, zoom]);
    let tile = globalMercator.googleToTile([x, y, z]);
    let bboxDD = globalMercator.tileToBBox([tile[0], tile[1], z]);

    return lngLat2Px([...bboxDD.slice(2)], zoom)
}


module.exports = {
    ddBBox2Meters,
    generateTiles,
    lngLat2Px,
    xMaxPixel
};
