const {ddBBox2Meters} = require('./tile');

/**
 *
 * @param data
 * @return {[]}
 */
const cleanupLayerParams = data => {

    // let removeParams = ['use_bbox', 'basemap_thumbnail', 'basemap_template', 'starttime',
    // 'endtime', 'movieformat', 'eds_key', 'title', 'url', 'duration','zoom', 'map_time'];

    let removeParams = ['title', 'url', 'valid_times'];

    // let general = data['basemap'];
    // let layers = data['overlays'];
    let {basemap, overlays} = data;

    let mapTimes = basemap['map_times'];
    let bbox = basemap['bbox'];

    // TODO: loop through mapTimes so the output is an array of arrays (outer array is each frame, inner array is all
    // data layers in a given frame

    let output = [];
    for (let indx in overlays) {

        let layer = overlays[indx];
        let layerInfo = {};

        layerInfo['title'] = layer['title'];
        // layerInfo['mapTime'] = layer['map_time'];
        layerInfo['mapTime'] = mapTimes[0];
        // layerInfo['validTime'] = layer['time'];
        layerInfo['validTime'] = layer['valid_times'][0];
        layerInfo['url'] = layer['url'];

        // assume we are using only EPSG:3857 (may need to augment functionality in the future)
        // let bbox = layer['use_bbox'].split(',').map(coord => Number(coord));
        layer['bbox'] = ddBBox2Meters([bbox[0], bbox[2], bbox[1], bbox[3]]).join(',');

        removeParams.forEach(remove => {
            if (layer.hasOwnProperty(remove)) delete layer[remove];
        });

        // if (layer.hasOwnProperty('transparent')) {
        //     layer['transparent'] = layer['transparent'].toLowerCase() === "true" ? true : false;
        // }

        // TODO: remove elevation if its an empty string

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
