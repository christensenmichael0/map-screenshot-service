const express = require ('express');
const {JobStatus} = require('../services/MongoServices');

const app = express();

// get job status from mongoDB
app.get('/:id', async (req, res) => {

    try {
        let resp = await JobStatus.findById(req.params.id);
        return res.json(resp);
    } catch (err) {
        throw new Error('job doesnt exist')
    }
});

module.exports = app;
