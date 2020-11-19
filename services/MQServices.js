const amqp = require('amqplib/callback_api');
const CONN_URL = 'amqp://localhost';
let ch = null;

amqp.connect(CONN_URL, (err, conn) => {
    conn.createChannel((err,channel) => {
        ch = channel
    })
});

const publishToQueue = async (queueName, data) => {
    console.log('publishing to queue!');
    ch.sendToQueue(queueName, new Buffer(JSON.stringify(data)), {persistent: true})
};

process.on('exit', code => {
    ch.close();
    console.log('closing rabbitMQ channel');
});

module.exports = {
    publishToQueue
};

