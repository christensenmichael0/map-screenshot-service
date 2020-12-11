const express = require ('express');
const {getObject} = require('../services/aws');
const {JobStatus} = require('../services/MongoServices');

const app = express();

// get file from s3
app.get('/:id', async (req, res) => {

    let jobInfo;
    try {
        jobInfo = await JobStatus.findById(req.params.id);
    } catch (err) {
        res.send('resource not found').status(404);
    }

    let {objectKey} = jobInfo;
    try {
        let {contentType, data} = await getObject(objectKey);
        res.contentType(contentType);
        res.send(data);
    } catch (err) {
        res.send('failed to get resource').status(500);
    }
});

module.exports = app;
