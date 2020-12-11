const amqp = require('amqplib/callback_api');
const {CONN_URL} = require('../config');

let ch = null;

let maxRetries = 100, waitTime = 1;
const connect2AMQP = () => {
    amqp.connect(CONN_URL, (err, conn) => {
        if (err) {
            let remainingRetries = maxRetries--;
            if (!remainingRetries) throw err;

            console.log(`attempting to establish connection to rabbitMQ... ${remainingRetries} attempts remaining`);
            return setTimeout(connect2AMQP, waitTime * 1000);
        }

        conn.createChannel((err,channel) => {
            ch = channel
        })
    });
};

// instantiate connection
connect2AMQP();

const publishToQueue = async (queueName, data) => {
    console.log('publishing to queue!');
    ch.sendToQueue(queueName, new Buffer(JSON.stringify(data)), {persistent: true})
};

process.on('exit', code => {
    if (ch) ch.close();
});

module.exports = {
    publishToQueue
};

