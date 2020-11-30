const express = require ('express');
const {getObject} = require('../services/aws');

const app = express();

// get file from s3
app.get('/:id', async (req, res) => {
    try {
        let {contentType, data} = await getObject(key);
        res.contentType(contentType);
        res.send(data);
    } catch (err) {
        res.send('failed to get resource').status(500);
    }
});

module.exports = app;
