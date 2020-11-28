const {ddBBox2Meters} = require('./tile');

/**
 *
 * @param layers
 * @return {[]}
 */
const cleanupLayerParams = layers => {

    let removeParams = ['use_bbox', 'basemap_thumbnail', 'basemap_template', 'starttime',
    'endtime', 'movieformat', 'eds_key', 'title', 'url', 'duration','zoom'];

    let output = [];
    for (let indx in layers) {

        let layer = layers[indx];
        let layerInfo = {};

        layerInfo['title'] = layer['title'];
        layerInfo['validTime'] = layer['time'];
        layerInfo['url'] = layer['url'];

        // assume we are using only EPSG:3857 (may need to augment functionality in the future)
        let bbox = layer['use_bbox'].split(',').map(coord => Number(coord));
        layer['bbox'] = ddBBox2Meters([bbox[0], bbox[2], bbox[1], bbox[3]]).join(',');

        removeParams.forEach(remove => {
            if (layer.hasOwnProperty(remove)) delete layer[remove];
        });

        if (layer.hasOwnProperty('transparent')) {
            layer['transparent'] = layer['transparent'] === 1 ? true : false;
        }

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

    delete qp['width'];
    delete qp['height'];

    qp['request'] = 'GetLegendGraphic';

    let qs = Object.keys(qp).map(key => `${key}=${qp[key]}`).join('&');
    return `${url}?${qs}`;
};



module.exports = {
    buildLayerUrl,
    buildLegendUrl,
    cleanupLayerParams
};
