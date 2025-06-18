const config = {
  db: {
    /* don't expose password or any sensitive info, done only for demo */
    host: "192.168.0.158",
    user: "ssipl_serveradmin",
    password: "Sporada@2014",
    multipleStatements: true,
    database: "ssipl_clouddb1",
    connectionLimit: 5000,
  },
  db1: {
    /* don't expose password or any sensitive info, done only for demo */
    host: "192.168.0.159",
    user: "ssipl_serveradmin",
    password: "Sporada@2014",
    multipleStatements: true,
    database: "ssipl_clouddb1",
    connectionLimit: 5000,
  },
  folderpath : {
    serverip : "192.168.0.198",
    storagepath : "\\\\192.168.0.198\\volumes",//for events also i have given this path-- ganesh  , also for creating the site folder
    username : "Administrator",
    password : "Sporada@2014"
  },
  sitecontrollerpath : "\\\\192.168.0.198\\volumes\\SITECONTROLLER\\Site_Controller",
  deviceinfopath : 'http://192.168.0.166:8002',
  listPerPage: 15,
  eventlistpage: 100,
};
module.exports = config;