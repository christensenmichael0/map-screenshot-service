const queryString = require('query-string');
const {ddBBox2Meters} = require('./tile');

/**
 *
 * @param layers
 * @param mapTime
 * @return {*}
 */
const addMapTimeProp = (layers, mapTime) => {
    return layers.map(layer => {
        layer['mapTime'] = mapTime;
        return layer;
    });
};

const buildLayerLabel = attributes => {

    let outputStr = '';
    for (let attr of attributes) {
        if (attr['showKey']) {
            outputStr = outputStr += `${attr['key']}: ${attr['value']} `;
        }
    }

    return outputStr.trim();
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

    let removeParams = ['width', 'height', 'time', 'bbox'];

    removeParams.forEach(remove => {
        if (qp.hasOwnProperty(remove)) delete qp[remove];
    });

    qp['request'] = 'GetLegendGraphic';

    let qs = Object.keys(qp).map(key => `${key}=${qp[key]}`).join('&');
    return `${url}?${qs}`;
};


/**
 *
 * @param url
 * @param params
 * @return {{}}
 */
const getQueryParams = (url, params = []) => {
    let qp = queryString.parse(url);
    let output = {};

    for (let param of params) {
        output[param] = qp[param];
    }

    return output;
};



module.exports = {
    buildLayerUrl,
    buildLegendUrl,
    getQueryParams,
    addMapTimeProp,
    buildLayerLabel
};
