const amqp = require('amqplib');
const {updateJobStatus} = require('../services/MongoServices');
const generateSingleImage = require('./generateSingleImage');
const generateAnimation = require('./generateAnimation');
const {IMAGE_QUEUE, ANIMATION_QUEUE, CONN_URL,
    SUCCESS, FAILED, PENDING} = require('../config');

let channel, imageQueue, animationQueue;
amqp.connect(CONN_URL).then(conn => conn.createChannel()).then(ch => {
        channel = ch;
        return channel.assertQueue(IMAGE_QUEUE);
    }).then(q => {
        imageQueue = q.queue;
        consume(imageQueue);
    }
);

amqp.connect(CONN_URL).then(conn => conn.createChannel()).then(ch => {
    channel = ch;
    return channel.assertQueue(ANIMATION_QUEUE);
}).then(q => {
        animationQueue = q.queue;
        consume(animationQueue);
    }
);

function consume(queue) {
    channel.consume(queue, async msg => {
        console.log('Message from worker: ', msg.content.toString());

        let status = PENDING;
        let taskData = JSON.parse(msg.content.toString());

        // if unable to update job status then abort without acknowledgement
        try {
            await updateJobStatus(taskData.id, status);
        } catch (err) {
            return;
        }

        let taskExecutor = queue === IMAGE_QUEUE ? generateSingleImage : generateAnimation;

        // execute task
        try {
            await taskExecutor(taskData);
            status = SUCCESS;
        } catch (err) {
            status = FAILED;
        }

        // update mongo
        try {
            await updateJobStatus(taskData.id, status);
            console.log(`finished job: ${taskData.id}`);
        } catch (err) {
            return
        }

        channel.ack(msg);
    },{noAck: false})
}
