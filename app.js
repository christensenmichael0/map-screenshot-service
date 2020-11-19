const express = require ('express');
const bodyParser = require('body-parser');
const path = require('path');
const morgan = require('morgan');
const errorHandler = require('errorhandler');
const generateAnimation = require('./scripts/generateAnimation');
// const axios = require('axios');


// const amqp = require('amqplib');
// const mongoose = require('mongoose');
const {publishToQueue} = require('./services/MQServices');
const {JobStatus} = require('./services/MongoServices');

const {IMAGE_SERVICE, IMAGE_QUEUE,
    ANIMATION_SERVICE, ANIMATION_QUEUE} = require('./config');


// https://gis.stackexchange.com/questions/22890/geotiff-file-creation-from-tiff-file
// https://github.com/geotiffjs/geotiff.js/blob/master/README.md

const app = express();
app.use(bodyParser.json());

// logging middleware
app.use(morgan('dev'));

// for testing
app.get('/test', (req, res) => {
    const cities = [
        {name: 'New York City', population: 8175133},
        {name: 'Los Angeles',   population: 3792621},
        {name: 'Chicago',       population: 2695598}
    ];
    res.json(cities)
});

const mockData = [{"url":"/api/wms?url=https%3A%2F%2Fcoastmap.com%2Fecop%2Fwms.aspx","layers":"WW3_WAVE_HEIGHT","transparent":true,"format":"image/png","styles":"WAVE_HEIGHT_STYLE-Jet-0-8","colorscalerange":"0,8","autoscalerange":"false","time":"2020-11-05T12:00:00Z","title":"Waves @ Global (WW3 Height)","use_bbox":"-84.47619438171387,31.664047894350464,-59.888792037963874,44.771233622044925","width":1119,"height":763,"basemap_thumbnail":"https://server.arcgisonline.com/arcgis/rest/services/World_Topo_Map/MapServer/tile/0/0/0","basemap_template":"http://{s}.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}","startTime":"2020-11-03T00:00:00-05:00","endTime":"2020-11-07T23:59:59-05:00","version":"1.1.1","request":"GetMap","service":"WMS","duration":10,"movieFormat":"mp4","srs":"EPSG:3857"}]
const mockImgUrl = 'https://coastmap.com/ecop/wms.aspx?service=WMS&request=GetMap&version=1.1.1&layers=WW3_WAVE_HEIGHT&styles=WAVE_HEIGHT_STYLE-Jet-0-8&format=image%2Fpng&transparent=true&colorscalerange=0%2C8&autoscalerange=false&time=2020-11-05T12%3A00%3A00Z&exceptions=application%2Fvnd.ogc.se_xml&width=1119&height=765&srs=EPSG%3A3857&bbox=-9403846.942725986%2C3716846.046652051%2C-6666789.833890395%2C5588024.4990731655&ABOVEMAXCOLOR=extend&BELOWMINCOLOR=extend';

let fakeId = null;

// get job status from mongoDB
app.get('/job_status/:id', async (req, res) => {

    try {
        let resp = await JobStatus.findById(req.params.id);
        return res.json(resp);
    } catch (err) {
        throw new Error('job doesnt exist')
    }
});


// trigger long-running task (either single image generation or animation)
app.post('/service/:serviceType', (req, res, next) => {

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

app.get('/animation', (req, res) => {


    // axios.get(mockImgUrl,{ responseType: 'arraybuffer' }).then(function (response) {
    //     res.send(Buffer.from(response.data, 'binary')).status(200)
    // }).catch(function () {
    //     res.send('An Error Occurred').status(500);
    // })

    generateAnimation(1,2,3,4).then(fileBuff => {
            res.send('its done!').status(200);
        }
    ).catch(err => {
        res.send('An Error Occurred').status(500);
    })


});

// TODO: eventual endpoint
// app.post('/animation',(req,res) => {
//     debugger
// });

app.use(errorHandler());

app.listen(5005, () => {
    console.log(`listening on ${5005}`)
});
