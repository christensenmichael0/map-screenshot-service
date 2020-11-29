const express = require ('express');
const {getObject} = require('../services/aws');

const app = express();

// get file from s3
app.get('/:id', async (req, res) => {

    // let key ='oceansmap/custom-thumbnails/eds_carib_swan_wave_direction_20201015T180012Z.png';
    try {
        let {contentType, data} = await getObject(key);

        // res.end(data, 'binary');
        res.contentType(contentType);
        res.send(data);
    } catch (err) {
        res.send('failed to get resource').status(500);
    }
});

module.exports = app;
