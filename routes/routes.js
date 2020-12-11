const express = require("express");
const apiRouter = express();


apiRouter.use("/service", require('./service'));

apiRouter.use("/job-status", require('./jobStatus'));

apiRouter.use("/download", require('./download'));

module.exports = apiRouter;
