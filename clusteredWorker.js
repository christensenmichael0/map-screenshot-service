const cluster = require('cluster');
// const os = require('os');

// TODO: define this in config or just use CPUs
// const numWorkers = 5;

if (cluster.isMaster) {
    const cpus = os.cpus().length;

    for (let i =0; i < cpus; i++) {
        cluster.fork();
    }
} else {
    require('./worker')
}
