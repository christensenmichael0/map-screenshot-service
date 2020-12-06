const async = require('async');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const stream = require('stream');
const generateSingleImage = require('./generateSingleImage');
const parsePayload = require('../utilities/parsePayload');
const {putObject} = require('../services/aws');
const pify = require('pify');
const {MAX_FRAME_CONSTRUCTION_CONCURRENCY} = require('../config');

const generateSingleImageWrapper = async (payload, index, callback) => {

    let key, data;
    try {
        ({key, data} = await generateSingleImage(payload));
        callback(null, {index, img: data});
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
                console.log(`ffmpeg successfully converted images to movie: ${id}`);
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

    const {id, data: _data} = payload;
    const {format, fps} = _data['general'];

    // get all image frames
    let frames;
    try {
        frames = await getAnimationFrames(payload);
    } catch (err) {
        console.log(`failed to get generate animation frames for job: ${id}`);
        throw err;
    }

    // convert image frames into a movie with specified format
    let movieFile;
    try {
        movieFile = await convertImagesToMovie(id, frames, fps, format);
    } catch (err) {
        console.log(err);
        throw err;
    }

    // read the movie file into memory
    let data, readError = false;
    try {
        data = await pify(fs.readFile)(movieFile);
    } catch (err) {
        readError = true;
    }

    // always delete the local movie file
    try {
        await pify(fs.unlink)(movieFile);
    } catch (err) {
        console.log(`failed to delete local movie file: ${movieFile}`);
    }

    // throw error if the file couldn't be read
    if (readError) throw new Error(`failed to read movie file: ${movieFile}`);

    return {key: `${id}.${format}`, data}
};

module.exports = generateAnimation;
