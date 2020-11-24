const express = require("express");
const apiRouter = express();


apiRouter.use("/service", require('./service'));

apiRouter.use("/job-status", require('./jobStatus'));

module.exports = apiRouter;
