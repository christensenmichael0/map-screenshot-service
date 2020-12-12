const S3_BUCKET_NAME = 'asa-dev';
const CONN_URL = process.env.CONN_URL ? process.env.CONN_URL : 'amqp://localhost:5672';
const MONGO_URL = process.env.MONGO_URL ? process.env.MONGO_URL : 'mongodb://localhost:27017';

// update as necessary (consider machine memory)
const MAX_REQUEST_CONCURRENCY = 3;
const MAX_FRAME_CONSTRUCTION_CONCURRENCY = 2;
const MAX_WORKERS = 5;

const IMAGE_SERVICE = 'image';
const IMAGE_QUEUE = 'image';

const ANIMATION_SERVICE = 'animation';
const ANIMATION_QUEUE = 'animation';

const PENDING = 'PENDING';
const FAILED = 'FAILED';
const SUCCESS = 'SUCCESS';

// large frames can crash ffmpeg
const MAX_VIDEO_HEIGHT = 800;

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
    MAX_VIDEO_HEIGHT,
    MAX_WORKERS,
    MAX_REQUEST_CONCURRENCY,
    MAX_FRAME_CONSTRUCTION_CONCURRENCY,
    S3_BUCKET_NAME,
    EXPIRE
};
