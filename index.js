const express = require("express");
const app = express();
const cors = require("cors");
const port = 8080;
const subscriptionRouter = require("./routes/subscription");
const userRouter = require("./routes/user");
const customerRouter = require("./routes/customer");
const deviceRouter = require("./routes/device");
const branchRouter = require("./routes/branch");
const deptRouter = require("./routes/dept");
const uiRouter = require("./routes/ui");
const cameraRouter = require("./routes/camera");
const eventRouter = require("./routes/event");
const reportRouter = require("./routes/report");
const serverconfRouter = require("./routes/serverconf");
const contactRouter = require("./routes/contact");
const devicesdkRouter = require("./routes/devicesdk");
const adminRouter = require("./routes/admin");
const serverRouter = require("./routes/server");
const verificationRouter = require('./routes/verification');
const GraphRouter = require('./routes/graph');
const SecureRouter = require('./routes/secureshutter');

const sessions = require('express-session');
var session;

app.use(cors());
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);

app.use((req, res, next) => {
  const date = new Date();
  const timestamp = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  console.log(`${timestamp} - Received request for: ${req.method} ${req.url}`);
  next(); // Call the next middleware in the stack
});

app.get("/", (req, res) => {
  // session=req.session;
  // session.deviceinfo={
  //   serialnumber:"",
  //   analogchannel:"",
  //   ipchannel:"",
  //   audiotalkchannel:"",
  //   resolution:0,
  //   notificationserver:0,
  //   eventenabled:0,
  //   motiondetection:""
  // };
  //res.json({ message: "ok" });
  res.sendFile(__dirname + "/index.html");
});
app.use("/subscription", subscriptionRouter);
app.use("/user", userRouter);
app.use("/customer", customerRouter);
app.use("/device", deviceRouter);
app.use("/branch", branchRouter);
app.use("/dept", deptRouter);
app.use("/ui", uiRouter);
app.use("/camera", cameraRouter);
app.use("/event", eventRouter);
app.use("/report", reportRouter);
app.use("/serversetting", serverconfRouter);
app.use("/contact", contactRouter);
app.use("/devicesdk", devicesdkRouter);
app.use("/admin", adminRouter);
app.use("./server",serverRouter);
app.use('/verification', verificationRouter);
app.use('/graph',GraphRouter);
app.use('/secureshutter',SecureRouter);

/* Error handler middleware */
app.use((err, req, res, next ) => {
  const statusCode = err.statusCode || 500;
  console.error(err.message, err.stack);
  res.status(statusCode).json({ message: err.message }).end();
  return;
});
app.listen(port, () => {
  var ts = Date.now();console.log(ts+` SVMWebAPI app listening at http://localhost:${port}`);
});