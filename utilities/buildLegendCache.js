const buildLegend = require('./buildLegend');
const {EXPIRE} = require('../config');

const cache = {};

/**
 * Batching and caching with Promises. Reuse legend when possible for a given job.
 *
 * @param layerArr
 * @param jobId
 * @return {Promise<*>}
 */
const buildLegendCache = async (layerArr, jobId) => {
    if (cache[jobId]) return cache[jobId];

    try {
        cache[jobId] = await buildLegend(layerArr);
        setTimeout(() => {delete cache[jobId]}, EXPIRE * 1000);
    } catch (err) {
        delete cache[jobId];
        throw err;
    }

    return cache[jobId]
};

module.exports = buildLegendCache;
