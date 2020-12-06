const mongoose = require('mongoose');
const {MONGO_URL} = require('../config');

// https://developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs/mongoose

// connect to mongo daemon
mongoose
    .connect(
        `${MONGO_URL}/process_status`,
        { useNewUrlParser: true }
    )
    .then(() => {
        console.log('MongoDB Connected')
    })
    .catch(err => console.log(err));

// schema
const JobStatusSchema = new mongoose.Schema({
    status: {
        type: String,
        required: true
    },
    objectKey: {
        type: String,
    },
    date: {
        type: Date,
        default: Date.now
    }
}, {
    toObject: {
        transform: function (doc, ret) {
            // delete ret._id;
            delete ret.__v;
        }
    },
    toJSON: {
        transform: function (doc, ret) {
            // delete ret._id;
            delete ret.__v;
        }
    }
});

/**
 *
 * @param id - native mongoDB identifier
 * @param status - SUCCESS | FAILED | PENDING
 * @param key - AWS S3 object key
 * @return {Promise<void>}
 */
const updateJobStatus = async (id, status, key) => {

    let job;
    try {
        job = await JobStatus.findById(id);
    } catch (err) {
        throw new Error('unable to get job from db');
    }

    job.status = status;
    job.objectKey = key;
    job.date = Date.now();
    job.save(function(err) {
        if (err) throw new Error('unable to update job status');
    })
};

const JobStatus = mongoose.model('jobStatus', JobStatusSchema);


module.exports = {
    JobStatus,
    JobStatusSchema,
    updateJobStatus
};
