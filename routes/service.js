const express = require ('express');
const {publishToQueue} = require('../services/MQServices');
const {JobStatus} = require('../services/MongoServices');

const {IMAGE_SERVICE, IMAGE_QUEUE,
    ANIMATION_SERVICE, ANIMATION_QUEUE} = require('../config');

const app = express();

// trigger long-running task (either single image generation or animation)
app.post('/:serviceType', (req, res, next) => {

    let queueName, serviceType = req.params.serviceType;
    if (serviceType === IMAGE_SERVICE) {
        queueName = IMAGE_QUEUE;
    } else if (serviceType === ANIMATION_SERVICE) {
        queueName = ANIMATION_QUEUE;
    } else {
        return next(new Error('invalid service type'))
    }

    const job = JobStatus({status: 'pending'});
    job.save(function(err, job) {
        if (err) return next(err);

        publishToQueue(queueName, {
            id: job.id,
            data: {...req.body}
        });

        // respond immediately with status update since this triggers a long-running task
        res.json(job.toJSON());
    });
});

module.exports = app;
