const buildLegend = require('./buildLegend');
const {EXPIRE} = require('../config');

const cache = {};

/**
 * Batching and caching with Promises. Reuse legend when possible for a given job.
 *
 * @param legendUrls
 * @param jobId
 * @return {Promise<*>}
 */
const buildLegendCache = async (legendUrls, jobId) => {
    if (cache[jobId]) return cache[jobId];

    try {
        cache[jobId] = await buildLegend(legendUrls);
        setTimeout(() => {delete cache[jobId]}, EXPIRE * 1000);
    } catch (err) {
        delete cache[jobId];
        throw err;
    }

    return cache[jobId]
};

module.exports = buildLegendCache;
