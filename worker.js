const amqp = require('amqplib');
const {updateJobStatus} = require('./services/MongoServices');
const {putObject} = require('./services/aws');
const generateSingleImage = require('./scripts/generateSingleImage');
const generateAnimation = require('./scripts/generateAnimation');
const {IMAGE_QUEUE, ANIMATION_QUEUE, CONN_URL,
    SUCCESS, FAILED, PENDING} = require('./config');

let channel, imageQueue, animationQueue;

amqp.connect(CONN_URL).then(conn => conn.createChannel()).then(ch => {
    console.log('*** THE WORKER IS CONNECTED!');
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
            console.log(`failed to update job status: ${taskData.id}`);
            return;
        }

        let taskExecutor = queue === IMAGE_QUEUE ? generateSingleImage : generateAnimation;

        // execute task
        let key, data;
        try {
            ({key, data} = await taskExecutor(taskData));
        } catch (err) {
            status = FAILED;
            let jobType = queue === IMAGE_QUEUE ? 'single image' : 'animation';
            console.log(`${jobType} generation failed for job: ${taskData.id}`)
        }

        // push buffered data to AWS S3
        if (status !== FAILED && !!data) {
            try {
                await putObject(key, data);
                status = SUCCESS;
            } catch (err) {
                status = FAILED;
                console.log(`failed to save ${key} to AWS S3 bucket: ${err}`);
            }
        }

        // update mongo
        try {
            await updateJobStatus(taskData.id, status, key);
            console.log(`task complete: ${taskData.id} - ${status}`);
        } catch (err) {
            console.log(`failed to update job status: ${taskData.id}`);
            return
        }

        channel.ack(msg);
    },{noAck: false})
}
