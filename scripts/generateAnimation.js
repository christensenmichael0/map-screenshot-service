const async = require('async');
const fs = require('fs');
const generateSingleImage = require('./generateSingleImage');
const parsePayload = require('../utilities/parsePayload');
const {MAX_FRAME_CONSTRUCTION_CONCURRENCY} = require('../config');

const stream = require('stream');
const ffmpeg = require('fluent-ffmpeg');
const {putObject} = require('../services/aws');
const pify = require('pify');

const generateSingleImageWrapper = async (payload, index, callback) => {

    let image;
    try {
        image = await generateSingleImage(payload);
        callback(null, {index, img: image});
    } catch (err) {
        callback(err);
    }
};

const getAnimationFrames = async payload => {
    const frameTimes = payload['data']['basemap']['map_times'];

    return new Promise((resolve, reject) => {
        const frames = {};

        // create a queue object with concurrency 2
        let q = async.queue(function(task, callback) {
            const {name, action, payload, index} = task;
            console.log(`task ${name}: ${index}`);

            // call action and trigger callback on completion
            action(payload, index, callback);
        }, MAX_FRAME_CONSTRUCTION_CONCURRENCY);

        // assign a callback
        q.drain(function() {
            console.log('all frames have been processed');
            resolve(frames);
        });

        // assign an error callback
        q.error(function(err, task) {
            console.error('task experienced an error');
            reject(err);
        });

        for (let i = 0; i < frameTimes.length; i++) {

            let task = {
                name: `building frame for map time: ${frameTimes[i]}`,
                action: generateSingleImageWrapper,
                payload: parsePayload(i, payload),
                index: i
            };

            q.push(task, function (err, data) {
                if (!err) {
                    frames[data['index']] = data['img']
                }
            })
        }
    });
};

const convertImagesToMovie = async (id, frames, fps = 1, format = 'mp4') => {

    // TODO: need different workflows depending on format

    return new Promise((resolve, reject) => {
        // create a readable stream from all image buffers to feed fluent ffmpeg
        let imagesStream = new stream.PassThrough();

        // sort images ascending order
        let sortedFrames = Object.keys(frames).map(key =>
            Number(key)).sort((a,b) => a - b);

        for (let i of sortedFrames) {
            imagesStream.push(frames[i]);
        }

        // terminate readable stream
        imagesStream.end();

        // build animation from images
        let outputFilePath = `output/${id}.${format}`;

        const command = ffmpeg()
            .input(imagesStream)
            .videoCodec('libx264')
            .fps(fps)
            .outputOptions('-pix_fmt yuv420p')
            .on('error', function(err) {
                console.log(`ffmpeg image to movie failure: ${id} -- ${err.message}`);
                reject(err);
            }).on('end', function() {
                console.log(`ffmpeg image to movie success: ${id}`);
                resolve(outputFilePath)
            }).save(outputFilePath);
    });
};

const generateAnimation = async payload => {
    // layers array has a length equal to the number of layers on the map being animated
    // each layer object must contain a key: map_times which will be an array of times,
    // additionally key: valid_times should be provided and container an array of times equal in length
    // to the aforementioned map_times. Map times are a reflection the the timeslider ticks
    // provided by the application UI. If more than 2 layers are being animated
    // then each of these layers will contain the same value for map_times. The map_time is
    // the frame time so it shouldn't change. The valid_times, however, could change. For any
    // map time an individual layer will have its own valid time. All of this needs to be resolved
    // outside of this service. The job of this service is to assemble WMS data and for future
    // maintainability and adoption it should do ONLY this. Other tasks are outside the scope of this
    // project and should have utilize a separate service.

    const {id} = payload;

    let frames;
    try {
        frames = await getAnimationFrames(payload);
    } catch (err) {
        console.log(`failed to get generate animation frames for job: ${id}`);
        throw err;
    }

    let movieFile;
    try {
        movieFile = await convertImagesToMovie(id, frames, 1, 'mp4');
    } catch (err) {
        console.log(err);
        throw err;
    }


    fs.readFile(movieFile, async function(err, data) {
        try {
            await pify(fs.unlink)(movieFile);
        } catch (err) {
            console.log(`failed to delete local movie file: ${movieFile}`);
        }

        if (err) throw err;

        try {
            await putObject(`${id}.${'mp4'}`, data);
            return data
        } catch (err) {
            console.log('failed to upload to s3');
            throw err;
        }
    });
};

module.exports = generateAnimation;
