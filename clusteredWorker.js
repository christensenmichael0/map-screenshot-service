const cluster = require('cluster');
const os = require('os');
const {MAX_WORKERS} = require('./config');


if (cluster.isMaster) {
    const cpus = os.cpus().length;
    // update as necessary
    const workers = Math.min(cpus, MAX_WORKERS);

    for (let i =0; i < workers; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker,code) => {
        if (code != 0 && !worker.suicide) {
            console.log('Worker crashed. Starting a new worker');
            cluster.fork();
        }
    })
} else {
    require('./worker')
}
