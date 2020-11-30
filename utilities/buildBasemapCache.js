const buildBasemap = require('./buildBasemap');
const {EXPIRE} = require('../config');

const cache = {};

/**
 * Batching and caching with Promises. Reuse basemap when possible for a given job.
 *
 * @param basemapUrl
 * @param bbox
 * @param zoom
 * @param jobId
 * @return {Promise<*>}
 */
const buildBasemapCache = async (basemapUrl, bbox, zoom, jobId) => {
    if (cache[jobId]) return cache[jobId];

    try {
        cache[jobId] = await buildBasemap(basemapUrl, bbox, zoom);
        setTimeout(() => {delete cache[jobId]}, EXPIRE * 1000);
    } catch (err) {
        delete cache[jobId];
        throw err;
    }

    return cache[jobId]
};

module.exports = buildBasemapCache;
