const S3_BUCKET_NAME = 'asa-dev';
const CONN_URL = process.env.CONN_URL ? process.env.CONN_URL : 'amqp://localhost:5672';
const MONGO_URL = process.env.MONGO_URL ? process.env.MONGO_URL : 'mongodb://localhost:27017';

// update as necessary
const MAX_REQUEST_CONCURRENCY = 3;
const MAX_WORKERS = 5;

const IMAGE_SERVICE = 'image';
const IMAGE_QUEUE = 'image';

const ANIMATION_SERVICE = 'animation';
const ANIMATION_QUEUE = 'animation';

const PENDING = 'PENDING';
const FAILED = 'FAILED';
const SUCCESS = 'SUCCESS';

// max height of map image
const MAX_IMAGE_HEIGHT = 800;

// cache expiration for job-specific basemap and legend images
const EXPIRE = 300; // seconds


module.exports = {
    CONN_URL,
    MONGO_URL,
    IMAGE_SERVICE,
    IMAGE_QUEUE,
    ANIMATION_SERVICE,
    ANIMATION_QUEUE,
    PENDING,
    FAILED,
    SUCCESS,
    MAX_IMAGE_HEIGHT,
    MAX_WORKERS,
    MAX_REQUEST_CONCURRENCY,
    S3_BUCKET_NAME,
    EXPIRE
};
