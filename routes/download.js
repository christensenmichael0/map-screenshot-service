const express = require ('express');
const {getObject} = require('../services/aws');

const app = express();

// get file from s3
app.get('/:id', async (req, res) => {
    try {
        let s3ObjectStream = getObject(req.params.id).createReadStream();
        s3ObjectStream.pipe(res);
    } catch (err) {
        res.send(err).status(500);
    }
});

module.exports = app;
