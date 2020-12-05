const async = require('async');
const axios = require('axios');
const generateSingleImage = require('./generateSingleImage');
const parsePayload = require('../utilities/parsePayload');
const {MAX_FRAME_CONSTRUCTION_CONCURRENCY} = require('../config');


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


    // const mapTimes = payload['data']['basemap']['map_times'];

    let frames;
    try {
        frames = await getAnimationFrames(payload);
    } catch (err) {
        console.log('failed to get generate animation frames');
        throw err;
    }

    // TODO: need a fresh image on each cycle... seems like old layers are still on the new image

    await frames[0].writeAsync(`output/${Date.now()}_test_1.png`);
    await frames[1].writeAsync(`output/${Date.now()}_test_2.png`);
    console.log('hi');
    // TODO add buffered images to a readable stream and use fluent ffmpeg to convert to video

    // preserve all buffered images in object
    // return new Promise((resolve, reject) => {
    //     const frames = {};
    //
    //     // create a queue object with concurrency 2
    //     let q = async.queue(function(task, callback) {
    //         const {name, action, payload, index} = task;
    //         console.log(`task ${name}: ${index}`);
    //
    //         // call action and trigger callback on completion
    //         action(payload, index, callback);
    //     }, MAX_FRAME_CONSTRUCTION_CONCURRENCY);
    //
    //     // assign a callback
    //     q.drain(function() {
    //         console.log('all frames have been processed');
    //         resolve(frames);
    //     });
    //
    //     // assign an error callback
    //     q.error(function(err, task) {
    //         console.error('task experienced an error');
    //         reject(err);
    //     });
    //
    //     for (let i = 0; i < mapTimes.length; i++) {
    //
    //         let task = {
    //             name: `building frame for map time: ${mapTimes[i]}`,
    //             action: generateSingleImageWrapper,
    //             payload: parsePayload(i, payload),
    //             index: i
    //         };
    //
    //         q.push(task, function (err, data) {
    //             if (!err) {
    //                 frames[data['index']] = data['img']
    //             }
    //         })
    //     }
    // });


};

module.exports = generateAnimation;
