const {ddBBox2Meters} = require('./tile');

/**
 *
 * @param data
 * @return {[]}
 */
const cleanupLayerParams = data => {

    let removeParams = ['title', 'url', 'valid_time'];

    let {basemap, overlays} = data;
    let mapTime = basemap['map_time'];
    let bbox = basemap['bbox'];

    let output = [];
    for (let indx in overlays) {

        let layer = overlays[indx];
        let layerInfo = {};

        layerInfo['title'] = layer['title'];
        layerInfo['mapTime'] = mapTime;
        layerInfo['validTime'] = layer['valid_time'];
        layerInfo['url'] = layer['url'];

        layer['time'] = layerInfo['validTime'];

        // assume we are using only EPSG:3857 (may need to augment functionality in the future)
        layer['bbox'] = ddBBox2Meters([bbox[0], bbox[2], bbox[1], bbox[3]]).join(',');

        removeParams.forEach(remove => {
            if (layer.hasOwnProperty(remove)) delete layer[remove];
        });

        // remove elevation if its an empty string
        if (layer.hasOwnProperty('elevation') && !layer['elevation']) delete layer['elevation'];

        layerInfo['queryParams'] = layer;
        output.push(layerInfo);
    }

    return output;
};

/**
 *
 * @param url
 * @param queryParams
 * @return {string}
 */
const buildLayerUrl = (url, queryParams) => {
    let qp = JSON.parse(JSON.stringify(queryParams));
    let qs = Object.keys(qp).map(key => `${key}=${qp[key]}`).join('&');
    return `${url}?${qs}`;
};

/**
 *
 * @param url
 * @param queryParams
 * @return {string}
 */
const buildLegendUrl = (url, queryParams) => {
    let qp = JSON.parse(JSON.stringify(queryParams));

    let removeParams = ['width', 'height', 'time'];
    // delete qp['width'];
    // delete qp['height'];
    // delete qp['time'];

    removeParams.forEach(remove => {
        if (qp.hasOwnProperty(remove)) delete qp[remove];
    });

    qp['request'] = 'GetLegendGraphic';

    let qs = Object.keys(qp).map(key => `${key}=${qp[key]}`).join('&');
    return `${url}?${qs}`;
};



module.exports = {
    buildLayerUrl,
    buildLegendUrl,
    cleanupLayerParams
};
