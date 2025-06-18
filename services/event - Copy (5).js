const db = require('./db');
const helper = require('../helper');
const config = require('../config');
const fs = require('fs');
const path = require('path');
const url = require('url');
const { Session } = require('inspector');
const moment = require('moment-timezone');
const { serialize } = require('v8');
const { he } = require('date-fns/locale');
const { start } = require('repl');

async function create(event){
    let message = 'Error in creating new device event';
    let responsecode = "9001"
    const resultAPI = await db.query('select user_id,token from apitokenmaster where user_id='+event.userid+' and token="'+event.TOKEN+'" and valid_status=1;');  
    // console.error(`Result data==>`, resultAPI);
    if (resultAPI.length == 0) 
    {
        responsecode = "9001"
        message = "Invalid TOKEN";
        return{responsecode,message}
    }
    //const result = await db.spcall('CALL addeventruntime("'+event.ipaddress+'",'+event.camerano+',"'+event.alerttext+'", @camID,@eid,'+event.ipport+')');
    const [result] = await db.spcall('CALL addeventruntime(?,?,?, @camID,@eid,?);select @camID,@eid;',[event.ipaddress,event.camerano,event.alerttext,event.ipport]);
    data = result[1];
    if (result.affectedRows) {
      responsecode = "901"
      message = 'Device event created successfully';
    }
    return {responsecode,message,data};
}


async function createSnapshot(event){
  let message = 'Error in creating new event snapshot';
  let responsecode = "9002"
  const resultAPI = await db.query('select user_id,token from apitokenmaster where user_id='+event.userid+' and token="'+event.TOKEN+'" and valid_status=1;');  
  // console.error(`Result data==>`, resultAPI);
  if (resultAPI.length == 0) 
  {
      responsecode = "9002"
      message = "Invalid TOKEN";
      return{responsecode,message}
  }
  const [result] = await db.spcall('CALL addeventlog(?,?,?,?,?,@eaid);select @eaid;',[event.eventid,event.message,event.alerttext,1,event.userid]);
  data = result[1];
  if (result.affectedRows) {
    responsecode = "902"
    message = 'Event snapshot created successfully';
  }
  return {responsecode,message,data};
}


async function createSnapshotSingle(event){
  let message = 'Error in creating new event snapshot';
  let responsecode = "9002"
  // const resultAPI = await db.query('select user_id,token from apitokenmaster where user_id='+event.userid+' and token="'+event.TOKEN+'" and valid_status=1;');  
  // // console.error(`Result data==>`, resultAPI);
  // if (resultAPI.length == 0) 
  // {
  //     responsecode = "9002"
  //     message = "Invalid TOKEN";
  //     return{responsecode,message}
  // }
//  const [result] = await db.spcall('CALL addeventlog(?,?,?,?,?,@eaid);select @eaid;',[event.eventid,event.message,event.alerttext,1,event.userid]);
//  data = result[1];
var digestRequest = require('request-digest')(event.username, event.password);
var fs = require('fs');

// let date_ob = new Date();

// // current date
// // adjust 0 before single digit date
// let date = ("0" + date_ob.getDate()).slice(-2);

// // current month
// let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);

// // current year
// let year = date_ob.getFullYear();

// // current hours
// let hours = date_ob.getHours();

// // current minutes
// let minutes = date_ob.getMinutes();

// // current seconds
// let seconds = date_ob.getSeconds();

// // prints date in YYYY-MM-DD format
// // console(year + "-" + month + "-" + date);

// // prints date & time in YYYY-MM-DD HH:MM:SS format
// // console(year + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds);
// var ctime = year + "_" + month + "_" + date + "_" + hours + "" + minutes + "" + seconds
  if (event.sdktype=="1")
  {
    digestRequest.request({
      host: 'http://'+event.ipdomain,
      path: '/ISAPI/Streaming/channels/'+event.camerano+'00/picture?videoResolutionWidth=1920&videoResolutionHeight=1080',
      port: event.httpport,
      method: 'GET',
      encoding:'binary'
    }, function (error, response, body) {
      if (error) {
        throw error;
      } 
      fs.writeFileSync(event.netpath, body, 'binary')
    })
    responsecode = "902"
    message = 'Event snapshot created successfully';
    data = event.netpath;
    return {responsecode,message,data};
  }
  else
  {
    digestRequest.request({
      host: 'http://'+event.ipdomain,
      path: '/cgi-bin/snapshot.cgi?channel='+event.camerano,
      port: event.httpport,
      method: 'GET',
      encoding:'binary'
    }, function (error, response, body) {
      if (error) {
        throw error;
      } 
      fs.writeFileSync(event.netpath, body, 'binary')
    })
    responsecode = "902"
    message = 'Event snapshot created successfully';
    data = event.netpath;
    return {responsecode,message,data};
  }
}

async function createAction(event){
  let message = 'Error in creating new event action';
  let responsecode = "9003"
  const resultAPI = await db.query('select user_id,token from apitokenmaster where user_id='+event.userid+' and token="'+event.TOKEN+'" and valid_status=1;');  
  // console.error(`Result data==>`, resultAPI);
  if (resultAPI.length == 0) 
  {
      responsecode = "9003"
      message = "Invalid TOKEN";
      return{responsecode,message}
  }
  const [result] = await db.spcall('CALL addactiontaken(?);',[event.eventid]);
  const [result1] = await db.spcall('CALL updateevent(?,?,?,?);',[event.eventid,event.flag,event.feedback,event.userid]);
  responsecode = "903"
  message = 'Event action created successfully';
  return {responsecode,message};
}


async function update(event){
  let message = 'Error in updating device event data';
  let responsecode = "8002"
  const resultAPI = await db.query('select user_id,token from apitokenmaster where user_id='+device.userid+' and token="'+device.TOKEN+'" and valid_status=1;');  
  console.error(`Result data==>`, resultAPI);
  if (resultAPI.length == 0) 
  {
      responsecode = "8002"
      message = "Invalid TOKEN";
      return{responsecode,message}
  }

  const result = await db.query(
    `DELETE from devicemaster WHERE Device_ID=${device.deviceid}` 
  );

  if (result.affectedRows) {
    const result = await db.query('CALL adddevice1('+device.deviceid+','+device.deptid+',"'+device.devicename+'",'+device.devicetype+', '+device.userid+',"'+device.brand+'","'+device.ipdomain+'",'+device.port+',"'+device.username+'","' +device.password+'",'+device.noach+','+device.noipch+','+device.noastream+','+device.motiondetection+','+device.sdkid+','+device.serialno+','+device.http+','+device.rtsp+')');

    if (result.affectedRows) {
      responsecode = "802"
      message = 'Device event created successfully';
    }
  }

  return {message};
}

async function deletedata(event){
  let message = 'Error in deleting device event data';
  let responsecode = "8004"
  const resultAPI = await db.query('select user_id,token from apitokenmaster where user_id='+event.userid+' and token="'+event.TOKEN+'" and valid_status=1;');  
  console.error(`Result data==>`, resultAPI);
  if (resultAPI.length == 0) 
  {
      responsecode = "8004"
      message = "Invalid TOKEN";
      return{responsecode,message}
  }

  const [result] = await db.spcall(
    `DELETE from eventactiontaken WHERE event_id=${event.eventid};DELETE from eventactionlog WHERE event_id=${event.eventid};DELETE from eventlog WHERE event_id=${event.eventid};DELETE from eventmaster WHERE event_id=${event.eventid};` 
  );

  // if (result.affectedRows) {
      responsecode = "804"
      message = 'Device event data deleted successfully';
  // }

  return {message};
}

async function getMultiple(page = 1,event){
  let message = 'Error in fetching device event list';
  let responsecode = "8005"
  const resultAPI = await db.query('select user_id,token from apitokenmaster where user_id='+event.userid+' and token="'+event.TOKEN+'" and valid_status=1;');  
  console.error(`Result data==>`, resultAPI);
  if (resultAPI.length == 0) 
  {
      responsecode = "8005"
      message = "Invalid TOKEN";
      return{responsecode,message}
  }

  const offset = helper.getOffset(page, config.listPerPage);
  let sql=""
  // if (event.cameraid!=0)
  //   sql=`SELECT em.Event_ID,em.Row_updated_date,dt.dept_Location,dm.Device_name,cm.Camera_name,em.Event_name,em.Alertmessage,min(el.event_status) as event_status,cm.camera_id FROM eventmaster em,eventstatus el,devicemaster dm,cameramaster cm,deptmaster dt where dm.device_id=cm.device_id and dt.dept_id=cm.place and cm.camera_id=AnalyticSource_ID and el.event_id=em.event_id and em.event_id not in (select event_id from eventsmarked where Row_updated_date between "${event.startdate}" and "${event.enddate}") and em.analyticsource_id=${event.cameraid} LIMIT ${offset},${config.listPerPage}`;
  // if (event.deviceid!=0)
  //   sql=`SELECT em.Event_ID,em.Row_updated_date,dt.dept_Location,dm.Device_name,cm.Camera_name,em.Event_name,em.Alertmessage,min(el.event_status) as event_status,cm.camera_id FROM eventmaster em,eventstatus el,devicemaster dm,cameramaster cm,deptmaster dt where dm.device_id=cm.device_id and dt.dept_id=cm.place and cm.camera_id=AnalyticSource_ID and el.event_id=em.event_id and em.event_id not in (select event_id from eventsmarked where Row_updated_date between "${event.startdate}" and "${event.enddate}") and analyticsource_id in (select camera_id from cameramaster where device_id=${event.deviceid}) LIMIT ${offset},${config.listPerPage}`;
  // if (event.branchid!=0)
  //   sql=`SELECT em.Event_ID,em.Row_updated_date,dt.dept_Location,dm.Device_name,cm.Camera_name,em.Event_name,em.Alertmessage,min(el.event_status) as event_status,cm.camera_id FROM eventmaster em,eventstatus el,devicemaster dm,cameramaster cm,deptmaster dt where dm.device_id=cm.device_id and dt.dept_id=cm.place and cm.camera_id=AnalyticSource_ID and el.event_id=em.event_id and em.event_id not in (select event_id from eventsmarked where Row_updated_date between "${event.startdate}" and "${event.enddate}") and analyticsource_id in (select camera_id from cameramaster where device_id in (select device_id from devicemaster where dept_id in (select dept_id from deptmaster where branch_id=${event.branchid}))) LIMIT ${offset},${config.listPerPage}`;
  // if (event.customerid!=0)
  //   sql=`SELECT em.Event_ID,em.Row_updated_date,dt.dept_Location,dm.Device_name,cm.Camera_name,em.Event_name,em.Alertmessage,min(el.event_status) as event_status,cm.camera_id FROM eventmaster em,eventstatus el,devicemaster dm,cameramaster cm,deptmaster dt where dm.device_id=cm.device_id and dt.dept_id=cm.place and cm.camera_id=AnalyticSource_ID and el.event_id=em.event_id and em.event_id not in (select event_id from eventsmarked where Row_updated_date between "${event.startdate}" and "${event.enddate}") and SELECT * FROM devicemaster where analyticsource_id in (select camera_id from cameramaster where device_id in (select device_id from devicemaster where dept_id in (select dept_id from deptmaster where branch_id in (select branch_id from branchmaster where customer_id=${event.customerid})))) LIMIT ${offset},${config.listPerPage}`;
    
    let clSQL=`SELECT em.Event_ID,em.Row_updated_date,dt.dept_Location,dm.Device_name,cm.Camera_name,em.Event_name,em.Alertmessage,min(el.event_status) as event_status,cm.camera_id 
    FROM eventmaster em,eventstatus el,devicemaster dm,cameramaster cm,deptmaster dt where dm.device_id=cm.device_id and dt.dept_id=cm.place and cm.camera_id=AnalyticSource_ID and
     el.event_id=em.event_id and em.event_id not in (select event_id from eventsmarked where Row_updated_date between "${event.startdate}" and "${event.enddate}")`;
		if (event.customerid!="")//Company ID
		{
			clSQL=clSQL+" and dt.branch_id in (select branch_id from branchmaster where customer_id="+event.customerid+")";
		}
		if (event.deviceid!="")//Device ID
			clSQL=clSQL+" and dm.device_id="+event.deviceid;
		if (event.cameraid!="")//Camera ID
			clSQL=clSQL+" and cm.Camera_id in ("+event.cameraid+")";
		if (event.validflag!="")//Event Flag
			clSQL=clSQL+" and el.event_status="+event.validflag;
		if (event.eventtype!="")//Event Type
			clSQL=clSQL+" and em.event_id in (select event_id from eventlog where feedback like '%"+event.eventtype+"%' and event_id=em.Event_ID)";
		if (event.startdate!="" && event.enddate!="")//Event date
			clSQL=clSQL+" and em.Row_updated_date between '"+event.startdate+"' and '"+event.enddate+"'";
		if (event.AI!="" && event.AI!="All" && event.AI!="None")
		{
			if (event.AI=="Not detected")
				clSQL=clSQL+" and em.IsHumanDetected=0";
			else
				clSQL=clSQL+" and em.IsHumanDetected=1";
		}
		clSQL=clSQL+' group by em.Event_ID,em.Row_updated_date,dt.dept_Location,dm.Device_name,cm.Camera_name,em.Event_name,em.Alertmessage,cm.camera_id';
		clSQL=clSQL+' order by em.Row_updated_date desc,el.event_status asc';
    sql = clSQL;
		    
  // var ts = Date.now();// console(ts+"SQL Data=>",sql);
  if (sql!="")
  {
    const rows = await db.query(sql);

    const data = helper.emptyOrRows(rows);
    const meta = {page};
    message = 'device event list Fetching successfully';
    responsecode = "805"

    return {
      responsecode,
      message,
      data,
      meta
    }
  }
  else
  {
    message = 'Branch/Customer/device/Camera ID is missing. Please give any one of the input of Branch/Customer/device/Camera ID';
    responsecode = "8005"
    return {
      responsecode,
      message,
      data,
      meta
    }
  }
}


async function getEventSnapshot(page = 1,event){
  let message = 'Error in fetching  event snapshot list';
  let responsecode = "8005"
  const resultAPI = await db.query('select user_id,token from apitokenmaster where user_id='+event.userid+' and token="'+event.TOKEN+'" and valid_status=1;');  
  
  if (resultAPI.length == 0) 
  {
      responsecode = "8005"
      message = "Invalid TOKEN";
      return{responsecode,message}
  }

  const offset = helper.getOffset(page, config.listPerPage);
  let sql=""
  //sql=`SELECT * from eventactionlog where event_id=${event.eventid} LIMIT ${offset},${config.listPerPage}`;		    
  sql=`select em.Event_ID,em.Event_Name,em.Row_updated_date,em.enddate,em.Alertmessage,em.IsHumanDetected,cm.camera_id,cm.camera_name,dm.device_name,dm.short_name,dm.SDK_ID,dt.Dept_name,dt.Dept_Location,dc.Name1,dc.Contact_mobile1,dc.Contact_Email1,bm.Branch_name,bm.contact_person from eventmaster em,cameramaster cm,devicemaster dm,deptmaster dt,deptcontacts dc,branchmaster bm where bm.branch_id=dt.branch_id and dc.dept_id=dt.dept_id and dt.dept_id=dm.dept_id and dm.device_id=cm.device_id and cm.camera_id=em.analyticsource_id and event_id=${event.eventid}`;		    
  const rows = await db.query(sql);

  //Custom feedback messages
  sql=`select message_id,message from custommessages`;
  console.error(`SQL==>`, sql);
  const feedbacktemplates = await db.query(sql);
  console.error(`feedbacktemplates==>`, feedbacktemplates);
  
  var str = rows[0].enddate;
  var evDate = new Date(str);
  var yyyy = evDate.getFullYear().toString();                                    
  var mm = (evDate.getMonth()+1).toString(); // getMonth() is zero-based         
  var dd  = evDate.getDate().toString();             

  var strDate = yyyy + (mm[1]?mm:"0"+mm[0]) + (dd[1]?dd:"0"+dd[0]);
  var strSitenane = rows[0].Branch_name;
  strSitenane = strSitenane.replace('-','');
  strSitenane = strSitenane.replace(' ','');
  strSitenane = strSitenane.replace("  ","")
  strSitenane = strSitenane.replace('\n','');
  var strCamID = rows[0].camera_id;
  var strEventID = rows[0].Event_ID;
  var FullPath = "http://my.sporada.in/volumes/"+strDate+"/"+strSitenane+"/cam"+strCamID+"/ivs/Event"+strEventID+"/thumb"
  var FullPaththumb = "\\\\192.168.0.165\\volumes\\"+strDate+"\\"+strSitenane+"\\cam"+strCamID+"\\ivs\\Event"+strEventID+"\\thumb"
  console.error(`Result enddate==>`, strDate);
  console.error(`Result Site==>`, strSitenane);
  console.error(`Result Camera ID==>`, strCamID);
  console.error(`Result Event ID==>`, strEventID);
  console.error(`Event folder structure path==> `,FullPath);
  const testFolder = FullPaththumb;
  const fs = require('fs');
  const images = [FullPath];
  fs.readdirSync(testFolder).forEach(file => {
    images.push(file);
    // // console(file);
  });
  const data = helper.emptyOrRows(rows);
  message = 'Event details Fetched successfully';
  responsecode = "805"

  return {
    responsecode,
    message,
    data,
    images,
    feedbacktemplates
  }
}


async function getRecentEvent(event,page = 1){
  let message = 'Error in fetching recent event list';
  let responsecode = "8006"
  console.error(`Data==>`, event);
  console.error(`page==>`, page);
  const resultAPI = await db.query('select user_id,token from apitokenmaster where user_id='+event.userid+' and token="'+event.TOKEN+'" and valid_status=1;');  
  console.error(`Result data==>`, resultAPI);
  if (resultAPI.length == 0) 
  {
      responsecode = "8006"
      message = "Invalid TOKEN";
      return{responsecode,message}
  }

  const offset = helper.getOffset(page, config.listPerPage);
  let sql=""
  //sql=`SELECT * from eventactionlog where event_id=${event.eventid} LIMIT ${offset},${config.listPerPage}`;		    
  sql=`select em.Event_ID,em.Event_Name,em.Row_updated_date,em.enddate,em.Alertmessage,em.IsHumanDetected,cm.camera_id,cm.camera_name,dm.device_name,dm.short_name,dm.SDK_ID,dt.Dept_name,dt.Dept_Location,dc.Name1,dc.Contact_mobile1,dc.Contact_Email1,bm.Branch_name,bm.contact_person from eventmaster em,cameramaster cm,devicemaster dm,deptmaster dt,deptcontacts dc,branchmaster bm where bm.branch_id=dt.branch_id and dc.dept_id=dt.dept_id and dt.dept_id=dm.dept_id and dm.device_id=cm.device_id and cm.camera_id=em.analyticsource_id and em.Row_updated_date BETWEEN '${event.startdate}' and '${event.enddate}' and Event_ID in (select Event_ID from eventuser where user_id='${event.userid}') and Event_ID not in (select Event_ID from eventlog) ORDER BY Row_updated_date DESC LIMIT ${offset},${config.listPerPage}`;
  console.error(`SQL==>`, sql);
  const rows = await db.query(sql);
  console.error(`rows==>`, rows);
  const data = helper.emptyOrRows(rows);
  const meta = {page};
  message = 'Recent event list Fetching successfully';
  responsecode = "806"

  return {
    responsecode,
    message,
    data,
    meta
  }
}


async function getUnAckEvent(event,page = 1){
  let message = 'Error in fetching unacknowledged event list';
  let responsecode = "8007"
  console.error(`Data==>`, event);
  console.error(`page==>`, page);
  const resultAPI = await db.query('select user_id,token from apitokenmaster where user_id='+event.userid+' and token="'+event.TOKEN+'" and valid_status=1;');  
  console.error(`Result data==>`, resultAPI);
  if (resultAPI.length == 0) 
  {
      responsecode = "8007"
      message = "Invalid TOKEN";
      return{responsecode,message}
  }

  const offset = helper.getOffset(page, config.listPerPage);
  let sql=""
  //sql=`SELECT * from eventactionlog where event_id=${event.eventid} LIMIT ${offset},${config.listPerPage}`;		    
  sql=`select em.Event_ID,em.Event_Name,em.Row_updated_date,em.enddate,em.Alertmessage,em.IsHumanDetected,cm.camera_id,cm.camera_name,dm.device_name,dm.short_name,dm.SDK_ID,dt.Dept_name,dt.Dept_Location,dc.Name1,dc.Contact_mobile1,dc.Contact_Email1,bm.Branch_name,bm.contact_person from eventmaster em,cameramaster cm,devicemaster dm,deptmaster dt,deptcontacts dc,branchmaster bm where bm.branch_id=dt.branch_id and dc.dept_id=dt.dept_id and dt.dept_id=dm.dept_id and dm.device_id=cm.device_id and cm.camera_id=em.analyticsource_id and em.Row_updated_date BETWEEN '${event.startdate}' and '${event.enddate}' and Event_ID not in (select Event_ID from eventlog) ORDER BY Row_updated_date DESC LIMIT ${offset},${config.listPerPage}`;
  console.error(`SQL==>`, sql);
  const rows = await db.query(sql);
  console.error(`rows==>`, rows);
  const data = helper.emptyOrRows(rows);
  const meta = {page};
  message = 'Unacknowledged event list Fetching successfully';
  responsecode = "807"

  return {
    responsecode,
    message,
    data,
    meta
  }
}


async function getDeviceEvent(event,page = 1){
  let message = 'Error in fetching device event list';
  let responsecode = "8007"
  console.error(`Data==>`, event);
  console.error(`page==>`, page);
  const resultAPI = await db.query('select user_id,token from apitokenmaster where user_id='+event.userid+' and token="'+event.TOKEN+'" and valid_status=1;');  
  console.error(`Result data==>`, resultAPI);
  if (resultAPI.length == 0) 
  {
      responsecode = "8007"
      message = "Invalid TOKEN";
      return{responsecode,message}
  }

  const offset = helper.getOffset(page, config.listPerPage);
  let sql=""
  //sql=`SELECT * from eventactionlog where event_id=${event.eventid} LIMIT ${offset},${config.listPerPage}`;		    
  sql=`select em.Event_ID,em.Event_Name,em.Row_updated_date,em.enddate,em.Alertmessage,em.IsHumanDetected,cm.camera_id,cm.camera_name,dm.device_name,dm.short_name,dm.SDK_ID,dt.Dept_name,dt.Dept_Location,dc.Name1,dc.Contact_mobile1,dc.Contact_Email1,bm.Branch_name,bm.contact_person from eventmaster em,cameramaster cm,devicemaster dm,deptmaster dt,deptcontacts dc,branchmaster bm where bm.branch_id=dt.branch_id and dc.dept_id=dt.dept_id and dt.dept_id=dm.dept_id and dm.device_id=cm.device_id and cm.camera_id=em.analyticsource_id and em.Row_updated_date BETWEEN '${event.startdate}' and '${event.enddate}' and Event_ID not in (select Event_ID from eventlog) and (Event_Name like 'Tampering%' or Event_Name like 'HDD%' or Event_Name like 'Video%' or Event_Name like '%FULL%' or Event_Name like '%Device%') ORDER BY Row_updated_date DESC LIMIT ${offset},${config.listPerPage}`;
  console.error(`SQL==>`, sql);
  const rows = await db.query(sql);
  console.error(`rows==>`, rows);
  const data = helper.emptyOrRows(rows);
  const meta = {page};
  message = 'Device event list Fetching successfully';
  responsecode = "807"

  return {
    responsecode,
    message,
    data,
    meta
  }
}

//add the custom message for event
// ###############################################################################################################################################################################################
// ###############################################################################################################################################################################################
// ###############################################################################################################################################################################################

async function addCustomMessage(event){
  try{
    if(event.hasOwnProperty('STOKEN')==false){
      return helper.getErrorResponse(false,"Login sessiontoken missing. Please provide the Login sessiontoken","EVENT ADD CUSTOM MESSAGE","");
    }
    //CHECK IF THE SESSIONTOKEN SIZE IS VALID OR NOT
    if(event.STOKEN.length > 50 || event.STOKEN.length  < 30){
      return helper.getErrorResponse(false,"Login sessiontoken size invalid. Please provide the valid Sessiontoken","EVENT ADD CUSTOM MESSAGE","");
    }
    // CHECK IF THE GIVEN SESSIONTOKEN IS VALID OR NOT
    const [result] =await db.spcall('CALL SP_STOKEN_CHECK(?,@result,@custid,@custname,@custemail); select @result,@custid,@custname,@custemail',[event.STOKEN]);
    const objectvalue = result[1][0];
    const userid = objectvalue["@result"];
    // // console("event list userid ->"+ userid);
    if(userid == null){
      return helper.getErrorResponse(false,"Login sessiontoken Invalid. Please provide the valid sessiontoken","EVENT ADD CUSTOM MESSAGE","");
    }
    var secret = event.STOKEN.substring(0,16);
    // // console("secret ->"+secret);

  if(event.hasOwnProperty('querystring')==false){
    return helper.getErrorResponse(false,"Querystring missing.","EVENT ADD CUSTOM MESSAGE","");
  }

  // // console("event querystring ->"+event.querystring);
  var querydata;
  try{ 
     querydata = await helper.decrypt(event.querystring,secret);
    //  // console("decrypted querydata->"+querydata);
  }
  catch(ex){
    return helper.getErrorResponse(false,"Querystring Invalid. Please provide the valid querystring","EVENT ADD CUSTOM MESSAGE",secret);
  }
  try{
    querydata= JSON.parse(querydata);
  }
  catch(ex){
    return helper.getErrorResponse(false,"Querystring JSON error.","EVENT ADD CUSTOM MESSAGE",secret);
  }

  if(querydata.hasOwnProperty('message')==false){
    return helper.getErrorResponse(false,"Message missing","The customer event custom message is missing",secret);
  }

  const [result1] = await db.spcall('CALL SP_ADD_EVENT_MESSAGE(?,?,?);',[querydata.message,1,userid]);
  if(result1.affectedRows){
    return helper.getSuccessResponse(true,"The custom message was added successfully",querydata.message,secret);
  }
  else{
    return helper.getErrorResponse(false,"Error while adding event custom message",secret);
  }
}catch(er){
  if(er.code == 'ER_DUP_ENTRY'){
    return helper.getErrorResponse(false,"Feedback already exists.",er,secret);
  }else
  return helper.getErrorResponse(false,"Internal error. Please contact Administration",er,secret);
}
} 
// ###############################################################################################################################################################################################
// ###############################################################################################################################################################################################
// ###############################################################################################################################################################################################

// GET THE EVENT PAGE CUSTOM MESSAGE
async function getCustomMessage(event){
  try{
  //CHECK IF THE SESSIONTOKEN IS GIVEN AS AN INPUT OR NOT
  if(event.hasOwnProperty('STOKEN')==false){
    return helper.getErrorResponse(false,"Login sessiontoken missing","EVENT GET CUSTOM MESSAGE","");
  }
  //check if the sessiontoken size is valid or nor
  // // console("Session ->"+event.STOKEN);
  if(event.STOKEN.length < 30 || event.STOKEN.length > 50){
    return helper.getErrorResponse(false,"Login sessiontoken size errro.","EVENT GET CUSTOM MESSAGE","");
  }
  //CHECK IF THE SESSIONTOKEN IS VALID OR NOT
  const [result] = await db.spcall('CALL SP_STOKEN_CHECK(?,@result,@custid,@custname,@custemail); select @result,@custid,@custname,@custemail;',[event.STOKEN]);
  const objectvalue = result[1][0];
  const userid = objectvalue["@result"];
  // // console("get custom  message userid-> "+userid);
  if(userid == null ){
    return helper.getErrorResponse(false,"Login sessiontoken Invalid. Please provide the valid sessiontoken","EVENT GET CUSTOM MESSAGE","");
  }
   
  var secret = event.STOKEN.substring(0,16);
  // // console("secret ->"+secret);
  
  let sql="";
  let rows ="";
  
  sql=`SELECT message_id,message from custommessages`;
  rows = await db.query(sql);

  
  if (rows!="")
  { 
    const data = JSON.stringify(helper.emptyOrRows(rows));
    // // console(data);
    return helper.getSuccessResponse(true,"The Event Custom Message list Fetched Successfully",data,secret);
  }
  else
  {
    return helper.getErrorResponse(true,"The Event Custom Message list Fetched Successfully",data,secret);
  }
}catch(er){
  return helper.getErrorResponse(false,"Internal error. Please contact Adminstration",er,secret);
}
}
// ###############################################################################################################################################################################################
//################################# GET EVENT LIST #############################################################################################################################################

// async function getEventAction(page, event){
//    try {
//     if (!event.hasOwnProperty('STOKEN')) {
//       return helper.getErrorResponse(false, "Login sessiontoken missing", "GET EVENT INFO", "");
//     }

//     if (event.STOKEN.length > 50 || event.STOKEN.length < 30) {
//       return helper.getErrorResponse(false, "Login sessiontoken size Invalid", "GET EVENT INFO", "");
//     }

//     const [result] = await db.spcall('CALL SP_STOKEN_CHECK(?,@result,@custid,@custname,@custemail); select @result,@custid,@custname,@custemail', [event.STOKEN]);
//     const objectvalue = result[1][0];
//     const userid = objectvalue["@result"];

//     if (userid == null) {
//       return helper.getErrorResponse(false,"Login sessiontoken Invalid. Please provide the valid sessiontoken", "GET EVENT INFO", "");
//     }

//     if (!event.hasOwnProperty("querystring")) {
//       return helper.getErrorResponse(false, "Querystring missing. Please provide the querystring", "GET EVENT INFO", "");
//     }

//     const secret = event.STOKEN.substring(0, 16);
//     let querydata;

//     try {
//       querydata = await helper.decrypt(event.querystring, secret);
//     } catch (ex) {
//       return helper.getErrorResponse(false, "Querystring Invalid error", "GET EVENT INFO", secret);
//     }

//     try {
//       querydata = JSON.parse(querydata);
//     } catch (ex) {
//       return helper.getErrorResponse(false, "Querystring Invalid. Please provide the valid Querystring", "GET EVENT INFO", secret);
//     }

//     const offset = helper.getOffset(page, config.listPerPage);

//     if (!querydata.hasOwnProperty('eventid')) {
//       return helper.getErrorResponse(false, "Event id missing. Please provide the userid", "Please enter the user id for the device event", secret);
//     }

//     let sql = `SELECT 
//     em.Event_ID, em.Event_Name, bm.whatsappgroupname, em.Row_updated_date,DATE_FORMAT(em.enddate, '%Y-%m-%d %H:%i:%s') AS eventtime,el.feedback,el.Created_by,em.Alertmessage, em.IsHumanDetected,
//     cm.camera_id, cm.camera_name, dm.device_name, dm.IP_Domain, dm.RTSP_port, dm.IP_port, dm.IP_Uname, dm.IP_Pwd, dm.short_name, dm.SDK_ID, dm.device_id, dt.Dept_name, 
//     dt.Dept_Location, dc.Name1, dc.Contact_mobile1, dc.Contact_Email1,bm.Branch_id,bm.Branch_name,bm.site_starttime,bm.contact_person,eu.user_id,cm.Camera_Status, es.eventpath,CASE WHEN EXISTS (SELECT 1 FROM ecsmaster ec WHERE ec.site_id = bm.branch_id and status = 1 and ECStype = 'Two way') THEN TRUE
//     ELSE FALSE END AS twoway_status,CASE WHEN EXISTS (SELECT 1 FROM ecsmaster ec WHERE ec.site_id = bm.branch_id and status = 1 and ECStype = 'PA system') THEN TRUE
//     ELSE FALSE END AS oneway_status FROM eventmaster em LEFT JOIN eventlog el ON el.Event_id = em.Event_id LEFT JOIN 
//     eventstatus es ON es.Event_id = em.Event_ID LEFT JOIN eventuser eu ON eu.Event_id = em.Event_id JOIN cameramaster cm ON cm.camera_id = em.analyticsource_id JOIN devicemaster dm ON dm.device_id = cm.device_id JOIN 
//     deptmaster dt ON dt.dept_id = dm.dept_id LEFT JOIN deptcontacts dc ON dc.dept_id = dt.dept_id JOIN branchmaster bm ON bm.branch_id = dt.branch_id WHERE em.Event_ID = ${querydata.eventid} LIMIT 1;`;

//     const rows = await db.query(sql);
//     const data = helper.emptyOrRows(rows);
//     const eventLinks = data.map(event => ({
//       Event_ID: event.Event_ID,
//       Event_Name: event.Event_Name,
//       whatsappgroupname: event.whatsappgroupname,
//       eventtime: event.eventtime,
//       Alertmessage: event.Alertmessage,
//       cameraid: event.camera_id,
//       cameraname: event.camera_name,
//       IpDomain: event.IP_Domain,
//       IpPort: event.IP_port,
//       username: event.IP_Uname,
//       password: event.IP_Pwd,
//       devicename: event.device_name,
//       SDK_ID: event.SDK_ID,
//       deviceid: event.device_id,
//       deptname: event.Dept_name,
//       Dept_Location: event.Dept_Location,
//       Name1: event.Name1,
//       Contact_mobile1: event.Contact_mobile1,
//       Contact_Email1: event.Contact_Email1,
//       Branch_name: event.Branch_name,
//       device_name: event.device_name,
//       Camera_Status: event.Camera_Status,
//       Imageurl: event.eventpath,
//       Notifytime:event.site_starttime,
//       siteid: event.Branch_id,
//       twoway_status: event.twoway_status,
//       oneway_status:event.oneway_status,
//       feedback: event.feedback,
//       userid:event.Created_by
//     }));

//     const meta = { page };
//     if(eventLinks != '' && eventLinks != null){
//     return helper.getSuccessResponse(true, "Event info fetched successfully", eventLinks, secret);
//     }else{
//       return helper.getErrorResponse(false, 'No events Found',eventLinks , secret);
//     }
//   } catch (er) {
//     return helper.getErrorResponse(false, 'Internal error. Please contact Administration', er, "");
//   }
// }

async function getEventAction(page, event) {
  try {
    if (!event.hasOwnProperty('STOKEN')) {
      return helper.getErrorResponse(false, "Login sessiontoken missing", "GET EVENT INFO", "");
    }

    if (event.STOKEN.length > 50 || event.STOKEN.length < 30) {
      return helper.getErrorResponse(false, "Login sessiontoken size Invalid", "GET EVENT INFO", "");
    }

    const [result] = await db.spcall('CALL SP_STOKEN_CHECK(?,@result,@custid,@custname,@custemail); select @result,@custid,@custname,@custemail', [event.STOKEN]);
    const objectvalue = result[1][0];
    const userid = objectvalue["@result"];

    if (userid == null) {
      return helper.getErrorResponse(false, "Login sessiontoken Invalid. Please provide the valid sessiontoken", "GET EVENT INFO", "");
    }

    if (!event.hasOwnProperty("querystring")) {
      return helper.getErrorResponse(false, "Querystring missing. Please provide the querystring", "GET EVENT INFO", "");
    }

    const secret = event.STOKEN.substring(0, 16);
    let querydata;

    try {
      querydata = await helper.decrypt(event.querystring, secret);
    } catch (ex) {
      return helper.getErrorResponse(false, "Querystring Invalid error", "GET EVENT INFO", secret);
    }

    try {
      querydata = JSON.parse(querydata);
    } catch (ex) {
      return helper.getErrorResponse(false, "Querystring Invalid. Please provide the valid Querystring", "GET EVENT INFO", secret);
    }

    if (!querydata.hasOwnProperty('eventid')) {
      return helper.getErrorResponse(false, "Event id missing. Please provide the userid", "GET EVENT INFO", secret);
    }

    let sql = `SELECT em.Event_ID, em.Event_Name, bm.whatsappgroupname, em.Row_updated_date, 
      DATE_FORMAT(em.enddate, '%Y-%m-%d %H:%i:%s') AS eventtime, el.feedback, el.Created_by, em.Alertmessage, 
      em.IsHumanDetected, cm.camera_id, cm.camera_name, dm.device_name, dm.IP_Domain, dm.RTSP_port, dm.IP_port, 
      dm.IP_Uname, dm.IP_Pwd, dm.short_name, dm.SDK_ID, dm.device_id, dt.Dept_name, dt.Dept_Location, 
      dc.Name1,dc.Name2,dc.Name3, dc.Contact_mobile1, dc.Contact_mobile2, dc.Contact_mobile3, dc.Contact_Email1, dc.Contact_Email2, dc.Contact_Email3, dc.User_role1, dc.User_role2, dc.User_role3, bm.Branch_id, bm.Branch_name, bm.site_starttime, 
      bm.contact_person, eu.user_id, cm.Camera_Status, es.eventpath,
      CASE WHEN EXISTS (SELECT 1 FROM ecsmaster ec WHERE ec.site_id = bm.branch_id AND status = 1 AND ECStype = 'Two way') THEN TRUE ELSE FALSE END AS twoway_status,
      CASE WHEN EXISTS (SELECT 1 FROM ecsmaster ec WHERE ec.site_id = bm.branch_id AND status = 1 AND ECStype = 'PA system') THEN TRUE ELSE FALSE END AS oneway_status 
      FROM eventmaster em 
      LEFT JOIN eventlog el ON el.Event_id = em.Event_id 
      LEFT JOIN eventstatus es ON es.Event_id = em.Event_ID 
      LEFT JOIN eventuser eu ON eu.Event_id = em.Event_id 
      JOIN cameramaster cm ON cm.camera_id = em.analyticsource_id 
      JOIN devicemaster dm ON dm.device_id = cm.device_id 
      JOIN deptmaster dt ON dt.dept_id = dm.dept_id 
      LEFT JOIN deptcontacts dc ON dc.dept_id = dt.dept_id 
      JOIN branchmaster bm ON bm.branch_id = dt.branch_id 
      WHERE em.Event_ID = ? LIMIT 1;`;

    const rows = await db.query(sql, [querydata.eventid]);
    const data = helper.emptyOrRows(rows);

    const eventLinks = await Promise.all(
      data.map(async (event) => {
        let eventPath = event.eventpath;
        if (!eventPath) {
          const result = await db.query1(
            `SELECT detected_file FROM eventaistatus WHERE Event_ID = ?`, 
            [event.Event_ID]
          );
          if (result.length > 0) {
            eventPath = result[0].detected_file;
          }
        }

        return {
          Event_ID: event.Event_ID,
          Event_Name: event.Event_Name,
          whatsappgroupname: event.whatsappgroupname,
          eventtime: event.eventtime,
          Alertmessage: event.Alertmessage,
          cameraid: event.camera_id,
          cameraname: event.camera_name,
          IpDomain: event.IP_Domain,
          IpPort: event.IP_port,
          username: event.IP_Uname,
          password: event.IP_Pwd,
          devicename: event.device_name,
          SDK_ID: event.SDK_ID,
          deviceid: event.device_id,
          deptname: event.Dept_name,
          Dept_Location: event.Dept_Location,
          Name1: event.Name1,
          Contact_mobile1: event.Contact_mobile1,
          Contact_Email1: event.Contact_Email1,
          Branch_name: event.Branch_name,
          device_name: event.device_name,
          Camera_Status: event.Camera_Status,
          Imageurl: eventPath,
          Notifytime: event.site_starttime,
          siteid: event.Branch_id,
          twoway_status: event.twoway_status,
          oneway_status: event.oneway_status,
          feedback: event.feedback,
          userid: event.Created_by,
          Name2: event.Name2,
          Contact_mobile2: event.Contact_mobile2,
          Contact_Email2: event.Contact_Email2,
          Name3: event.Name3,
          Contact_mobile3: event.Contact_mobile3, 
          Contact_Email3: event.Contact_Email3,
          Userrole1: event.User_role1,
          Userrole2: event.User_role2,
          Userrole3: event.User_role3,
        };
      })
    );

    if (eventLinks.length > 0) {
      return helper.getSuccessResponse(true, "Event info fetched successfully", eventLinks, secret);
    } else {
      return helper.getErrorResponse(false, 'No events Found', eventLinks, secret);
    }
  } catch (er) {
    return helper.getErrorResponse(false, 'Internal error. Please contact Administration', er, "");
  }
}



//####################################################################################################################################################################################################################
//########################## GET EVENT PROPERTIES ####################################################################################################################################################################
//###################################################################################################################################################################################################################.

async function getEventProperty( event){
  //CHECK IF THE SESSIONTOKEN SIZE IS VALID OR NOT
  if(event.STOKEN.length > 50 || event.STOKEN.length  < 30){
    return helper.getErrorResponse("SESSIONTOKEN_SIZE_ERROR","CUSTOMER GET EVENT PROPERTY","");
  }
  // CHECK IF THE GIVEN SESSIONTOKEN IS VALID OR NOT
  const [result] =await db.spcall('CALL SP_STOKEN_CHECK(?,@result,@custid,@custname,@custemail); select @result,@custid,@custname,@custemail',[event.STOKEN]);
  const objectvalue = result[1][0];
  const userid = objectvalue["@result"];
  // // console("event PROPERTY userid ->"+ userid);
  if(userid == null){
    return helper.getErrorResponse("LOGIN_SESSIONTOKEN_ERROR","CUSTOMER GET EVENT PROPERTY","");
  }
  //CHECK IF THE SESSIONTOKEN IS GIVEN AS AN INPUT OR NOT
  if(event.hasOwnProperty('STOKEN')==false){
    return helper.getErrorResponse("LOGIN_SESSIONTOKEN_MISSING","CUSTOMER GET EVENT PROPERTY","");
  }
  //BEGIN VALIDATION 2
  // CHECK IF THE QUERYSTRING IS GIVEN AS AN INPUT
  if(event.hasOwnProperty("querystring")==false){
    return helper.getErrorResponse("EVENT_PACKAGE_QUERY_MISSING","CUSTOMER GET EVENT PROPERTY","");
  }
  var secret=event.STOKEN.substring(0,16);
  // console("secret-->"+secret);
  // console("event querystring ->"+ event.querystring);
  var querydata;
  
  try{ 
     querydata = await helper.decrypt(event.querystring,secret);
     // console("decrypted querydata->"+querydata);
  }
  catch(ex){
    return helper.getErrorResponse("EVENT_PACKAGE_QUERY_ERROR","CUSTOMER GET EVENT PROPERTY",secret);
  }
  try{
    querydata= JSON.parse(querydata);
  }
  catch(ex){
    return helper.getErrorResponse("CUST_CONTACT_JSON_ERROR","CUSTOMER GET EVENT PROPERTY",secret);
  }

  if(querydata.hasOwnProperty('eventid')==false){
    return helper.getErrorResponse("DEVICE_EVENT_ID_MISSING","The customer Event id is missing . Please the Event ID.",secret);
  }
  let sql ='';
  let rows='';
 sql=`SELECT cm.Camera_name,cm.Camera_ID,dm.Device_name,bm.city,em.Event_ID,em.Event_Name,
      em.Event_Name,em.Row_updated_date,cm.Status,em.Alertmessage FROM eventmaster em, cameramaster cm,devicemaster dm,deptmaster dt,branchmaster bm WHERE cm.Camera_ID = em.AnalyticSource_ID
       AND dm.Device_ID = cm.Device_ID AND dt.dept_id = dm.Dept_ID AND bm.branch_id = dt.branch_id AND em.Event_ID= ${querydata.eventid};`;
 rows = await db.query(sql);
 const data = JSON.stringify(helper.emptyOrRows(rows));
 // console(data);
 if(data == null){
  return helper.getErrorResponse("EVENT_LIST_FETCHING_ERROR","Error while fetching the event list. ",secret);
 }

 const cameraid = rows[0].Camera_ID;
 // console("camera_id ->" + cameraid);
 // console("dateformat ->"+ rows[0].Row_updated_date);
 
// console("start time -> " + starttime.toISOString());
  // console("end time -> " + endtime.toISOString());

  // Format start time and end time as required
  const formattedStartTimeDahua = formatDateDahua(starttime);
  const formattedEndTimeDahua = formatDateDahua(endtime);

  const formattedStartTimeHikvision = formatDateHikvision(starttime);
  const formattedEndTimeHikvision = formatDateHikvision(endtime);

  // console("formatted start time (Dahua) -> " + formattedStartTimeDahua);
  // console("formatted end time (Dahua) -> " + formattedEndTimeDahua);

  // console("formatted start time (Hikvision) -> " + formattedStartTimeHikvision);
  // console("formatted end time (Hikvision) -> " + formattedEndTimeHikvision);

  function formatDateDahua(date) {
    return (
      date.getUTCFullYear() +
      "_" +
      padZero(date.getUTCMonth() + 1) +
      "_" +
      padZero(date.getUTCDate()) +
      "_" +
      padZero(date.getUTCHours()) +
      "_" +
      padZero(date.getUTCMinutes()) +
      "_" +
      padZero(date.getUTCSeconds()) + "i"
    );
  }

  function formatDateHikvision(date) {
    return (
      date.getUTCFullYear() +
      padZero(date.getUTCMonth() + 1) +
      padZero(date.getUTCDate()) +
      "T" +
      padZero(date.getUTCHours()) +
      padZero(date.getUTCMinutes()) +
      padZero(date.getUTCSeconds()) +
      "z"
    );
  }

  function padZero(num) {
    return num.toString().padStart(2, "0");
  }

 let sql1 ='';
 let rows1 = '';
 let data1 = '';
 var MainRTSPUrl="";
 var SubRTSPUrl="";
 var playbackurl = "";
if(cameraid != null){
 sql1=`SELECT cm.camera_id,cm.camera_name,cm.Camera_Streaming_URL,dm.Device_name,dm.SDK_ID,dm.IP_Domain,dm.IP_Port,dm.RTSP_Port,dm.IP_Uname,dm.IP_Pwd,dm.Device_Type FROM cameramaster cm,
 devicemaster dm where dm.device_id=cm.device_id and cm.camera_id=${cameraid}`;
 console.error(`SQL data==>`, sql1);
    if (sql1!="")
    {
       rows1 = await db.query(sql1);      
       data1 = helper.emptyOrRows(rows1);
      var ts = Date.now();// console(ts+"Domain/IP=>",data1[0].IP_Domain);
      var ip_address = data1[0].IP_Domain;
      var username = data1[0].IP_Uname;
      var password=data1[0].IP_Pwd;
      var rport=data1[0].RTSP_Port;
      var devicetype = data1[0].Device_Type;
      var camera_no=data1[0].camera_name;
      var camera_id=data1[0].camera_id;
      camera_no=camera_no.replace("Channel","");
      if(data1[0].SDK_ID =='1'){
           MainRTSPUrl = "rtsp://"+username+":"+password+"@"+ip_address+":"+rport+ "/Streaming/Channels/"+camera_no+"01"; 
           SubRTSPUrl = "rtsp://"+username+":"+password+"@"+ip_address+":"+rport+ "/Streaming/Channels/"+camera_no+"02"; 
           playbackurl  ="rtsp://"+username+":"+password+"@"+ip_address+":"+rport+"/Streaming/tracks/"+camera_no+"01?starttime=" +formattedStartTimeHikvision+ "z&endtime=" +formattedEndTimeHikvision+ "z";
      }
      else if(data1[0].SDK_ID =='2'){
            MainRTSPUrl = "rtsp://"+username+":"+password+"@"+ip_address+":"+rport+"/cam/realmonitor?channel="+camera_no+"&subtype=0";
            SubRTSPUrl = "rtsp://"+username+":"+password+"@"+ip_address+":"+rport+"/cam/realmonitor?channel="+camera_no+"&subtype=1";
            playbackurl ="rtsp://"+username+":"+password+"@"+ip_address+":"+rport+"/cam/playback?channel="+camera_no+"&starttime=" +formattedStartTimeDahua+ "&endtime=" +formattedEndTimeDahua;
          }
        
      // console("MAIN RTSP URL-> "+MainRTSPUrl);
      // console("SUB RTSP URL -> "+ SubRTSPUrl);
      // console("Playback url ->"+playbackurl);
      if(MainRTSPUrl == null){
        return helper.getErrorResponse("ERROR_FETCHING_RTSPURL","Error while fetching the RTSP url for the camera", secret);
      }
      if(playbackurl == null){
        return helper.getErrorResponse("ERROR_FETCHING_PLAYBACK_URL","Error while fetching the video playback url",secret);
      }
}
}
if(MainRTSPUrl != null && playbackurl != null && data != null){
   let successmessage = "The Event list Properties Fetched Successfully.";
   let successcode = "EVENT_PROPERTY_FETCHED_SUCCESSFULLY";
      const encrypt = helper.encrypt(JSON.stringify({
        successcode,
        successmessage,
        MainRTSPUrl,
        SubRTSPUrl,
        playbackurl,
        data }), secret);
    return encrypt;
//  return {
//   successmessage,
//   successcode,
//   RTSPUrl,
//   playbackurl,
//   data
//  }
}
else{
  let errormessage = "Error while fetching the Event list properties.";
  let errorcode = 7004;
  return helper.getErrorResponse(errorcode,errormessage,secret);
}

 }

//###################################################################################################################################################################################################
//######################## ADD EVENT FEEDBACK TO THE EVENT LOG ###########################################################################################################################################################################
//###################################################################################################################################################################################################
// async function addEventFeedback(event) {
//   try {
//     //CHECK IF THE SESSIONTOKEN IS GIVEN AS AN INPUT OR NOT
//     if (!event.hasOwnProperty('STOKEN')) {
//       return helper.getErrorResponse(false, "Login sessiontoken missing.", "CUSTOMER ADD EVENT FEEDBACK", "");
//     }

//     //CHECK IF THE SESSIONTOKEN SIZE IS VALID OR NOT
//     if (event.STOKEN.length > 50 || event.STOKEN.length < 30) {
//       return helper.getErrorResponse(false, "Login sessiontoken Size Error.", "CUSTOMER ADD EVENT FEEDBACK", "");
//     }

//     // CHECK IF THE GIVEN SESSIONTOKEN IS VALID OR NOT
//     const [result] = await db.spcall('CALL SP_STOKEN_CHECK(?,@result,@custid,@custname,@custemail); select @result,@custid,@custname,@custemail', [event.STOKEN]);
//     const objectvalue = result[1][0];
//     const userid = objectvalue["@result"];
//     // console("event feedback userid ->" + userid);

//     if (userid == null) {
//       return helper.getErrorResponse(false, "Login sessiontoken Invalid", "CUSTOMER ADD EVENT FEEDBACK", "");
//     }

//     //BEGIN VALIDATION 2
//     // CHECK IF THE QUERYSTRING IS GIVEN AS AN INPUT
//     if (!event.hasOwnProperty("querystring")) {
//       return helper.getErrorResponse(false, "Querystring missing.", "CUSTOMER ADD EVENT FEEDBACK", "");
//     }

//     let secret = event.STOKEN.substring(0, 16);
//     // console("secret-->" + secret);
//     // console("event querystring ->" + event.querystring);

//     let querydata;
//     try {
//       querydata = await helper.decrypt(event.querystring, secret);
//       // console("decrypted querydata->" + querydata);
//     } catch (ex) {
//       return helper.getErrorResponse(false, "Querystring error", "CUSTOMER ADD EVENT FEEDBACK", secret);
//     }

//     let events;
//     try {
//       events = JSON.parse(querydata);
//     } catch (ex) {
//       return helper.getErrorResponse(false, "Querystring JSON error", "CUSTOMER ADD EVENT FEEDBACK", secret);
//     }

//     // Ensure events is an array for consistency
//     if (!Array.isArray(events)) {
//       events = [events];
//     }

//     let allResults = [];

//     for (let evt of events) { // use evt to avoid name collision
//       if (!evt.hasOwnProperty('eventid')) {
//         allResults.push({ code: false, message: "The customer Event ID is missing. Please provide the Event ID.", module: "CUSTOMER ADD EVENT FEEDBACK"});
//         continue;
//       }

//       if (!evt.hasOwnProperty('feedback')) {
//         allResults.push({ code: false, message: "The customer event feedback is missing", module: "CUSTOMER ADD EVENT FEEDBACK" });
//         continue;
//       }

//       if (!evt.hasOwnProperty('flag')) {
//         allResults.push({ code: 'EVENT_FLAG_MISSING', message: "The Customer event flag is missing. Please enter the flag", module: "CUSTOMER ADD EVENT FEEDBACK" });
//         continue;
//       }

//       const [result1] = await db.spcall('CALL SP_UPDATE_EVENT_LOG(?,?,?,?);', [evt.eventid, evt.flag, evt.feedback, userid]);

//       if (result1.affectedRows) {
//         allResults.push({ code: true, message: "The customer event log added successfully", feedback: evt.feedback, module: "CUSTOMER ADD EVENT FEEDBACK" });
//       } else {
//         allResults.push({ code: "EVENT_LOG_ADD_FAILED", message: "Error while adding the event log. Please check the details and re-enter it correctly", module: "CUSTOMER ADD EVENT FEEDBACK" });
//       }
//     }
//      var allResults1 =  helper.encrypt(JSON.stringify(allResults),secret);
//      return allResults1;
//     let returnstr = JSON.stringify(allResults);

//     try {
//       if (secret != "") {
//         const encryptedResponse = helper.encrypt(returnstr, secret);
//         // console("returnstr=>" + JSON.stringify(encryptedResponse));
//         return { encryptedResponse };
//       } else {
//         return allResults;
//       }
//     } catch (ex) {
//       return allResults;
//     }
//   } catch (er) {
//     return helper.getErrorResponse(false, "Internal error. Please contact Administration", er.message);
//   }
// }
// async function addEventFeedback(event) {
//   try {
//     //CHECK IF THE SESSIONTOKEN IS GIVEN AS AN INPUT OR NOT
//     if (!event.hasOwnProperty('STOKEN')) {
//       return helper.getErrorResponse(false, "Login sessiontoken missing.", "CUSTOMER ADD EVENT FEEDBACK", "");
//     }

//     //CHECK IF THE SESSIONTOKEN SIZE IS VALID OR NOT
//     if (event.STOKEN.length > 50 || event.STOKEN.length < 30) {
//       return helper.getErrorResponse(false, "Login sessiontoken Size Error.", "CUSTOMER ADD EVENT FEEDBACK", "");
//     }

//     // CHECK IF THE GIVEN SESSIONTOKEN IS VALID OR NOT
//     const [result] = await db.spcall('CALL SP_STOKEN_CHECK(?,@result,@custid,@custname,@custemail); select @result,@custid,@custname,@custemail', [event.STOKEN]);
//     const objectvalue = result[1][0];
//     const userid = objectvalue["@result"];
//     // console("event feedback userid ->" + userid);

//     if (userid == null) {
//       return helper.getErrorResponse(false,"Login sessiontoken Invalid. Please provide the valid sessiontoken", "CUSTOMER ADD EVENT FEEDBACK", "");
//     }

//     //BEGIN VALIDATION 2
//     // CHECK IF THE QUERYSTRING IS GIVEN AS AN INPUT
//     if (!event.hasOwnProperty("querystring")) {
//       return helper.getErrorResponse(false, "Querystring missing.", "CUSTOMER ADD EVENT FEEDBACK", "");
//     }

//     let secret = event.STOKEN.substring(0, 16);
//     // console("secret-->" + secret);
//     // console("event querystring ->" + event.querystring);

//     let querydata;
//     try {
//       querydata = await helper.decrypt(event.querystring, secret);
//       // console("decrypted querydata->" + querydata);
//     } catch (ex) {
//       return helper.getErrorResponse(false, "Querystring error", "CUSTOMER ADD EVENT FEEDBACK", secret);
//     }

//     let events;
//     try {
//       events = JSON.parse(querydata);
//     } catch (ex) {
//       return helper.getErrorResponse(false, "Querystring JSON error", "CUSTOMER ADD EVENT FEEDBACK", secret);
//     }

//     // Ensure events is an array for consistency
//     if (!Array.isArray(events)) {
//       events = [events];
//     }

//     let allResults = [];

//     for (let evt of events) { // use evt to avoid name collision
//       if (!evt.hasOwnProperty('eventid')) {
//         allResults.push({ code: false, message: "The customer Event ID is missing. Please provide the Event ID.", module: "CUSTOMER ADD EVENT FEEDBACK"});
//         continue;
//       }

//       if (!evt.hasOwnProperty('feedback')) {
//         allResults.push({ code: false, message: "The customer event feedback is missing", module: "CUSTOMER ADD EVENT FEEDBACK",eventid:evt.eventid});
//         continue;
//       }

//       if (!evt.hasOwnProperty('flag')) {
//         allResults.push({ code: 'EVENT_FLAG_MISSING', message: "The Customer event flag is missing. Please enter the flag", module: "CUSTOMER ADD EVENT FEEDBACK" ,eventid:evt.eventid});
//         continue;
//       }
//       let sql;
//       if (evt.eventid.startsWith('S1_')) {
//         const numericId = evt.eventid.replace(/^S1_/, '');
//         [sql] = await db.spcall1(`CALL SP_UPDATE_EVENT_LOG(?,?,?,?);`, [numericId, evt.flag, evt.feedback, userid]);
//       } else if (evt.eventid.startsWith('S2_')) {
//         const numericId = evt.eventid.replace(/^S2_/, '');
//         [sql] = await db.spcall(`CALL SP_UPDATE_EVENT_LOG(?,?,?,?);`, [numericId, evt.flag, evt.feedback, userid]);
//       } else {    // Determine which SQL procedure to call based on the eventid prefix
//         [sql] = await db.spcall(`CALL SP_UPDATE_EVENT_LOG(?,?,?,?);`, [evt.eventid, evt.flag, evt.feedback, userid]);
//        }
//       // const [result1] = await db.spcall('CALL SP_UPDATE_EVENT_LOG(?,?,?,?);', [evt.eventid, evt.flag, evt.feedback, userid]);

//       if (sql.affectedRows) {
//         allResults.push({ code: true, message: "The customer event log added successfully", feedback: evt.feedback, module: "CUSTOMER ADD EVENT FEEDBACK",eventid:evt.eventid });
//       } else {
//         allResults.push({ code: "EVENT_LOG_ADD_FAILED", message: "Error while adding the event log. Please check the details and re-enter it correctly", module: "CUSTOMER ADD EVENT FEEDBACK",eventid:evt.eventid });
//       }
//     }

//     // Prepare the final object to be encrypted
//     const responseObject = { allResults };

//     // Encrypt the entire response object
//     const encryptedResponse = helper.encrypt(JSON.stringify(responseObject), secret);

//     // Return the encrypted response
//     return { encryptedResponse };

//   } catch (er) {
//     return helper.getErrorResponse(false, "Internal error. Please contact Administration", er.message);
//   }
// }

//###################################################################################################################################################################################################
//#####################  ADD EVENT WHATSAPP LOG ############################################################################################################################################################################
//####################################################################################################################################################################################################

// async function addEventFeedback(event) {
//   try {
//     //CHECK IF THE SESSIONTOKEN IS GIVEN AS AN INPUT OR NOT
//     if (!event.hasOwnProperty('STOKEN')) {
//       return helper.getErrorResponse(false, "Login sessiontoken missing.", "CUSTOMER ADD EVENT FEEDBACK", "");
//     }

//     //CHECK IF THE SESSIONTOKEN SIZE IS VALID OR NOT
//     if (event.STOKEN.length > 50 || event.STOKEN.length < 30) {
//       return helper.getErrorResponse(false, "Login sessiontoken Size Error.", "CUSTOMER ADD EVENT FEEDBACK", "");
//     }

//     // CHECK IF THE GIVEN SESSIONTOKEN IS VALID OR NOT
//     const [result] = await db.spcall('CALL SP_STOKEN_CHECK(?,@result,@custid,@custname,@custemail); select @result,@custid,@custname,@custemail', [event.STOKEN]);
//     const objectvalue = result[1][0];
//     const userid = objectvalue["@result"];
//     // // console("event feedback userid ->" + userid);

//     if (userid == null) {
//       return helper.getErrorResponse(false, "Login sessiontoken Invalid", "CUSTOMER ADD EVENT FEEDBACK", "");
//     }

//     //BEGIN VALIDATION 2
//     // CHECK IF THE QUERYSTRING IS GIVEN AS AN INPUT
//     if (!event.hasOwnProperty("querystring")) {
//       return helper.getErrorResponse(false, "Querystring missing.", "CUSTOMER ADD EVENT FEEDBACK", "");
//     }

//     let secret = event.STOKEN.substring(0, 16);
//     // // console("secret-->" + secret);
//     // // console("event querystring ->" + event.querystring);

//     let querydata;
//     try {
//       querydata = await helper.decrypt(event.querystring, secret);
//       // // console("decrypted querydata->" + querydata);
//     } catch (ex) {
//       return helper.getErrorResponse(false, "Querystring error", "CUSTOMER ADD EVENT FEEDBACK", secret);
//     }

//     let evtData;
//     try {
//       evtData = JSON.parse(querydata);
//     } catch (ex) {
//       return helper.getErrorResponse(false, "Querystring JSON error", "CUSTOMER ADD EVENT FEEDBACK", secret);
//     }

//     // Check if eventid, feedback, and flag are present
//     if (!evtData.hasOwnProperty('eventid')) {
//       return helper.getErrorResponse(false, "Event ID missing. Please provide a valid Event ID.", "CUSTOMER ADD EVENT FEEDBACK", "");
//     }

//     if (!evtData.hasOwnProperty('feedback')) {
//       return helper.getErrorResponse(false, "Feedback missing. Please provide feedback.", "CUSTOMER ADD EVENT FEEDBACK", "");
//     }

//     if (!evtData.hasOwnProperty('flag')) {
//       return helper.getErrorResponse(false, "Flag missing. Please provide the flag.", "CUSTOMER ADD EVENT FEEDBACK", "");
//     }

//     // Ensure eventid is an array, if not, make it an array
//     let eventIds = Array.isArray(evtData.eventid) ? evtData.eventid : [evtData.eventid];
//     let allResults = [];

//     // Process each eventid
//     for (let eventid of eventIds) {
//       const [result1] = await db.spcall('CALL SP_UPDATE_EVENT_LOG(?,?,?,?);', [eventid, evtData.flag, evtData.feedback, userid]);

//       if (result1.affectedRows) {
//         allResults.push({ code: true, message: "The customer event log added successfully", eventid: eventid, module: "CUSTOMER ADD EVENT FEEDBACK" });
//       } else {
//         allResults.push({ code: false, message: `Event ID ${eventid}: Error while adding the event log. Please check the details and re-enter correctly.`, module: "CUSTOMER ADD EVENT FEEDBACK" });
//       }
//     }

//     // Encrypt the results and return
//     const encryptedResponse = helper.encrypt(JSON.stringify(allResults), secret);
//     return {encryptedResponse}
//   } catch (er) {
//     return helper.getErrorResponse(false, "Internal error. Please contact Administration", er.message);
//   }
// }

async function addEventFeedback(event) {
  try {
    if (!event.hasOwnProperty('STOKEN')) {
      return helper.getErrorResponse(false, "Login sessiontoken missing.", "CUSTOMER ADD EVENT FEEDBACK", "");
    }

    if (event.STOKEN.length > 50 || event.STOKEN.length < 30) {
      return helper.getErrorResponse(false, "Login sessiontoken Size Error.", "CUSTOMER ADD EVENT FEEDBACK", "");
    }

    const [result] = await db.spcall(
      'CALL SP_STOKEN_CHECK(?,@result,@custid,@custname,@custemail); SELECT @result,@custid,@custname,@custemail',
      [event.STOKEN]
    );

    const objectvalue = result[1][0];
    const userid = objectvalue["@result"];

    if (userid == null) {
      return helper.getErrorResponse(false, "Login sessiontoken Invalid", "CUSTOMER ADD EVENT FEEDBACK", "");
    }

    if (!event.hasOwnProperty("querystring")) {
      return helper.getErrorResponse(false, "Querystring missing.", "CUSTOMER ADD EVENT FEEDBACK", "");
    }

    let secret = event.STOKEN.substring(0, 16);

    let querydata;
    try {
      querydata = await helper.decrypt(event.querystring, secret);
    } catch (ex) {
      return helper.getErrorResponse(false, "Querystring error", "CUSTOMER ADD EVENT FEEDBACK", secret);
    }

    let evtData;
    try {
      evtData = JSON.parse(querydata);
    } catch (ex) {
      return helper.getErrorResponse(false, "Querystring JSON error", "CUSTOMER ADD EVENT FEEDBACK", secret);
    }

    if (!evtData.hasOwnProperty('eventid') || !evtData.hasOwnProperty('feedback') || !evtData.hasOwnProperty('flag')) {
      return helper.getErrorResponse(false, "Missing required fields (eventid, feedback, flag).", "CUSTOMER ADD EVENT FEEDBACK", "");
    }

    let eventIds = Array.isArray(evtData.eventid) ? evtData.eventid : [evtData.eventid];
    let allResults = [];
    let eventIdsJson = JSON.stringify(eventIds);
    const [result1] = await db.spcall('CALL SP_UPDATE_EVENT_LOG_BULK(?, ?, ?, ?,@affected_rows); select @affected_rows;', [eventIdsJson, evtData.flag, evtData.feedback, userid]);
    const objectvalue1 = result1[1][0];
 
    if (objectvalue1["@affected_rows"] > 0) {
              allResults.push({ code: true, message: "The customer event log added successfully", eventid: evtData.eventid, module: "CUSTOMER ADD EVENT FEEDBACK" });
            } else {
              allResults.push({ code: false, message: `Event ID ${evtData.eventid}: Error while adding the event log. Please check the details and re-enter correctly.`, module: "CUSTOMER ADD EVENT FEEDBACK" });
            }
      
          // Encrypt the results and return
          const encryptedResponse = helper.encrypt(JSON.stringify(allResults), secret);
          return {encryptedResponse}

  } catch (er) {
    return helper.getErrorResponse(false, "Internal error. Please contact Administration", er.message);
  }
}




//###################################################################################################################################################################################################
//######################## ADD EVENT FEEDBACK TO THE EVENT LOG ###########################################################################################################################################################################
//###################################################################################################################################################################################################

async function addWhatsappLog(event){
  try{
  //CHECK IF THE SESSIONTOKEN IS GIVEN AS AN INPUT OR NOT
  if(event.hasOwnProperty('STOKEN')==false){
    return helper.getErrorResponse(false,"Login sessiontoken missing. Please provide the Login sessiontoken","CUSTOMER ADD EVENT WHATSAPP LOG","");
  }
  //CHECK IF THE SESSIONTOKEN SIZE IS VALID OR NOT
  if(event.STOKEN.length > 50 || event.STOKEN.length  < 30){
    return helper.getErrorResponse(false,"Login sessiontoken Size Invalid.","CUSTOMER ADD EVENT WHATSAPP LOG","");
  }
// CHECK IF THE GIVEN SESSIONTOKEN IS VALID OR NOT
const [result] =await db.spcall('CALL SP_STOKEN_CHECK(?,@result,@custid,@custname,@custemail); select @result,@custid,@custname,@custemail',[event.STOKEN]);
const objectvalue = result[1][0];
const userid = objectvalue["@result"];
// // console("event feedback userid ->"+ userid);
if(userid == null){
  return helper.getErrorResponse(false,"Login sessiontoken Invalid. Please provide the valid sessiontoken","CUSTOMER ADD EVENT WHATSAPP LOG","");
}

//BEGIN VALIDATION 2
// CHECK IF THE QUERYSTRING IS GIVEN AS AN INPUT
if(event.hasOwnProperty("querystring")==false){
  return helper.getErrorResponse(false,"Querystring missing. Please provide the querystring","CUSTOMER ADD EVENT WHATSAPP LOG","");
}
var secret=event.STOKEN.substring(0,16);
// // console("secret-->"+secret);
// // console("event querystring ->"+ event.querystring);
var querydata;

try{ 
   querydata = await helper.decrypt(event.querystring,secret);
  //  // console("decrypted querydata->"+querydata);
}
catch(ex){
  return helper.getErrorResponse(false,"Querystring Invalid error.","CUSTOMER ADD EVENT WHATSAPP LOG",secret);
}
try{
  querydata= JSON.parse(querydata);
}
catch(ex){
  return helper.getErrorResponse(false,"Querystring JSON error.","CUSTOMER ADD EVENT WHATSAPP LOG",secret);
}
if(querydata.hasOwnProperty("eventid")==false){
  return helper.getErrorResponse(false,"Event id missing. Please provide the event id","CUSTOMER ADD EVENT WHATSAPP LOG",secret);
}
if(querydata.hasOwnProperty("groupname")==false){
  return helper.getErrorResponse(false,"Group name missing. Please provide the group name","CUSTOMER ADD EVENT WHATSAPP LOG",secret);
}

if(querydata.hasOwnProperty("messagetext")==false){
  return helper.getErrorResponse(false,"Message text missing. Please provide the message text","CUSTOMER ADD EVENT WHATSAPP LOG",secret); 
}

if(querydata.hasOwnProperty("imagepath")==false){
  return helper.getErrorResponse(false,"Image path missing. Please provide the imagepath","CUSTOMER ADD EVENT WHATSAPP LOG",secret);
}

const [result1] = await db.spcall('CALL SP_ADD_WHATSAPP_LOG(?,?,?,?,?);',[querydata.groupname,querydata.eventid,userid,querydata.messagetext,querydata.imagepath]);
if(result1.affectedRows){
  return helper.getSuccessResponse(true,"The Event Whatsapp log was added Successfully.",querydata.eventid,secret);
}
else{
  return helper.getErrorResponse(false,"Error while adding the event whatsapp log",querydata.eventid,secret);
}
  }catch(er){
    return helper.getErrorResponse(false,"Internal error. Please contact Administration",er,secret);
  }
}
//###################################################################################################################################################################################################
//################################# GET AI EVENT HUMAN DETECTION ##################################################################################################################################################################
//###################################################################################################################################################################################################
async function GetAIEvent(event){
  //CHECK IF THE SESSIONTOKEN SIZE IS VALID OR NOT
  if(event.STOKEN.length > 50 || event.STOKEN.length  < 30){
    return helper.getErrorResponse("SESSIONTOKEN_SIZE_ERROR","CUSTOMER GET AI EVENT","");
  }
  // CHECK IF THE GIVEN SESSIONTOKEN IS VALID OR NOT
  const [result] =await db.spcall('CALL SP_STOKEN_CHECK(?,@result,@custid,@custname,@custemail); select @result,@custid,@custname,@custemail',[event.STOKEN]);
  const objectvalue = result[1][0];
  const userid = objectvalue["@result"];
  // console("AI event userid ->"+ userid);
  if(userid == null){
    return helper.getErrorResponse("LOGIN_SESSIONTOKEN_ERROR","CUSTOMER GET AI EVENT","");
  }
  //CHECK IF THE SESSIONTOKEN IS GIVEN AS AN INPUT OR NOT
  if(event.hasOwnProperty('STOKEN')==false){
    return helper.getErrorResponse("LOGIN_SESSIONTOKEN_MISSING","CUSTOMER GET AI EVENT","");
  }
  //BEGIN VALIDATION 2
// CHECK IF THE QUERYSTRING IS GIVEN AS AN INPUT
if(event.hasOwnProperty("querystring")==false){
  return helper.getErrorResponse("AI_EVENT_QUERY_MISSING","CUSTOMER GET AI EVENT","");
}
var secret=event.STOKEN.substring(0,16);
// console("secret-->"+secret);
// console("AI event querystring ->"+ event.querystring);
var querydata;

try{ 
   querydata = await helper.decrypt(event.querystring,secret);
   // console("decrypted querydata->"+querydata);
}
catch(ex){
  return helper.getErrorResponse("AI_EVENT_QUERY_ERROR","CUSTOMER GET AI EVENT",secret);
}
try{
  querydata= JSON.parse(querydata);
}
catch(ex){
  return helper.getErrorResponse("AI_EVENT_JSON_ERROR","CUSTOMER GET AI EVENT",secret);
}
if(querydata.hasOwnProperty("eventid")==false){
  return helper.getErrorResponse("CUSTOMER_EVENT_ID_MISSING","CUSTOMER GET AI EVENT",secret);
}
   let sql ='';
   let rows='';

  sql=`SELECT em.Event_id,em.IsHumanDetected, el.status FROM eventmaster em JOIN eventlog el ON em.Event_ID = el.Event_ID WHERE em.Event_ID = ${querydata.eventid}`;
  rows = await db.query(sql);

  if (rows!="")
  { 
    const data = JSON.stringify(helper.emptyOrRows(rows));
    // console(data);
    return helper.getSuccessResponse("EVENT_LIST_FETCHED_SUCCESSFULLY","The Event list Fetched Successfully",data,secret);
  }
  else
  {
    return helper.getErrorResponse("EVENT_LIST_FETCHING_ERROR","Error while fetching the Event list",secret);
 }  
}

//#########################################################################################################################################################################################################
//##################### EVENT LIST FILTER #################################################################################################################################################################################
//#####################################################################################################################################################################################################

// async function Eventlistfilter(page,event){
//   try{
//   if(event.hasOwnProperty('STOKEN')==false){
//     return helper.getErrorResponse(false,"Login sessiontoken missing. Please provide the Login sessiontoken","CUSTOMER FILTER EVENT LIST","");
//   }
//   //CHECK IF THE SESSIONTOKEN SIZE IS VALID OR NOT
//   if(event.STOKEN.length > 50 || event.STOKEN.length  < 30){
//     return helper.getErrorResponse(false,"Login sessiontoken size invalid. Please provide the valid Sessiontoken","CUSTOMER FILTER EVENT LIST","");
//   }
//   // CHECK IF THE GIVEN SESSIONTOKEN IS VALID OR NOT
//   const [result] =await db.spcall('CALL SP_STOKEN_CHECK(?,@result,@custid,@custname,@custemail); select @result,@custid,@custname,@custemail',[event.STOKEN]);
//   const objectvalue = result[1][0];
//   const userid = objectvalue["@result"];
//   // // console("event list userid ->"+ userid);
//   if(userid == null){
//     return helper.getErrorResponse(false,"Login sessiontoken Invalid. Please provide the valid sessiontoken","CUSTOMER FILTER EVENT LIST","");
//   }

//    //BEGIN VALIDATION 2
// // CHECK IF THE QUERYSTRING IS GIVEN AS AN INPUT
// if(event.hasOwnProperty("querystring")==false){
//   return helper.getErrorResponse(false,"Querystring missing. Please provide the querystring","CUSTOMER FILTER AI EVENT","");
// }
// var secret=event.STOKEN.substring(0,16);
// // // console("secret-->"+secret);
// // // console("filter event querystring ->"+ event.querystring);
// var querydata;

// try{ 
//    querydata = await helper.decrypt(event.querystring,secret);
//   //  // console("decrypted querydata->"+querydata);
// }
// catch(ex){
//   return helper.getErrorResponse(false,"Querystring Invalid error. Please provide the valid querystring.","CUSTOMER FILTER EVENT LIST",secret);
// }
// try{
//   querydata= JSON.parse(querydata);
// }
// catch(ex){
//   return helper.getErrorResponse(false,"Querystring JSON error. Please provide the valid JSON","CUSTOMER FILTER EVENT LIST",secret);
// } 
// // Check if 'starttime' is missing or empty
// if(!querydata.hasOwnProperty('starttime') || querydata.starttime == ''){
//   return helper.getErrorResponse(false,"Start time missing. Please provide the start time","Please enter the start time for the event",secret);
// }

// // Check if 'endtime' is missing or empty
// if(!querydata.hasOwnProperty('endtime') || querydata.endtime == ''){
//   return helper.getErrorResponse(false,"End time missing. Please provide the end time","Please enter the end time for the event",secret);
// }


// const offset = helper.getOffset(page, config.eventlistpage);

// const sqlParams = [];
// let clSQL = `SELECT em.Event_ID, em.Event_Name, bm.whatsappgroupname, em.Row_updated_date, DATE_FORMAT(em.enddate, '%Y-%m-%d %H:%i:%s') AS eventtime, em.Alertmessage, em.IsHumanDetected,
// cm.camera_id, cm.camera_name, dm.device_name, dm.IP_Domain, dm.RTSP_port, dm.IP_port,dm.IP_Uname, dm.IP_Pwd, dm.short_name, dm.SDK_ID, dm.device_id, dt.Dept_name, dt.Dept_Location, dc.Name1,
// dc.Contact_mobile1, dc.Contact_Email1, bm.Branch_name, bm.contact_person,cm.Camera_Status,MIN(es.detected_file) AS imagepath,CASE WHEN el.Event_ID IS NOT NULL OR 
// wl.Event_ID IS NOT NULL THEN 'Acknowledged' ELSE 'Unacknowledged' END AS eventstatus, el.feedback, dt.branch_id FROM eventmaster em JOIN cameramaster cm ON cm.camera_id = em.analyticsource_id JOIN devicemaster dm ON 
// dm.device_id = cm.device_id JOIN deptmaster dt ON dt.dept_id = dm.dept_id LEFT JOIN deptcontacts dc ON dc.dept_id = dt.dept_id JOIN branchmaster bm ON bm.branch_id = dt.branch_id LEFT
// JOIN eventaistatus es ON es.event_id = em.Event_ID LEFT JOIN eventlog el ON el.event_id = em.Event_ID LEFT JOIN whatsapplog wl ON wl.Event_id = em.Event_ID WHERE em.enddate BETWEEN ? AND ?`;

// sqlParams.push(querydata.starttime, querydata.endtime);

// // Handle customer ID filtering
// if (querydata.customerid) {
//   if (querydata.customerid.startsWith('O')) {
//     let organizationId = querydata.customerid.replace('O_', '');
//     clSQL += ` AND dt.Branch_id IN (SELECT Branch_ID FROM branchmaster WHERE Customer_ID IN (SELECT Customer_id FROM customermaster WHERE Organization_id = ?))`;
//     sqlParams.push(organizationId);
//   } else {
//     clSQL += ` AND dt.Branch_ID IN (SELECT Branch_ID FROM branchmaster WHERE Customer_ID = ?)`;
//     sqlParams.push(querydata.customerid);
//   }
// }

// // Handle branch ID filtering
// if (querydata.branchid) {
//   clSQL += ` AND dt.Branch_ID = ?`;
//   sqlParams.push(querydata.branchid);
// }

// // Handle device ID filtering
// if (querydata.deviceid) {
//   clSQL += ` AND dm.Device_ID = ?`;
//   sqlParams.push(querydata.deviceid);
// }

// // Handle camera ID filtering
// if (querydata.cameraid) {
//   clSQL += ` AND cm.Camera_ID = ?`;
//   sqlParams.push(querydata.cameraid);
// }

// // Handle feedback filtering
// if (querydata.feedback) {
//   clSQL += ` AND em.Event_ID IN (SELECT Event_ID FROM eventlog WHERE feedback LIKE ?)`;
//   sqlParams.push(`%${querydata.feedback}%`);
// }

// // Handle event validation filtering
// if (querydata.eventvalidation) {
//   if (querydata.eventvalidation === 'whatsapp') {
//     clSQL += ` AND em.Event_id IN (SELECT Event_id FROM whatsapplog WHERE Row_updated_date BETWEEN ? AND ?)`;
//     sqlParams.push(querydata.starttime, querydata.endtime);
//   }
// }

// // Group by and order by clauses
// clSQL += ` GROUP BY em.Event_ID ORDER BY em.Row_updated_date LIMIT ? ,? ;`;
// // Add pagination parameters
// sqlParams.push(offset || 0, config.eventlistpage || 20);
// // console(clSQL);
// // console(sqlParams);
// const rows = await db.query(clSQL, sqlParams);

// if (rows.length) {
//   const data = helper.emptyOrRows(rows);
//   const meta = { page };
//   return helper.getSuccessResponse(true, "Event filter list Fetched Successfully", data, secret);
// } else {
//   return helper.getErrorResponse(false, "No events Found", rows, secret);
// }
//   }catch(er){
//     return helper.getErrorResponse(false,"Internal error. Please contact Administrator.",er,secret);
//   }
//   }
// async function Eventlistfilter(page, event) {
//   try {
//     // Check if the session token exists
//     if (!event.hasOwnProperty('STOKEN')) {
//       return helper.getErrorResponse(false, "Login session token missing. Please provide the Login session token", "CUSTOMER FILTER EVENT LIST", "");
//     }
    
//     // Validate session token length
//     if (event.STOKEN.length > 50 || event.STOKEN.length < 30) {
//       return helper.getErrorResponse(false, "Login session token size invalid. Please provide the valid Session token", "CUSTOMER FILTER EVENT LIST", "");
//     }
    
//     // Validate session token
//     const [result] = await db.spcall('CALL SP_STOKEN_CHECK(?, @result, @custid, @custname, @custemail); SELECT @result, @custid, @custname, @custemail', [event.STOKEN]);
//     const objectvalue = result[1][0];
//     const userid = objectvalue["@result"];
    
//     if (userid == null) {
//       return helper.getErrorResponse(false, "Login session token Invalid. Please provide the valid session token", "CUSTOMER FILTER EVENT LIST", "");
//     }
    
//     // Check if querystring is provided
//     if (!event.hasOwnProperty("querystring")) {
//       return helper.getErrorResponse(false, "Querystring missing. Please provide the querystring", "CUSTOMER FILTER AI EVENT", "");
//     }

//     var secret = event.STOKEN.substring(0, 16);
//     var querydata;

//     // Decrypt querystring
//     try {
//       querydata = await helper.decrypt(event.querystring, secret);
//     } catch (ex) {
//       return helper.getErrorResponse(false, "Querystring Invalid error. Please provide the valid querystring.", "CUSTOMER FILTER EVENT LIST", secret);
//     }
    
//     // Parse the decrypted querystring
//     try {
//       querydata = JSON.parse(querydata);
//     } catch (ex) {
//       return helper.getErrorResponse(false, "Querystring JSON error. Please provide valid JSON", "CUSTOMER FILTER EVENT LIST", secret);
//     }

//     // Validate required fields
//     if (!querydata.hasOwnProperty('starttime') || querydata.starttime == '') {
//       return helper.getErrorResponse(false, "Start time missing. Please provide the start time", "Please enter the start time for the event", secret);
//     }
//     if (!querydata.hasOwnProperty('endtime') || querydata.endtime == '') {
//       return helper.getErrorResponse(false, "End time missing. Please provide the end time", "Please enter the end time for the event", secret);
//     }

//     // Calculate pagination offset
//     const offset = helper.getOffset(page, config.eventlistpage);

//     // Prepare the SQL query
//     const sqlParams = [];
//     let clSQL = `SELECT em.Event_ID, em.Event_Name, bm.whatsappgroupname, em.Row_updated_date, 
//       DATE_FORMAT(em.enddate, '%Y-%m-%d %H:%i:%s') AS eventtime, em.Alertmessage, em.IsHumanDetected,
//       cm.camera_id, cm.camera_name, dm.device_name, dm.IP_Domain, dm.RTSP_port, dm.IP_port,
//       dm.IP_Uname, dm.IP_Pwd, dm.short_name, dm.SDK_ID, dm.device_id, dt.Dept_name, dt.Dept_Location, 
//       dc.Name1, dc.Contact_mobile1, dc.Contact_Email1, bm.Branch_name,bm.site_starttime Notifytime,bm.contact_person, 
//       cm.Camera_Status, MIN(es.detected_file) AS imagepath, 
//       CASE WHEN el.Event_ID IS NOT NULL OR wl.Event_ID IS NOT NULL THEN 'Acknowledged' 
//       ELSE 'Unacknowledged' END AS eventstatus, el.feedback, dt.branch_id 
//       FROM eventmaster em 
//       JOIN cameramaster cm ON cm.camera_id = em.analyticsource_id 
//       JOIN devicemaster dm ON dm.device_id = cm.device_id 
//       JOIN deptmaster dt ON dt.dept_id = dm.dept_id 
//       LEFT JOIN deptcontacts dc ON dc.dept_id = dt.dept_id 
//       JOIN branchmaster bm ON bm.branch_id = dt.branch_id 
//       LEFT JOIN eventaistatus es ON es.event_id = em.Event_ID 
//       LEFT JOIN eventlog el ON el.event_id = em.Event_ID 
//       LEFT JOIN whatsapplog wl ON wl.Event_id = em.Event_ID 
//       WHERE em.enddate BETWEEN ? AND ?`;

//     sqlParams.push(querydata.starttime, querydata.endtime);

//     // Handle customer ID filtering
//     if (querydata.customerid) {
//       if (querydata.customerid.startsWith('O')) {
//         let organizationId = parseInt(querydata.customerid.replace('O_', ''));
//         clSQL += ` AND dt.Branch_id IN (SELECT Branch_ID FROM branchmaster WHERE Customer_ID IN (SELECT Customer_id FROM customermaster WHERE Organization_id IN(?)))`;
//         sqlParams.push(organizationId);
//       } else {
//         clSQL += ` AND dt.Branch_ID IN (SELECT Branch_ID FROM branchmaster WHERE Customer_ID in (?))`;
//         sqlParams.push(querydata.customerid);
//       }
//     }

//     // Handle branch ID filtering
//     if (querydata.branchid) {
//       clSQL += ` AND dt.Branch_ID = ?`;
//       sqlParams.push(querydata.branchid);
//     }

//     // Handle device ID filtering
//     if (querydata.deviceid) {
//       clSQL += ` AND dm.Device_ID = ?`;
//       sqlParams.push(querydata.deviceid);
//     }

//     // Handle camera ID filtering
//     if (querydata.cameraid) {
//       clSQL += ` AND cm.Camera_ID = ?`;
//       sqlParams.push(querydata.cameraid);
//     }

//     // Handle feedback filtering
//     if (querydata.feedback) {
//       clSQL += ` AND em.Event_ID IN (SELECT Event_ID FROM eventlog WHERE feedback LIKE ?)`;
//       sqlParams.push(`%${querydata.feedback}%`);
//     }

//     // Handle event validation filtering
//     if (querydata.eventvalidation) {
//       if (querydata.eventvalidation === 'whatsapp') {
//         clSQL += ` AND em.Event_ID IN (SELECT Event_ID FROM whatsapplog WHERE Row_updated_date BETWEEN ? AND ?)`;
//         sqlParams.push(querydata.starttime, querydata.endtime);
//       }
//     }
//     // const offsetValue = !Number.isNaN(parseInt(offset)) ? parseInt(offset) : 0;
//     // const limitValue = !Number.isNaN(parseInt(config.eventlistpage)) ? parseInt(config.eventlistpage) : 20;
    
//     clSQL += ` GROUP BY em.Event_ID ORDER BY em.Row_updated_date LIMIT ${offset},${config.eventlistpage}`;
//     // sqlParams.push(offsetValue, limitValue);
    
//     // Add group by and order by clauses
//     // clSQL += ` GROUP BY em.Event_ID ORDER BY em.Row_updated_date LIMIT ?,?`;
//     // sqlParams.push(parseInt(offset) || 0, parseInt(config.eventlistpage) || 20);

//     // Debugging SQL query and parameters
//     // console(clSQL);
//     // console(sqlParams);

//     // Execute the query
//     const rows = await db.query(clSQL, sqlParams);

//     if (rows.length) {
//       const data = helper.emptyOrRows(rows);
//       const meta = { page };
//       return helper.getSuccessResponse(true, "Event filter list Fetched Successfully", data, secret);
//     } else {
//       return helper.getErrorResponse(false, "No events Found", rows, secret);
//     }
//   } catch (er) {
//     console.error(er);
//     return helper.getErrorResponse(false, "Internal error. Please contact Administrator.", er, secret);
//   }
// }

// async function Eventlistfilter(page, event) {
//   try {
//     // Check if the session token exists
//     if (!event.hasOwnProperty('STOKEN')) {
//       return helper.getErrorResponse(false, "Login session token missing. Please provide the Login session token", "CUSTOMER FILTER EVENT LIST", "");
//     }
    
//     // Validate session token length
//     if (event.STOKEN.length > 50 || event.STOKEN.length < 30) {
//       return helper.getErrorResponse(false, "Login session token size invalid. Please provide the valid Session token", "CUSTOMER FILTER EVENT LIST", "");
//     }
    
//     // Validate session token
//     const [result] = await db.spcall('CALL SP_STOKEN_CHECK(?, @result, @custid, @custname, @custemail); SELECT @result, @custid, @custname, @custemail', [event.STOKEN]);
//     const objectvalue = result[1][0];
//     const userid = objectvalue["@result"];
    
//     if (userid == null) {
//       return helper.getErrorResponse(false, "Login session token Invalid. Please provide the valid session token", "CUSTOMER FILTER EVENT LIST", "");
//     }
    
//     // Check if querystring is provided
//     if (!event.hasOwnProperty("querystring")) {
//       return helper.getErrorResponse(false, "Querystring missing. Please provide the querystring", "CUSTOMER FILTER AI EVENT", "");
//     }

//     var secret = event.STOKEN.substring(0, 16);
//     var querydata;

//     // Decrypt querystring
//     try {
//       querydata = await helper.decrypt(event.querystring, secret);
//     } catch (ex) {
//       return helper.getErrorResponse(false, "Querystring Invalid error. Please provide the valid querystring.", "CUSTOMER FILTER EVENT LIST", secret);
//     }
    
//     // Parse the decrypted querystring
//     try {
//       querydata = JSON.parse(querydata);
//     } catch (ex) {
//       return helper.getErrorResponse(false, "Querystring JSON error. Please provide valid JSON", "CUSTOMER FILTER EVENT LIST", secret);
//     }

//     // Validate required fields
//     if (!querydata.hasOwnProperty('starttime') || querydata.starttime == '') {
//       return helper.getErrorResponse(false, "Start time missing. Please provide the start time", "Please enter the start time for the event", secret);
//     }
//     if (!querydata.hasOwnProperty('endtime') || querydata.endtime == '') {
//       return helper.getErrorResponse(false, "End time missing. Please provide the end time", "Please enter the end time for the event", secret);
//     }

//     const offset = helper.getOffset(page, config.eventlistpage);
//     const sqlParams = [];
//     const currentDate = new Date();
//     const currentDay = helper.formatDate(currentDate, 'yyyyMMdd');

//     // File path logic: Check if current time is after 7:00 AM
//     const isAfter7AM = currentDate.getHours() >= 7;

//     // // Table suffix logic: Use current day until 12 PM, otherwise use next day's table
//     const tableSuffix = currentDate.getHours() >= 12 ? `_${currentDay}` : '';



//     let clSQL = `SELECT em.Event_ID, em.Event_Name, bm.whatsappgroupname, em.Row_updated_date, 
//       DATE_FORMAT(em.enddate, '%Y-%m-%d %H:%i:%s') AS eventtime, em.Alertmessage, em.IsHumanDetected,
//       cm.camera_id, cm.camera_name, dm.device_name, dm.IP_Domain, dm.RTSP_port, dm.IP_port,
//       dm.IP_Uname, dm.IP_Pwd, dm.short_name, dm.SDK_ID, dm.device_id, dt.Dept_name, dt.Dept_Location, 
//       dc.Name1, dc.Contact_mobile1, dc.Contact_Email1, bm.Branch_name, bm.site_starttime Notifytime, bm.contact_person, 
//       cm.Camera_Status,
//       CASE WHEN el.Event_ID IS NOT NULL OR wl.Event_ID IS NOT NULL THEN 'Acknowledged' 
//       ELSE 'Unacknowledged' END AS eventstatus, el.feedback,el.created_by userid,dt.branch_id
//       FROM eventmaster em 
//       JOIN cameramaster cm ON cm.camera_id = em.analyticsource_id 
//       JOIN devicemaster dm ON dm.device_id = cm.device_id  
//       JOIN deptmaster dt ON dt.dept_id = dm.dept_id 
//       LEFT JOIN deptcontacts dc ON dc.dept_id = dt.dept_id 
//       JOIN branchmaster bm ON bm.branch_id = dt.branch_id 
//       LEFT JOIN eventaistatus es ON es.event_id = em.Event_ID 
//       LEFT JOIN eventlog el ON el.event_id = em.Event_ID 
//       LEFT JOIN whatsapplog wl ON wl.Event_id = em.Event_ID 
//       WHERE em.enddate BETWEEN ? AND ?`;

//     sqlParams.push(querydata.starttime, querydata.endtime);

//     if (querydata.customerid) {
//       if (querydata.customerid.startsWith('O')) {
//         let organizationId = parseInt(querydata.customerid.replace('O_', ''));
//         clSQL += ` AND dt.Branch_id IN (SELECT Branch_ID FROM branchmaster WHERE Customer_ID IN (SELECT Customer_id FROM customermaster WHERE Organization_id IN(?)))`;
//         sqlParams.push(organizationId);
//       } else {
//         clSQL += ` AND dt.Branch_ID IN (SELECT Branch_ID FROM branchmaster WHERE Customer_ID in (?))`;
//         sqlParams.push(querydata.customerid);
//       }
//     }

//     if (querydata.branchid) {
//       clSQL += ` AND dt.Branch_ID = ?`;
//       sqlParams.push(querydata.branchid);
//     }

//     if (querydata.deviceid) {
//       clSQL += ` AND dm.Device_ID = ?`;
//       sqlParams.push(querydata.deviceid);
//     }

//     if (querydata.cameraid) {
//       clSQL += ` AND cm.Camera_ID IN(?)`;
//       sqlParams.push(querydata.cameraid);
//     }

//     if (querydata.feedback) {
//       clSQL += ` AND em.Event_ID IN (SELECT Event_ID FROM eventlog WHERE feedback LIKE ?)`
//       sqlParams.push(`%${querydata.feedback}%`);
//     }

//     if (querydata.eventvalidation) {
//       if (querydata.eventvalidation === 'whatsapp') {
//         clSQL += ` AND em.Event_ID IN (SELECT Event_ID FROM whatsapplog WHERE Row_updated_date BETWEEN ? AND ?)`;
//         sqlParams.push(querydata.starttime, querydata.endtime);
//       }
//     }

//     clSQL += ` GROUP BY em.Event_ID ORDER BY em.Row_updated_date LIMIT ${offset},${config.eventlistpage}`;

//     // console(clSQL);
//     // console(sqlParams);

//     const rows = await db.query(clSQL, sqlParams);
//     // Fetch the image path from the secondary database (second database connection)
//     try{
//       const eventIds = rows.map(row => row.Event_ID);  
//       var imagePaths,imagePathsArray;
    
//         if(eventIds.length != 0){
//         imagePaths = await db.query1(`SELECT event_id,LOCATE('\Volumes', detected_file),detected_file as imagepath FROM eventaistatus WHERE event_id IN (${eventIds});`);
//         imagePathsArray = imagePaths.rows || imagePaths;
//         }
     
     
//     // Merge the results from the two queries
    
//     var resultData = (imagePathsArray && imagePathsArray.length)
//     ? rows.map(row => { row.imagepath = (imagePathsArray.find(image => image.event_id === row.Event_ID) || {}).imagepath || null; return row; })
//     : [];

//     if (resultData.length) {
//       const data = helper.emptyOrRows(resultData);
//       const meta = { page };
//       return helper.getSuccessResponse(true, "Event filter list Fetched Successfully", data, secret);
//     } else {
//       return helper.getErrorResponse(false, "No events Found", rows, secret);
//     }
//     }catch(er){
//       // console(er);
//       return helper.getErrorResponse(false, "Error fetching the Image path", er, secret);
//     }
//   } catch (er) {
//     console.error(er);
//     return helper.getErrorResponse(false, "Internal error. Please contact Administrator.", er, secret);
//   }
// }
async function Eventlistfilter(page, event) {
  try {
      if (!event?.STOKEN) {
          return helper.getErrorResponse(false, "Login session token missing. Please provide the Login session token", "CUSTOMER FILTER EVENT LIST", "");
      }

      if (event.STOKEN.length > 50 || event.STOKEN.length < 30) {
          return helper.getErrorResponse(false, "Login session token size invalid. Please provide a valid session token", "CUSTOMER FILTER EVENT LIST", "");
      }

      const [result] = await db.spcall('CALL SP_STOKEN_CHECK(?, @result, @custid, @custname, @custemail); SELECT @result, @custid, @custname, @custemail', [event.STOKEN]);
      const user = result[1]?.[0];
      if (!user || !user["@result"]) {
          return helper.getErrorResponse(false, "Login session token Invalid. Please provide a valid session token", "CUSTOMER FILTER EVENT LIST", "");
      }

      if (!event?.querystring) {
          return helper.getErrorResponse(false, "Querystring missing. Please provide the querystring", "CUSTOMER FILTER AI EVENT", "");
      }

      const secret = event.STOKEN.substring(0, 16);
      let querydata;
      try {
          querydata = await helper.decrypt(event.querystring, secret);
          querydata = JSON.parse(querydata);
      } catch {
          return helper.getErrorResponse(false, "Invalid or malformed querystring.", "CUSTOMER FILTER EVENT LIST", secret);
      }

      if (!querydata.starttime || !querydata.endtime) {
          return helper.getErrorResponse(false, "Start time or End time missing.", "CUSTOMER FILTER EVENT LIST", secret);
      }

      // const offset = helper.getOffset(page, config.eventlistpage);
      // const sqlParams = [];
      // const startTime = new Date(querydata.starttime);
      // const endTime = new Date(querydata.endtime);
      // const currentDate = new Date();
      // const currentDay = helper.formatDate(currentDate, 'yyyyMMdd');
      // const currentHour = currentDate.getHours();
      // // Decide archive date based on event start time:
      // // If event occurs at or after 12:00, the event is archived using next day’s date.
      // let archiveDate;
      // if (startTime.getHours() >= 12) {
      //   let nextDay = new Date(startTime);
      //   nextDay.setDate(nextDay.getDate() + 1);
      //   archiveDate = helper.formatDate(nextDay, 'yyyyMMdd');
      // } else {
      //   archiveDate = helper.formatDate(startTime, 'yyyyMMdd');
      // }
      
      // // Determine which tables to use.
      // const startDay = helper.formatDate(startTime, 'yyyyMMdd');
      // const endDay = helper.formatDate(endTime, 'yyyyMMdd');
      // let eventTable, logTable, whatsappTable, eventaistatus,eventuserstatus;
      // if (startDay < currentDay && endDay < currentDay) {
      //   // Both dates in the past: use archived tables with the computed archiveDate.
      //   eventTable = `eventmaster_${archiveDate}`;
      //   logTable = `eventlog_${archiveDate}`;
      //   whatsappTable = `whatsapplog_${archiveDate}`;
      //   eventaistatus = `eventaistatus_${archiveDate}`;
      //   eventuserstatus = `eventuser_${archiveDate}`;
      // } else if (startDay === currentDay && endDay === currentDay) {
      //   // For the current day, use live tables (so you get full time details).
      //   eventTable = `eventmaster`;
      //   logTable = `eventlog`;
      //   whatsappTable = `whatsapplog`;
      //   eventaistatus = `eventaistatus`;
      //   eventuserstatus = `eventuser`;
      // } else if (startDay > currentDay && endDay > currentDay) {
      //   // Future dates: use live tables.
      //   eventTable = `eventmaster`;
      //   logTable = `eventlog`;
      //   whatsappTable = `whatsapplog`;
      //   eventaistatus = `eventaistatus`;
      //   eventuserstatus = `eventuser`;
      // } else {
      //   if (currentHour < 12) {
      //     // Before noon: use live tables.
      //     eventTable = 'eventmaster';
      //     logTable = 'eventlog';
      //     whatsappTable = 'whatsapplog';
      //     eventaistatus = 'eventaistatus';
      //     eventuserstatus = `eventuser`;
      //   }else{
      //   // Spanning dates: use UNION of archived and live tables.
      //   eventTable = `(SELECT * FROM eventmaster_${archiveDate} UNION ALL SELECT * FROM eventmaster)`;
      //   logTable = `(SELECT * FROM eventlog_${archiveDate} UNION ALL SELECT * FROM eventlog)`;
      //   whatsappTable = `(SELECT * FROM whatsapplog_${archiveDate} UNION ALL SELECT * FROM whatsapplog)`;
      //   eventaistatus = `(SELECT * FROM eventaistatus_${archiveDate} UNION ALL SELECT * FROM eventaistatus)`;
      //   eventuserstatus = `(SELECT * FROM eventuser_${archiveDate} UNION ALL SELECT * FROM eventuser)`;
      //   }
      // }
      const offset = helper.getOffset(page, config.eventlistpage);
var sqlParams = [];
const startTime = new Date(querydata.starttime);
const endTime = new Date(querydata.endtime);
const currentDate = new Date();
const currentDay = helper.formatDate(currentDate, 'yyyyMMdd');
const currentHour = currentDate.getHours();
const previousDay = helper.formatDate(new Date(Date.now() - 86400000), 'yyyyMMdd');

// Decide archive date based on event start time & current time
let archiveDate;
if (startTime.getHours() >= 12) {
  let nextDay = new Date(startTime);
  nextDay.setDate(nextDay.getDate() + 1);
  archiveDate = helper.formatDate(nextDay, 'yyyyMMdd');
} else {
  archiveDate = helper.formatDate(startTime, 'yyyyMMdd');
}

// Determine which tables to use.
const startDay = helper.formatDate(startTime, 'yyyyMMdd');
const endDay = helper.formatDate(endTime, 'yyyyMMdd');

let eventTable, logTable, whatsappTable, eventaistatus, eventuserstatus;

if (startDay === endDay) {
  // Case: Single day
  if (startDay === currentDay) {
    // Today
    if (currentHour >= 12 && startTime.getHours() < 12) {
      eventTable = `(SELECT * FROM eventmaster_${currentDay} UNION ALL SELECT * FROM eventmaster)`;
      logTable = `(SELECT * FROM eventlog_${currentDay} UNION ALL SELECT * FROM eventlog)`;
      whatsappTable = `(SELECT * FROM whatsapplog_${currentDay} UNION ALL SELECT * FROM whatsapplog)`;
      eventaistatus = `(SELECT * FROM eventaistatus_${currentDay} UNION ALL SELECT * FROM eventaistatus)`;
      eventuserstatus = `(SELECT * FROM eventuser_${currentDay} UNION ALL SELECT * FROM eventuser)`;
    } else if (currentHour < 12 && startTime.getHours() < 12) {
      eventTable = `eventmaster`;
      logTable = `eventlog`;
      whatsappTable = `whatsapplog`;
      eventaistatus = `eventaistatus`;
      eventuserstatus = `eventuser`;
    }else if(currentHour >= 12 && startTime.getHours() >= 12 && endTime.getHours() < 24){
      eventTable = `eventmaster`;
      logTable = `eventlog`;
      whatsappTable = `whatsapplog`;
      eventaistatus = `eventaistatus`;
      eventuserstatus = `eventuser`;
    }
    else {
      eventTable = `eventmaster_${currentDay}`;
      logTable = `eventlog_${currentDay}`;
      whatsappTable = `whatsapplog_${currentDay}`;
      eventaistatus = `eventaistatus_${currentDay}`;
      eventuserstatus = `eventuser_${currentDay}`;
    }
  } else if (startDay === previousDay && currentHour < 12) {
    // Yesterday before 12 PM
    eventTable = `eventmaster`;
    logTable = `eventlog`;
    whatsappTable = `whatsapplog`;
    eventaistatus = `eventaistatus`;
    eventuserstatus = `eventuser`;
  }  else if(startDay == previousDay && endDay == previousDay && currentHour >= 12 && startTime.getHours() >= 12 && endTime.getHours() < 24){
    // Archived day
    eventTable = `eventmaster_${currentDay}`;
    logTable = `eventlog_${currentDay}`;
    whatsappTable = `whatsapplog_${currentDay}`;
    eventaistatus = `eventaistatus_${currentDay}`;
    eventuserstatus = `eventuser_${currentDay}`;
  } else {
    // Archived day
    eventTable = `eventmaster_${endDay}`;
    logTable = `eventlog_${endDay}`;
    whatsappTable = `whatsapplog_${endDay}`;
    eventaistatus = `eventaistatus_${endDay}`;
    eventuserstatus = `eventuser_${endDay}`;
  }
}

else {
  // Case: Multi-day range
  if (endDay < currentDay) {
    // All in the past
    eventTable = `(SELECT * FROM eventmaster_${startDay} UNION ALL SELECT * FROM eventmaster_${endDay})`;
    logTable = `(SELECT * FROM eventlog_${startDay} UNION ALL SELECT * FROM eventlog_${endDay})`;
    whatsappTable = `(SELECT * FROM whatsapplog_${startDay} UNION ALL SELECT * FROM whatsapplog_${endDay})`;
    eventaistatus = `(SELECT * FROM eventaistatus_${startDay} UNION ALL SELECT * FROM eventaistatus_${endDay})`;
    eventuserstatus = `(SELECT * FROM eventuser_${startDay} UNION ALL SELECT * FROM eventuser_${endDay})`;
  } else if (startDay < currentDay && endDay === currentDay) {
    // Spanning archive + today
    if (currentHour < 12) {
      eventTable = `eventmaster`;
      logTable = `eventlog`;
      whatsappTable = `whatsapplog`;
      eventaistatus = `eventaistatus`;
      eventuserstatus = `eventuser`;
    } 
    else if(startDay == previousDay && endDay == currentDay && currentHour >= 12){
      eventTable = `(SELECT * FROM eventmaster_${currentDay} UNION ALL SELECT * FROM eventmaster)`;
      logTable = `(SELECT * FROM eventlog_${currentDay} UNION ALL SELECT * FROM eventlog)`;
      whatsappTable = `(SELECT * FROM whatsapplog_${currentDay} UNION ALL SELECT * FROM whatsapplog)`;
      eventaistatus = `(SELECT * FROM eventaistatus_${currentDay} UNION ALL SELECT * FROM eventaistatus)`;
      eventuserstatus = `(SELECT * FROM eventuser_${currentDay} UNION ALL SELECT * FROM eventuser)`;
    }else {
      eventTable = `(SELECT * FROM eventmaster_${startDay} UNION ALL SELECT * FROM eventmaster)`;
      logTable = `(SELECT * FROM eventlog_${startDay} UNION ALL SELECT * FROM eventlog)`;
      whatsappTable = `(SELECT * FROM whatsapplog_${startDay} UNION ALL SELECT * FROM whatsapplog)`;
      eventaistatus = `(SELECT * FROM eventaistatus_${startDay} UNION ALL SELECT * FROM eventaistatus)`;
      eventuserstatus = `(SELECT * FROM eventuser_${startDay} UNION ALL SELECT * FROM eventuser)`;
    }
  } else {
    // Current + future
    eventTable = `eventmaster`;
    logTable = `eventlog`;
    whatsappTable = `whatsapplog`;
    eventaistatus = `eventaistatus`;
    eventuserstatus = `eventuser`;
  }
}


      
      let clSQL = `SELECT em.Event_ID, em.Event_Name, bm.whatsappgroupname, em.Row_updated_date, 
        DATE_FORMAT(em.enddate, '%Y-%m-%d %H:%i:%s') AS eventtime, em.Alertmessage, em.IsHumanDetected,
        cm.camera_id, cm.camera_name, dm.device_name, dm.IP_Domain, dm.RTSP_port, dm.IP_port,
        dm.IP_Uname, dm.IP_Pwd, dm.short_name, dm.SDK_ID, dm.device_id, dt.Dept_name, dt.Dept_Location, 
        dc.Name1,dc.Name2,dc.Name3, dc.Contact_mobile1, dc.Contact_mobile2, dc.Contact_mobile3, dc.Contact_Email1, dc.Contact_Email2, dc.Contact_Email3,dc.User_role1 Userrole1, dc.User_role2 Userrole2, dc.User_role3 Userrole3, bm.Branch_name,bm.Branch_id siteid, bm.site_starttime Notifytime, bm.contact_person, 
        cm.Camera_Status,
        CASE WHEN el.Event_ID IS NOT NULL OR wl.Event_ID IS NOT NULL THEN 'Acknowledged' 
        ELSE 'Unacknowledged' END AS eventstatus, el.feedback,el.Row_upd_date Acknowledged_time, eu.user_id userid, dt.branch_id
        FROM ${eventTable} em 
        JOIN cameramaster cm ON cm.camera_id = em.analyticsource_id 
        JOIN devicemaster dm ON dm.device_id = cm.device_id  
        JOIN deptmaster dt ON dt.dept_id = dm.dept_id 
        LEFT JOIN deptcontacts dc ON dc.dept_id = dt.dept_id 
        JOIN branchmaster bm ON bm.branch_id = dt.branch_id 
        LEFT JOIN ${logTable} el ON el.event_id = em.Event_ID 
        LEFT JOIN ${whatsappTable} wl ON wl.Event_id = em.Event_ID 
        LEFT JOIN ${eventuserstatus} eu ON eu.Event_id = em.Event_ID 
        WHERE em.enddate BETWEEN ? AND ?`;
      
      sqlParams.push(querydata.starttime, querydata.endtime);
      
      if(querydata.customerid){
      if (querydata.customerid.startsWith('O')) {
        let organizationId = querydata.customerid.replace('O_', '');
        clSQL += ` AND bm.Branch_ID IN (SELECT Branch_ID FROM branchmaster WHERE Customer_ID in (select Customer_id from customermaster where Organization_id in(?)))`;
        sqlParams.push(organizationId);
      }else {
        clSQL += ` AND bm.Branch_ID IN (SELECT Branch_ID FROM branchmaster WHERE Customer_ID in (?))`;
        sqlParams.push(querydata.customerid);
      }
    }
      
      if (querydata.branchid) {
        clSQL += ` AND bm.Branch_ID = ?`;
        sqlParams.push(querydata.branchid);
      }
      
      if (querydata.deviceid) {
        clSQL += ` AND dm.Device_ID = ?`;
        sqlParams.push(querydata.deviceid);
      }
      
      if (querydata.cameraid) {
        clSQL += ` AND cm.Camera_ID IN(${querydata.cameraid})`;
        // sqlParams.push(querydata.cameraid);
      }
      if(querydata.userid){
        clSQL += ` AND em.Event_id IN (select eu.Event_id from ${eventuserstatus} eu where eu.User_id = ?)`;
        sqlParams.push(querydata.userid);
      }

    if (querydata.feedback) {
      clSQL += ` AND em.Event_ID IN (SELECT el.Event_ID FROM ${logTable} el WHERE el.feedback LIKE ?)`
      sqlParams.push(`%${querydata.feedback}%`);
    }

    if (querydata.eventvalidation) {
      if (querydata.eventvalidation == 'whatsapp') {
        clSQL += ` AND em.Event_ID IN (SELECT wa.Event_ID FROM ${whatsappTable} wa)`;
      }else if(querydata.eventvalidation == 'ai'){
        clSQL += ` AND em.Event_ID IN (SELECT eu.Event_ID FROM ${eventuserstatus} eu)`;
      }
    }
      
      clSQL += ` GROUP BY em.Event_ID ORDER BY em.Row_updated_date LIMIT ${offset},${config.eventlistpage}`;
      
      // console(clSQL);
      // console.log(sqlParams);
      //  console.log(clSQL);
      const rows = await db.query(clSQL, sqlParams);
      
      if (!rows.length) {
          return helper.getErrorResponse(false, "No events Found", [], secret);
      }

      // Get all event IDs from the rows
      const eventIds = rows.map(row => row.Event_ID);
      let imagePaths = [];
      const isWhatsapp = querydata.eventvalidation === 'whatsapp';
      const tableName = isWhatsapp ? whatsappTable : eventaistatus;
      const imageColumn = isWhatsapp ? 'imgpath' : 'detected_file';
      const queryFn = isWhatsapp ? db.query : db.query1;
      if (eventIds.length) {
      // Dynamically create placeholders for the IN clause
      const placeholders = eventIds.map(() => '?').join(',');
      var imageQuery;
      imageQuery = `
      SELECT eas.event_id, eas.${imageColumn} AS imagepath FROM ${tableName} AS eas WHERE eas.event_id IN (${placeholders})`;
     imagePaths = await queryFn(imageQuery, eventIds);
       
  }
  
  // Group image paths by event_id so each event gets an array of image paths
  // Group image paths by event_id as string (for safe key matching)
const imagePathsMap = new Map();
for (const { event_id, imagepath } of imagePaths) {
  const key = String(event_id);  // ensure string key
  const list = imagePathsMap.get(key) || [];
  list.push(imagepath);
  imagePathsMap.set(key, list);
}

// Merge image paths with each row (convert Event_ID to string to match)
const resultData = rows.map(row => {
  const key = String(row.Event_ID);  // normalize
  return {
    ...row,
    imagepaths: imagePathsMap.get(key) || []
  };
});

      return helper.getSuccessResponse(true, "Event filter list Fetched Successfully", resultData, secret);
  } catch (error) {
      console.error(error);
      return helper.getErrorResponse(false, "Internal error. Please contact Administrator.", error, "");
  }
}


//#########################################################################################################################################################################################################
//######################################################################################################################################################################################################
//#####################################################################################################################################################################################################

async function getUnAcknoEvent(page, event) {
  try {
    if (!event.hasOwnProperty('STOKEN')) {
      return helper.getErrorResponse(false, "Login sessiontoken missing", "CUSTOMER UNACKNOELEGED EVENT LIST", "");
    }

    if (event.STOKEN.length > 50 || event.STOKEN.length < 30) {
      return helper.getErrorResponse(false, "Login sessiontoken size Invalid", "CUSTOMER UNACKNOELEGED EVENT LIST", "");
    }

    const [result] = await db.spcall('CALL SP_STOKEN_CHECK(?,@result,@custid,@custname,@custemail); select @result,@custid,@custname,@custemail', [event.STOKEN]);
    const objectvalue = result[1][0];
    const userid = objectvalue["@result"];

    if (userid == null) {
      return helper.getErrorResponse(false, "Login sessiontoken Invalid. Please provide the valid sessiontoken", "CUSTOMER UNACKNOELEGED EVENT LIST", "");
    }

    if (!event.hasOwnProperty("querystring")) {
      return helper.getErrorResponse(false, "Querystring missing. Please provide the querystring", "CUSTOMER UNACKNOELEGED EVENT", "");
    }

    const secret = event.STOKEN.substring(0, 16);
    let querydata;

    try {
      querydata = await helper.decrypt(event.querystring, secret);
    } catch (ex) {
      return helper.getErrorResponse(false, "Querystring Invalid error", "CUSTOMER UNACKNOELEGED EVENT LIST", secret);
    }

    try {
      querydata = JSON.parse(querydata);
    } catch (ex) {
      return helper.getErrorResponse(false, "Querystring Invalid. Please provide the valid Querystring", "CUSTOMER UNACKNOELEGED EVENT LIST", secret);
    }

    const offset = helper.getOffset(page, config.eventlistpage);
    // const offset1 = helper.getOffset1(page, config.listPerPage);

    if (!querydata.hasOwnProperty('userid')) {
      return helper.getErrorResponse(false, "User id missing. Please provide the userid", "Please enter the user id for the device event", secret);
    }

    let sql = `SELECT DISTINCT em.Event_ID, em.Event_Name, bm.whatsappgroupname, em.Row_updated_date, DATE_FORMAT(em.enddate, '%Y-%m-%d %H:%i:%s') AS eventtime, em.Alertmessage, em.IsHumanDetected, 
    cm.camera_id, cm.camera_name, dm.device_name, dm.IP_Domain, dm.RTSP_port, dm.IP_port, dm.IP_Uname, dm.IP_Pwd, dm.short_name, dm.SDK_ID, dm.device_id, dt.Dept_name, dt.Dept_Location, 
    dc.Name1, dc.Contact_mobile1, dc.Contact_Email1,dc.Name2, dc.Contact_mobile2, dc.Contact_Email2,dc.Name3, dc.Contact_mobile3, 
    dc.Contact_Email3,dc.User_role1, dc.User_role2, dc.User_role3,bm.Branch_id,bm.Branch_name,bm.site_starttime,bm.contact_person, cm.Camera_Status, es.eventpath FROM eventmaster em JOIN eventstatus es ON es.Event_id = em.Event_ID 
    JOIN cameramaster cm ON cm.camera_id = em.analyticsource_id JOIN devicemaster dm ON dm.device_id = cm.device_id JOIN deptmaster dt ON dt.dept_id = dm.dept_id 
    LEFT JOIN deptcontacts dc ON dc.dept_id = dt.dept_id JOIN branchmaster bm ON bm.branch_id = dt.branch_id JOIN eventuser eu ON em.Event_ID = eu.Event_id AND eu.user_id = ${userid} LEFT JOIN eventlog el ON el.Event_ID = em.Event_ID LEFT JOIN whatsapplog wl ON wl.Event_id = em.Event_ID
    WHERE el.Event_ID IS NULL AND wl.Event_id IS NULL AND em.Event_Name NOT LIKE 'Tampering%' AND em.Event_Name NOT LIKE 'HDD%' AND em.Event_Name NOT LIKE 'Video%' 
    AND em.Event_Name NOT LIKE 'FULL%' AND em.Event_Name NOT LIKE 'Device%' ORDER BY em.Row_updated_date DESC `;

    const rows = await db.query(sql);
    const data = helper.emptyOrRows(rows);
    const eventLinks = data.map(event => ({
      Event_ID: event.Event_ID,
      Event_Name: event.Event_Name,
      whatsappgroupname: event.whatsappgroupname,
      eventtime: event.eventtime,
      Alertmessage: event.Alertmessage,
      cameraid: event.camera_id,
      cameraname: event.camera_name,
      IpDomain: event.IP_Domain,
      IpPort: event.IP_port,
      username: event.IP_Uname,
      password: event.IP_Pwd,
      devicename: event.device_name,
      SDK_ID: event.SDK_ID,
      deviceid: event.device_id,
      deptname: event.Dept_name,
      Dept_Location: event.Dept_Location,
      Name1: event.Name1,
      Contact_mobile1: event.Contact_mobile1,
      Contact_Email1: event.Contact_Email1,
      Name2: event.Name2,
      Contact_mobile2: event.Contact_mobile2,
      Contact_Email2: event.Contact_Email2,
      Name3: event.Name3,
      Contact_mobile3: event.Contact_mobile3,
      Contact_Email3: event.Contact_Email3,
      Branch_name: event.Branch_name,
      device_name: event.device_name,
      Camera_Status: event.Camera_Status,
      imagepath: event.eventpath,
      Notifytime:event.site_starttime,
      siteid: event.Branch_id,
      Userrole1: event.User_role1,
      Userrole2: event.User_role2,
      Userrole3: event.User_role3,
      

    }));

    const meta = { page };
    return helper.getSuccessResponse(true, "Unacknowleged event list fetched successfully", eventLinks, secret);

  } catch (er) {
    return helper.getErrorResponse(false, 'Internal error. Please contact Administration', er, "");
  }
}


//#########################################################################################################################################################################################################
//##################### RECENT EVENT #################################################################################################################################################################################
//#####################################################################################################################################################################################################

async function getRecEvent(page = 1,event){
  try{
  if(event.hasOwnProperty('STOKEN')==false){ 
    return helper.getErrorResponse("LOGIN_SESSIONTOKEN_MISSING","Please provide the valid login sessiontoken","CUSTOMER RECENT EVENT LIST","");
  }
  var secret=event.STOKEN.substring(0,16);
  // // console("secret-->"+secret);
  //CHECK IF THE SESSIONTOKEN SIZE IS VALID OR NOT
  if(event.STOKEN.length > 50 || event.STOKEN.length  < 30){
    return helper.getErrorResponse("SESSIONTOKEN_SIZE_ERROR","Invalid size for the sessiontoken. Please provide a sessiontoken of valid size.","CUSTOMER RECENT EVENT LIST",secret);
  }
  // CHECK IF THE GIVEN SESSIONTOKEN IS VALID OR NOT
  const [result] =await db.spcall('CALL SP_STOKEN_CHECK(?,@result,@custid,@custname,@custemail); select @result,@custid,@custname,@custemail',[event.STOKEN]);
  // // console(`spcallllllllllllll ${JSON.stringify([result])}`)
  const objectvalue = result[1][0];
  const userid = objectvalue["@result"];
  // // console("event list userid ->"+ userid);
  if(userid == null){
    return helper.getErrorResponse("LOGIN_SESSIONTOKEN_ERROR","Login sessiontoken Invalid. Please provide the valid sessiontoken","CUSTOMER RECENT EVENT LIST",secret);
  }
 
   //BEGIN VALIDATION 2
// CHECK IF THE QUERYSTRING IS GIVEN AS AN INPUTs
if(event.hasOwnProperty("querystring")==false){
  return helper.getErrorResponse("QUERYSTRING_MISSING","Querystring is missing. Please provide a valid querystring.","CUSTOMER RECENT EVENT",secret);
}

// // console("filter event querystring ->"+ event.querystring);
var querydata;

try{ 
   querydata = await helper.decrypt(event.querystring,secret);
  //  // console("decrypted querydata->"+querydata);
}
catch(ex){
  return helper.getErrorResponse("RECENT_EVENT_QUERY_ERROR","CUSTOMER RECENT EVENT LIST",secret);
}
try{
  querydata= JSON.parse(querydata);
}
catch(ex){
  return helper.getErrorResponse("RECENT_EVENT_JSON_ERROR","CUSTOMER RECENT EVENT LIST",secret);
} 
const offset = helper.getOffset(page, config.listPerPage);

if(querydata.hasOwnProperty('eventid')== false){
  return helper.getErrorResponse("EVENT_ID_MISSING","Please enter the event id for the event",secret);
}
if(querydata.hasOwnProperty('cameraid')==false){
  return helper.getErrorResponse("CAMERA_ID_MISSING","Please enter the camera id for the event",secret);
}

try{
let sql=""
//sql=`SELECT * from eventactionlog where event_id=${event.eventid} LIMIT ${offset},${config.listPerPage}`;		    
sql=`select em.Event_ID,em.Event_Name,bm.whatsappgroupname,em.Row_updated_date,em.enddate,em.Alertmessage,em.IsHumanDetected,cm.camera_id,cm.camera_name,dm.IP_Domain,dm.IP_port,dm.IP_Uname,dm.IP_Pwd,dm.RTSP_port,dm.device_name,dm.short_name,dm.SDK_ID,dt.Dept_name,dt.Dept_Location,dc.Name1,dc.Contact_mobile1,dc.Contact_Email1,bm.Branch_name,bm.contact_person,cm.Camera_Status from eventmaster em,cameramaster cm,devicemaster dm,deptmaster dt,deptcontacts dc,branchmaster bm where bm.branch_id=dt.branch_id and dc.dept_id=dt.dept_id and dt.dept_id=dm.dept_id and dm.device_id=cm.device_id and cm.camera_id=em.analyticsource_id and em.analyticsource_id = ${querydata.cameraid} and em.Event_ID = ${querydata.eventid} LIMIT ${offset},${config.listPerPage}`;
console.error(`SQL==>`, sql);
const rows = await db.query(sql);
const data = helper.emptyOrRows(rows);
var imageLinks1 = [];
var eventsWithImages1 = [];
var imageLinks =[];
var images =[];
var formattedDateTime;

for (const event of data) {
  const str = event.enddate;
  var sdkid = event.SDK_ID;
  const evDate = new Date(str);
  const yyyy = evDate.getFullYear().toString();
  const mm = (evDate.getMonth() + 1).toString();
  const dd = evDate.getDate().toString();
  
  var MainRTSPUrl;
  var SubRTSPUrl;
  var playbackurl;
  const ip_address = event.IP_Domain;
  const username = event.IP_Uname;
  const password= event.IP_Pwd;
  const rport= event.RTSP_port;
  const strDate = yyyy + (mm[1] ? mm : '0' + mm[0]) + (dd[1] ? dd : '0' + dd[0]);
  var strSitenane = event.Branch_name.replace(/\s/g, '');
   strSitenane = strSitenane.replace(/[^\w\s]/gi, '');
  const strCamID = event.camera_id;
  const strEventID = event.Event_ID;
  var FullPaththumb = "\\\\192.168.0.198\\volumes\\"+strDate+"\\"+strSitenane+"\\cam"+strCamID+"\\ivs\\Event"+strEventID
  const FullPaththumb1 = `\\\\192.168.0.198\\volumes\\${strDate}\\${strSitenane}\\cam${strCamID}\\ivs\\Event${strEventID}\\thumb`;
  // console(FullPaththumb);
  // console(FullPaththumb1);
  const testFolder = FullPaththumb;
  const testFolder1 = FullPaththumb1;
  images = [FullPaththumb];


const startTimeStr = str;
const startTime = new Date(startTimeStr);
const endTime = new Date(startTime.getTime() + 10 * 1000);
const endTimeStr = endTime.toISOString();

const inputTimeZone = 'Asia/Kolkata';

// Parse the input date strings with the input time zone
const inputStartTime = moment.tz(startTimeStr, inputTimeZone);
const inputEndTime = moment.tz(endTimeStr, inputTimeZone);

// console("start time -> " + inputStartTime);
// console("end time -> " + inputEndTime);

// Format start time and end time as required
const formattedStartTimeDahua = inputStartTime.format("YYYY_MM_DD_HH_mm_ss");
const formattedEndTimeDahua = inputEndTime.format("YYYY_MM_DD_HH_mm_ss");
const formattedStartTimeHikvision = inputStartTime.format("YYYYMMDDTHHmmss");
const formattedEndTimeHikvision = inputEndTime.format("YYYYMMDDTHHmmss");
formattedDateTime = inputStartTime.format("YYYY-MM-DD HH:mm:ss");
 
  var camera_no = event.camera_name;
  camera_no=camera_no.replace("Channel","");
  if(sdkid =='1'){
      MainRTSPUrl = "rtsp://"+username+":"+password+"@"+ip_address+":"+rport+ "/Streaming/Channels/"+camera_no+"01"; 
      SubRTSPUrl = "rtsp://"+username+":"+password+"@"+ip_address+":"+rport+ "/Streaming/Channels/"+camera_no+"02"; 
      playbackurl  ="rtsp://"+username+":"+password+"@"+ip_address+":"+rport+"/Streaming/tracks/"+camera_no+"01?starttime=" +formattedStartTimeHikvision+ "z&endtime=" +formattedEndTimeHikvision+ "z";
  }
  else if(sdkid =='2'){
      MainRTSPUrl = "rtsp://"+username+":"+password+"@"+ip_address+":"+rport+"/cam/realmonitor?channel="+camera_no+"&subtype=0";
      SubRTSPUrl = "rtsp://"+username+":"+password+"@"+ip_address+":"+rport+"/cam/realmonitor?channel="+camera_no+"&subtype=1";
      playbackurl ="rtsp://"+username+":"+password+"@"+ip_address+":"+rport+"/cam/playback?channel="+camera_no+"&starttime=" +formattedStartTimeDahua+ "&endtime=" +formattedEndTimeDahua;
  }
  try {
    const folderImages1 = fs
      .readdirSync(testFolder1)
      .map(file => {
        return FullPaththumb1 + '\\' + file;
      });

    if (folderImages1.length > 0) {
      imageLinks1.push(folderImages1);
      eventsWithImages1.push(event);
    } else {
      console.error('Image files not found for Event', strEventID);
      continue;
    }

  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error('Image files not found for Event', strEventID);
      continue;
    } else {
      console.error('Error while processing Event', strEventID, error);
    }
  }

try {
  const folderImages = fs
    .readdirSync(testFolder)
    .filter(file => {
      return file.toLowerCase().endsWith('.jpg');
    })
    .map(file => {
      return FullPaththumb + '/' + file;
    });

  if (folderImages.length > 0) {
    images.push(...folderImages);
  } else {
    console.error('Image files not found for Event', strEventID);
  }
} catch (error) {
  if (error.code === 'ENOENT') {
    console.error('Image files not found for Event', strEventID);
  } else {
    console.error('Error while processing Event', strEventID, error);
  }
}
imageLinks = images
  .filter(imageFile => {
    return imageFile.toLowerCase().endsWith('.jpg');
  })
  .map(imageFile => {
    const imageLink = `http://192.168.0.198:8080/event/serve-image?path=${encodeURIComponent(imageFile)}`;
    return imageLink;
  });
}
const eventLinks = eventsWithImages1.map((event, index) => {
  const firstImageFile = imageLinks1[index][0]; // Select the first image file
 // console("playback url ->"+playbackurl);
  return {
    Event_ID: event.Event_ID,
    Event_Name: event.Event_Name,
    Row_updated_date: formattedDateTime,
    device_name: event.device_name,
    enddate: event.enddate,
    Alertmessage: event.Alertmessage,
    IsHumanDetected: event.IsHumanDetected,
    camera_id: event.camera_id,
    camera_name: event.camera_name,
    Branch_name: event.Branch_name,
    Dept_Location: event.Dept_Location,
    imagepath:imageLinks1,
    whatsappgroupname : event.whatsappgroupname,
    Camera_Status : event.Camera_Status,
    imageUrls: firstImageFile
      ? [`http://192.168.0.198:8080/event/serve-image?path=${encodeURIComponent(firstImageFile)}`]
      : [], // Create an array with a single image URL or an empty array if there's no image
    FullPaththumb :FullPaththumb,
    imageLinks:imageLinks,
    images:images,
    MainRTSPUrl:MainRTSPUrl,
    SubRTSPUrl:SubRTSPUrl,
    playbackurl : playbackurl, 
  };
});

  const meta = { page };
  return helper.getSuccessResponse("RECENT_EVENT_FETCHED_SUCCESSFULLY","Recent Event list fetched successfully",eventLinks,secret);

}catch(er){
  return helper.getErrorResponse("UNEXPECTED_ERROR",er.message,er,secret);
}
}catch(er){
  return helper.getErrorResponse("UNEXPECTED_ERROR",er.message,er,secret);
}
}


//#########################################################################################################################################################################################################
//##################### GET DEVICE EVENT #################################################################################################################################################################################
//#####################################################################################################################################################################################################

// async function getDevEvent(page = 1,event){
// try{
//   if(event.hasOwnProperty('STOKEN')==false){
//     return helper.getErrorResponse("LOGIN_SESSIONTOKEN_MISSING","Login sessiontoken is missing. Please provide a valid sessiontoken.","CUSTOMER DEVICE EVENT LIST","");
//   }
//   var secret=event.STOKEN.substring(0,16);
//   // console("secret-->"+secret);
//   //CHECK IF THE SESSIONTOKEN SIZE IS VALID OR NOT
//   if(event.STOKEN.length > 50 || event.STOKEN.length  < 30){
//     return helper.getErrorResponse("SESSIONTOKEN_SIZE_ERROR","Invalid size for the session token. Please provide a session token of valid size.","CUSTOMER DEVICE EVENT LIST",secret);
//   }
//   // CHECK IF THE GIVEN SESSIONTOKEN IS VALID OR NOT
//   const [result] =await db.spcall('CALL SP_STOKEN_CHECK(?,@result,@custid,@custname,@custemail); select @result,@custid,@custname,@custemail',[event.STOKEN]);
//   const objectvalue = result[1][0];
//   const userid = objectvalue["@result"];
//   // console("event list userid ->"+ userid);
//   if(userid == null){
//     return helper.getErrorResponse("LOGIN_SESSIONTOKEN_ERROR","Invalid login sessiontoken. Please provide a valid sessiontoken.","CUSTOMER DEVICE EVENT LIST",secret);
//   }
 
//    //BEGIN VALIDATION 2
// // CHECK IF THE QUERYSTRING IS GIVEN AS AN INPUT
// if(event.hasOwnProperty("querystring")==false){
//   return helper.getErrorResponse("QUERYSTRING_MISSING","Querystring is missing. Please provide a valid querystring.","CUSTOMER DEVICE EVENT",secret);
// }

// // // console("filter event querystring ->"+ event.querystring);
// var querydata;

// try{ 
//    querydata = await helper.decrypt(event.querystring,secret);
//   //  // console("decrypted querydata->"+querydata);
// }
// catch(ex){
//   return helper.getErrorResponse("QUERYSTRING_ERROR","There is an error with the querystring. Please provide a valid querystring.","CUSTOMER DEVICE EVENT LIST",secret);
// }
// try{
//   querydata= JSON.parse(querydata);
// }
// catch(ex){
//   return helper.getErrorResponse("QUERYSTRING_JSON_ERROR","There's an error with parsing the querystring as JSON. Please provide a valid JSON querystring.","CUSTOMER DEVICE EVENT LIST",secret);
// } 
// const offset = helper.getOffset(page, config.listPerPage);

// if(querydata.hasOwnProperty('currentdate')== false){
//   return helper.getErrorResponse("EVENT_CURRENT_DATE_MISSING","Current date is missing. Please provide the current date.","Please enter the current date for the device event",secret);
// }

// try{
// let sql=""
// //sql=`SELECT * from eventactionlog where event_id=${event.eventid} LIMIT ${offset},${config.listPerPage}`;		    
// sql=`select em.Event_ID,em.Event_Name,bm.whatsappgroupname,em.Row_updated_date,em.enddate,em.Alertmessage,em.IsHumanDetected,cm.camera_id,cm.camera_name,dm.device_name,dm.IP_Domain,dm.RTSP_port,dm.IP_port,dm.IP_Uname,dm.IP_Pwd,dm.short_name,dm.SDK_ID,dt.Dept_name,dt.Dept_Location,dc.Name1,dc.Contact_mobile1,dc.Contact_Email1,bm.Branch_name,bm.contact_person,cm.Camera_Status from eventmaster em,cameramaster cm,devicemaster dm,deptmaster dt,deptcontacts dc,branchmaster bm where bm.branch_id=dt.branch_id and dc.dept_id=dt.dept_id and dt.dept_id=dm.dept_id and dm.device_id=cm.device_id and cm.camera_id=em.analyticsource_id and Date(em.Row_updated_date) ='${querydata.currentdate}' and Event_ID not in (select Event_ID from eventlog) and (Event_Name like 'Tampering%' or Event_Name like 'HDD%' or Event_Name like 'Video%' or Event_Name like '%FULL%' or Event_Name like '%Device%') ORDER BY Row_updated_date DESC LIMIT ${offset},${config.listPerPage}`;
// const rows = await db.query(sql);
// const data = helper.emptyOrRows(rows);
// var imageLinks1 = [];
// var eventsWithImages1 = [];
// var imageLinks =[];
// var images=[];
// var formattedDateTime;

// for (const event of data) {
//   const str = event.enddate;
//   var sdkid = event.SDK_ID;
//   const evDate = new Date(str);
//   const yyyy = evDate.getFullYear().toString();
//   const mm = (evDate.getMonth() + 1).toString();
//   const dd = evDate.getDate().toString();
//   var MainRTSPUrl;
//   var SubRTSPUrl;
//   var playbackurl;
//   const strDate = yyyy + (mm[1] ? mm : '0' + mm[0]) + (dd[1] ? dd : '0' + dd[0]);
//   var strSitenane = event.Branch_name.replace(/\s/g, '');
//    strSitenane = strSitenane.replace(/[^\w\s]/gi, '');
//   const strCamID = event.camera_id;
//   const strEventID = event.Event_ID;
//   var FullPaththumb = "\\\\192.168.0.198\\volumes\\"+strDate+"\\"+strSitenane+"\\cam"+strCamID+"\\ivs\\Event"+strEventID
//   const FullPaththumb1 = `\\\\192.168.0.198\\volumes\\${strDate}\\${strSitenane}\\cam${strCamID}\\ivs\\Event${strEventID}\\thumb`;
//   const testFolder = FullPaththumb;
//   const testFolder1 = FullPaththumb1;
//   images = [FullPaththumb];


// const startTimeStr = str;
// const startTime = new Date(startTimeStr);
// const endTime = new Date(startTime.getTime() + 10 * 1000);
// const endTimeStr = endTime.toISOString();

// const inputTimeZone = 'Asia/Kolkata';

// // Parse the input date strings with the input time zone
// const inputStartTime = moment.tz(startTimeStr, inputTimeZone);
// const inputEndTime = moment.tz(endTimeStr, inputTimeZone);


// // Format start time and end time as required
// const formattedStartTimeDahua = inputStartTime.format("YYYY_MM_DD_HH_mm_ss");
// const formattedEndTimeDahua = inputEndTime.format("YYYY_MM_DD_HH_mm_ss");
// const formattedStartTimeHikvision = inputStartTime.format("YYYYMMDDTHHmmss");
// const formattedEndTimeHikvision = inputEndTime.format("YYYYMMDDTHHmmss");
// formattedDateTime = inputStartTime.format("YYYY-MM-DD HH:mm:ss");

//   var ip_address = event.IP_Domain;
//   var username = event.IP_Uname;
//   var password=event.IP_Pwd;
//   var rport= event.RTSP_port;
//   var camera_no = event.camera_name;
//   camera_no=camera_no.replace("Channel","");
//   if(sdkid =='1'){
//       MainRTSPUrl = "rtsp://"+username+":"+password+"@"+ip_address+":"+rport+ "/Streaming/Channels/"+camera_no+"01"; 
//       SubRTSPUrl = "rtsp://"+username+":"+password+"@"+ip_address+":"+rport+ "/Streaming/Channels/"+camera_no+"02"; 
//       playbackurl  ="rtsp://"+username+":"+password+"@"+ip_address+":"+rport+"/Streaming/tracks/"+camera_no+"01?starttime=" +formattedStartTimeHikvision+ "z&endtime=" +formattedEndTimeHikvision+ "z";
//   }
//   else if(sdkid =='2'){
//       MainRTSPUrl = "rtsp://"+username+":"+password+"@"+ip_address+":"+rport+"/cam/realmonitor?channel="+camera_no+"&subtype=0";
//       SubRTSPUrl = "rtsp://"+username+":"+password+"@"+ip_address+":"+rport+"/cam/realmonitor?channel="+camera_no+"&subtype=1";
//       playbackurl ="rtsp://"+username+":"+password+"@"+ip_address+":"+rport+"/cam/playback?channel="+camera_no+"&starttime=" +formattedStartTimeDahua+ "&endtime=" +formattedEndTimeDahua;
//   }
//   try {
//     const folderImages1 = fs
//       .readdirSync(testFolder1)
//       .map(file => {
//         return FullPaththumb1 + '\\' + file;
//       });

//     if (folderImages1.length > 0) {
//       imageLinks1.push(folderImages1);
//       eventsWithImages1.push(event);
//     } else {
//       console.error('Image files not found for Event', strEventID);
//       continue;
//     }

//   } catch (error) {
//     if (error.code === 'ENOENT') {
//       console.error('Image files not found for Event', strEventID);
//       continue;
//     } else {
//       console.error('Error while processing Event', strEventID, error);
//     }
//   }

// try {
//   const folderImages = fs
//     .readdirSync(testFolder)
//     .filter(file => {
//       return file.toLowerCase().endsWith('.jpg');
//     })
//     .map(file => {
//       return FullPaththumb + '/' + file;
//     });

//   if (folderImages.length > 0) {
//     images.push(...folderImages);
//   } else {
//     console.error('Image files not found for Event', strEventID);
//   }
// } catch (error) {
//   if (error.code === 'ENOENT') {
//     console.error('Image files not found for Event', strEventID);
//   } else {
//     console.error('Error while processing Event', strEventID, error);
//   }
// }
// imageLinks = images
//   .filter(imageFile => {
//     return imageFile.toLowerCase().endsWith('.jpg');
//   })
//   .map(imageFile => {
//     const imageLink = `http://192.168.0.198:8080/event/serve-image?path=${encodeURIComponent(imageFile)}`;
//     // // console("url -> " + imageLink);
//     return imageLink;
//   });
// }
// const eventLinks = eventsWithImages1.map((event, index) => {
//   const firstImageFile = imageLinks1[index][0]; // Select the first image file

//   return {
//     Event_ID: event.Event_ID,
//     Event_Name: event.Event_Name,
//     Row_updated_date: formattedDateTime,
//     device_name: event.device_name,
//     enddate: event.enddate,
//     Alertmessage: event.Alertmessage,
//     IsHumanDetected: event.IsHumanDetected,
//     camera_id: event.camera_id,
//     camera_name: event.camera_name,
//     Branch_name: event.Branch_name,
//     Dept_Location: event.Dept_Location,
//     imagepath:imageLinks1,
//     whatsappgroupname : event.whatsappgroupname,
//     Camera_Status : event.Camera_Status,
//     imageUrls: firstImageFile
//       ? [`http://192.168.0.198:8080/event/serve-image?path=${encodeURIComponent(firstImageFile)}`]
//       : [], // Create an array with a single image URL or an empty array if there's no image
//     FullPaththumb :FullPaththumb,
//     imageLinks:imageLinks,
//     images:images,
//     MainRTSPUrl:MainRTSPUrl,
//     SubRTSPUrl:SubRTSPUrl,
//     playbackurl : playbackurl, 
//   };
// });
//   const meta = { page };
//   return helper.getSuccessResponse("DEVICE_EVENT_FETCHED_SUCCESSFULLY","Device Event list fetched successfully",eventLinks,secret);
// // message = 'Device event list Fetching successfully';
// // responsecode = "807"
// // const encrypt = helper.encrypt(JSON.stringify({
// //   responsecode,
// //   message,
// //   eventLinks,
// //   meta }), secret);
// // return encrypt;
// }catch(er){
//   return helper.getErrorResponse("UNEXPECTED_ERROR","Unexpected error happened. Please try again",er,secret);
// }
//   }
//   catch(er){
//     return helper.getErrorResponse("UNEXPECTED_ERROR","Unexpected error happened. Please try again",er,secret);
//   }
// }
async function getDevEvent(page, event) {
  try {
    if (!event.hasOwnProperty('STOKEN')) {
      return helper.getErrorResponse(false, "Login sessiontoken missing", "CUSTOMER DEVICE EVENT LIST", "");
    }

    if (event.STOKEN.length > 50 || event.STOKEN.length < 30) {
      return helper.getErrorResponse(false, "Login sessiontoken size Invalid", "CUSTOMER DEVICE EVENT LIST", "");
    }

    const [result] = await db.spcall('CALL SP_STOKEN_CHECK(?,@result,@custid,@custname,@custemail); select @result,@custid,@custname,@custemail', [event.STOKEN]);
    const objectvalue = result[1][0];
    const userid = objectvalue["@result"];

    if (userid == null) {
      return helper.getErrorResponse(false,"Login sessiontoken Invalid. Please provide the valid sessiontoken", "CUSTOMER DEVICE EVENT LIST", "");
    }

    if (!event.hasOwnProperty("querystring")) {
      return helper.getErrorResponse(false, "Querystring missing. Please provide the querystring", "CUSTOMER DEVICE EVENT", "");
    }

    const secret = event.STOKEN.substring(0, 16);
    let querydata;

    try {
      querydata = await helper.decrypt(event.querystring, secret);
    } catch (ex) {
      return helper.getErrorResponse(false, "Querystring Invalid error", "CUSTOMER DEVICE EVENT LIST", secret);
    }

    try {
      querydata = JSON.parse(querydata);
    } catch (ex) {
      return helper.getErrorResponse(false, "Querystring Invalid. Please provide the valid Querystring", "CUSTOMER DEVICE EVENT LIST", secret);
    }

    const offset = helper.getOffset(page, config.eventlistpage);
    // const offset1 = helper.getOffset1(page, config.listPerPage);

    if (!querydata.hasOwnProperty('currentdate')) {
      return helper.getErrorResponse(false, "Current date missing. Please provide the currentdate", "Please enter the current date for the device event", secret);
    }
    
    const previousDay = helper.formatDate(new Date(Date.now()), 'yyyyMMdd');
    
    var EventLog, Eventmaster, WhatsappLog;
    const currentDate = new Date();
    const currentHours = currentDate.getHours();
    
    if (currentHours >= 12) {
      Eventmaster = `(SELECT * FROM eventmaster_${previousDay} UNION ALL SELECT * FROM eventmaster)`;
      EventLog = `(SELECT * FROM eventlog_${previousDay} UNION ALL SELECT * FROM eventlog)`;
      WhatsappLog = `(SELECT * FROM whatsapplog_${previousDay} UNION ALL SELECT * FROM whatsapplog)`;
    } else {
      Eventmaster = `eventmaster`;
      EventLog = `eventlog`;
      WhatsappLog = `whatsapplog`;
    }
    
    let sql = `
    SELECT 
      em.Event_ID, em.Event_Name, bm.whatsappgroupname, em.Row_updated_date,
      DATE_FORMAT(em.enddate, '%Y-%m-%d %H:%i:%s') AS eventtime,
      em.Alertmessage, em.IsHumanDetected, 
      cm.camera_id, cm.camera_name, dm.device_name, dm.IP_Domain, dm.RTSP_port, 
      dm.IP_port, dm.IP_Uname, dm.IP_Pwd, dm.short_name, dm.SDK_ID, dm.device_id, 
      dt.Dept_name, dt.Dept_Location, dc.Name1,dc.Name2,dc.Name3, dc.Contact_mobile1, dc.Contact_mobile2, dc.Contact_mobile3, dc.Contact_Email1, dc.Contact_Email2, dc.Contact_Email3, dc.User_role1, dc.User_role2, dc.User_role3, 
      bm.Branch_name, bm.contact_person, cm.Camera_Status, ep.imagepath
    FROM 
      ${Eventmaster} em
    JOIN 
      cameramaster cm ON cm.camera_id = em.analyticsource_id
    JOIN 
      devicemaster dm ON dm.device_id = cm.device_id
    JOIN 
      deptmaster dt ON dt.dept_id = dm.dept_id
    LEFT JOIN 
      deptcontacts dc ON dc.dept_id = dt.dept_id
    JOIN 
      branchmaster bm ON bm.branch_id = dt.branch_id
    LEFT JOIN (
      SELECT Event_ID, MIN(detected_file) AS imagepath 
      FROM eventaistatus 
      GROUP BY Event_ID
    ) ep ON ep.Event_ID = em.Event_ID
    LEFT JOIN 
      ${EventLog} el ON el.Event_ID = em.Event_ID
    LEFT JOIN 
      ${WhatsappLog} wl ON wl.Event_ID = em.Event_ID
    WHERE 
      el.Event_ID IS NULL
      AND wl.Event_ID IS NULL
      AND (
        em.Event_Name LIKE 'Tampering%' 
        OR em.Event_Name LIKE 'HDD%' 
        OR em.Event_Name LIKE 'Video%' 
        OR em.Event_Name LIKE '%FULL%' 
        OR em.Event_Name LIKE '%Device%' 
        OR em.Event_Name LIKE 'illegalaccess%' 
        OR em.Event_Name LIKE 'notconnected%' 
        OR em.Event_Name LIKE 'ioalarm%' 
        OR em.Event_Name LIKE 'cameramaskingalarmstart%'
      )
    GROUP BY 
      em.Event_ID, em.Event_Name, bm.whatsappgroupname, em.Row_updated_date, 
      em.Alertmessage, em.IsHumanDetected, cm.camera_id, cm.camera_name, 
      dm.device_name, dm.IP_Domain, dm.RTSP_port, dm.IP_port, dm.IP_Uname, 
      dm.IP_Pwd, dm.short_name, dm.SDK_ID, dm.device_id, dt.Dept_name, 
      dt.Dept_Location, dc.Name1, dc.Contact_mobile1, dc.Contact_Email1, 
      bm.Branch_name, bm.contact_person, cm.Camera_Status
    ORDER BY 
      em.Row_updated_date DESC
    LIMIT ${offset}, ${config.eventlistpage};
    `;
    
    const rows = await db.query(sql);
    const data = helper.emptyOrRows(rows);
    const eventLinks = data.map(event => ({
      Event_ID: event.Event_ID,
      Event_Name: event.Event_Name,
      whatsappgroupname: event.whatsappgroupname,
      eventtime: event.eventtime,
      Alertmessage: event.Alertmessage,
      cameraid: event.camera_id,
      cameraname: event.camera_name,
      IpDomain: event.IP_Domain,
      IpPort: event.IP_port,
      username: event.IP_Uname,
      password: event.IP_Pwd,
      devicename: event.device_name,
      SDK_ID: event.SDK_ID,
      deviceid: event.device_id,
      deptname: event.Dept_name,
      Dept_Location: event.Dept_Location,
      Name1: event.Name1,
      Contact_mobile1: event.Contact_mobile1,
      Contact_Email1: event.Contact_Email1,
      Branch_name: event.Branch_name,
      device_name: event.device_name,
      Camera_Status: event.Camera_Status,
      Userrole1: event.User_role1,
      Userrole2: event.User_role2,
      Userrole3: event.User_role3,
      Name2: event.Name2,
      Contact_mobile2: event.Contact_mobile2,
      Contact_Email2: event.Contact_Email2,
      Name3: event.Name3,
      Contact_mobile3: event.Contact_mobile3,
      Contact_Email3: event.Contact_Email3,
    }));

    const meta = { page };
    return helper.getSuccessResponse(true, "Device events fetched successfully", eventLinks, secret);

  } catch (er) {
    return helper.getErrorResponse(false, 'Internal error. Please contact Administration', er, "");
  }
}



//#########################################################################################################################################################################################################
//##################### GET DEVICE EVENT #################################################################################################################################################################################
//#####################################################################################################################################################################################################

async function getVideolossEvent(page = 1,event){
  try {
    if (!event.hasOwnProperty('STOKEN')) {
      return helper.getErrorResponse(false, "Login sessiontoken missing", "VIDEO LOSS EVENT LIST", "");
    }

    if (event.STOKEN.length > 50 || event.STOKEN.length < 30) {
      return helper.getErrorResponse(false, "Login sessiontoken size Invalid", "VIDEO LOSS EVENT LIST", "");
    }

    const [result] = await db.spcall('CALL SP_STOKEN_CHECK(?,@result,@custid,@custname,@custemail); select @result,@custid,@custname,@custemail', [event.STOKEN]);
    const objectvalue = result[1][0];
    const userid = objectvalue["@result"];

    if (userid == null) {
      return helper.getErrorResponse(false,"Login sessiontoken Invalid. Please provide the valid sessiontoken", "VIDEO LOSS EVENT LIST", "");
    }

    if (!event.hasOwnProperty("querystring")) {
      return helper.getErrorResponse(false, "Querystring missing. Please provide the querystring", "VIDEO LOSS EVENT", "");
    }

    const secret = event.STOKEN.substring(0, 16);
    let querydata;

    try {
      querydata = await helper.decrypt(event.querystring, secret);
    } catch (ex) {
      return helper.getErrorResponse(false, "Querystring Invalid error", "VIDEO LOSS EVENT LIST", secret);
    }

    try {
      querydata = JSON.parse(querydata);
    } catch (ex) {
      return helper.getErrorResponse(false, "Querystring Invalid. Please provide the valid Querystring", "VIDEO LOSS EVENT LIST", secret);
    }

    const offset = helper.getOffset(page, config.eventlistpage);
    // const offset1 = helper.getOffset1(page, config.listPerPage);

   if (!querydata.hasOwnProperty('currentdate')) {
      return helper.getErrorResponse(false, "Current date missing. Please provide the currentdate", "Please enter the current date for the device event", secret);
    }
    const previousDay = helper.formatDate(new Date(Date.now()), 'yyyyMMdd');
    var EventLog,Eventmaster,WhatsappLog;
    const currentDate = new Date();
    const currentHours = currentDate.getHours();
    if(currentHours >= 12){
      Eventmaster = `(SELECT * FROM eventmaster_${previousDay} UNION ALL SELECT * FROM eventmaster)`;
      EventLog = `(SELECT * FROM eventlog_${previousDay} UNION ALL SELECT * FROM eventlog)`
      WhatsappLog = `(SELECT * FROM whatsapplog_${previousDay} UNION ALL SELECT * FROM whatsapplog)`;
    }else{
      Eventmaster = `eventmaster`;
      EventLog = `eventlog`
      WhatsappLog = `whatsapplog`;
    }
    let sql = `SELECT 
    em.Event_ID, em.Event_Name, bm.whatsappgroupname, em.Row_updated_date, 
    DATE_FORMAT(em.enddate, '%Y-%m-%d %H:%i:%s') AS eventtime, em.Alertmessage, em.IsHumanDetected,
    cm.camera_id, cm.camera_name, dm.device_name, dm.IP_Domain, dm.RTSP_port, dm.IP_port, dm.IP_Uname, 
    dm.IP_Pwd, dm.short_name, dm.SDK_ID, dm.device_id, dt.Dept_name, dt.Dept_Location, 
    dc.Name1, dc.Contact_mobile1, dc.Contact_Email1,dc.Name2, dc.Contact_mobile2, dc.Contact_Email2,dc.Name3, dc.Contact_mobile3, dc.Contact_Email3, dc.User_role1, dc.User_role2, dc.User_role3, bm.Branch_name, bm.contact_person, 
    cm.Camera_Status, MIN(ep.detected_file) AS imagepath
FROM 
    ${Eventmaster}  em
JOIN 
    cameramaster cm ON cm.camera_id = em.analyticsource_id
JOIN 
    devicemaster dm ON dm.device_id = cm.device_id
JOIN 
    deptmaster dt ON dt.dept_id = dm.dept_id
LEFT JOIN 
    deptcontacts dc ON dc.dept_id = dt.dept_id
JOIN 
    branchmaster bm ON bm.branch_id = dt.branch_id
LEFT JOIN 
    eventaistatus ep ON ep.Event_ID = em.Event_ID
LEFT JOIN 
    ${EventLog} el ON el.Event_ID = em.Event_ID
LEFT JOIN 
    ${WhatsappLog} wl ON wl.Event_id = em.Event_ID
WHERE 
    el.Event_ID IS NULL
    AND wl.Event_id IS NULL
    AND em.Event_Name LIKE '%Video loss%'
GROUP BY 
    em.Event_ID
ORDER BY 
    em.Row_updated_date DESC LIMIT ${offset}, ${config.eventlistpage};`;

    const rows = await db.query(sql);
    const data = helper.emptyOrRows(rows);
    const eventLinks = data.map(event => ({
      Event_ID: event.Event_ID,
      Event_Name: event.Event_Name,
      whatsappgroupname: event.whatsappgroupname,
      eventtime: event.eventtime,
      Alertmessage: event.Alertmessage,
      cameraid: event.camera_id,
      cameraname: event.camera_name,
      IpDomain: event.IP_Domain,
      IpPort: event.IP_port,
      username: event.IP_Uname,
      password: event.IP_Pwd,
      devicename: event.device_name,
      SDK_ID: event.SDK_ID,
      deviceid: event.device_id,
      deptname: event.Dept_name,
      Dept_Location: event.Dept_Location,
      Name1: event.Name1,
      Contact_mobile1: event.Contact_mobile1,
      Contact_Email1: event.Contact_Email1,
      Name2: event.Name2,
      Contact_mobile2: event.Contact_mobile2,
      Contact_Email2: event.Contact_Email2,
      Name3: event.Name3,
      Contact_mobile3: event.Contact_mobile3,
      Contact_Email3: event.Contact_Email3,
      Branch_name: event.Branch_name,
      device_name: event.device_name,
      Camera_Status: event.Camera_Status,
      Userrole1: event.User_role1,
      Userrole2: event.User_role2,
      Userrole3: event.User_role3,
    }));

    const meta = { page };
    return helper.getSuccessResponse(true, "Video loss events fetched successfully", eventLinks, secret);

  } catch (er) {
    return helper.getErrorResponse(false, 'Internal error. Please contact Administration', er, "");
  }
}


//#########################################################################################################################################################################################################
//##################### GET DEVICE EVENT #################################################################################################################################################################################
//#####################################################################################################################################################################################################

async function getNotConnect(page = 1,event){
  try {
    if (!event.hasOwnProperty('STOKEN')) {
      return helper.getErrorResponse(false, "Login sessiontoken missing", "NOT CONNECTED EVENTS LIST", "");
    }

    if (event.STOKEN.length > 50 || event.STOKEN.length < 30) {
      return helper.getErrorResponse(false, "Login sessiontoken size Invalid", "NOT CONNECTED EVENTS LIST", "");
    }

    const [result] = await db.spcall('CALL SP_STOKEN_CHECK(?,@result,@custid,@custname,@custemail); select @result,@custid,@custname,@custemail', [event.STOKEN]);
    const objectvalue = result[1][0];
    const userid = objectvalue["@result"];

    if (userid == null) {
      return helper.getErrorResponse(false,"Login sessiontoken Invalid. Please provide the valid sessiontoken", "NOT CONNECTED EVENTS LIST", "");
    }

    if (!event.hasOwnProperty("querystring")) {
      return helper.getErrorResponse(false, "Querystring missing. Please provide the querystring", "NOT CONNECTED EVENTS LIST", "");
    }

    const secret = event.STOKEN.substring(0, 16);
    let querydata;

    try {
      querydata = await helper.decrypt(event.querystring, secret);
    } catch (ex) {
      return helper.getErrorResponse(false, "Querystring Invalid error", "NOT CONNECTED EVENTS LIST", secret);
    }

    try {
      querydata = JSON.parse(querydata);
    } catch (ex) {
      return helper.getErrorResponse(false, "Querystring Invalid. Please provide the valid Querystring", "NOT CONNECTED EVENTS LIST", secret);
    }

    const offset = helper.getOffset(page, config.eventlistpage);
    // const offset1 = helper.getOffset1(page, config.listPerPage);

    if (!querydata.hasOwnProperty('currentdate')) {
      return helper.getErrorResponse(
        false,
        "Current date missing. Please provide the currentdate",
        "Please enter the current date for the not connected event",
        secret
      );
    }
    
    const previousDay = helper.formatDate(new Date(Date.now()), 'yyyyMMdd');
    
    let EventLog, Eventmaster, WhatsappLog;
    
    const currentDate = new Date();
    const currentHours = currentDate.getHours();
    
    if (currentHours >= 12) {
      Eventmaster = `(SELECT * FROM eventmaster_${previousDay} UNION ALL SELECT * FROM eventmaster)`;
      EventLog = `(SELECT * FROM eventlog_${previousDay} UNION ALL SELECT * FROM eventlog)`;
      WhatsappLog = `(SELECT * FROM whatsapplog_${previousDay} UNION ALL SELECT * FROM whatsapplog)`;
    } else {
      Eventmaster = `eventmaster`;
      EventLog = `eventlog`;
      WhatsappLog = `whatsapplog`;
    }
    
    let sql = `
    SELECT 
      em.Event_ID, em.Event_Name, bm.whatsappgroupname, em.Row_updated_date, 
      DATE_FORMAT(em.enddate, '%Y-%m-%d %H:%i:%s') AS eventtime, em.Alertmessage, em.IsHumanDetected, 
      cm.camera_id, cm.camera_name, dm.device_name, dm.IP_Domain, dm.RTSP_port, dm.IP_port, 
      dm.IP_Uname, dm.IP_Pwd, dm.short_name, dm.SDK_ID, dm.device_id, dt.Dept_name, dt.Dept_Location, 
      dc.Name1, dc.Contact_mobile1, dc.Contact_Email1, dc.Name2, dc.Contact_mobile2, dc.Contact_Email2, 
      dc.Name3, dc.Contact_mobile3, dc.Contact_Email3,dc.User_role1, dc.User_role2, dc.User_role3, bm.Branch_name, bm.contact_person, 
      cm.Camera_Status, 
      (SELECT MIN(ep.detected_file) FROM eventaistatus ep WHERE ep.Event_ID = em.Event_ID) AS imagepath
    FROM 
      ${Eventmaster} em
    JOIN 
      cameramaster cm ON cm.camera_id = em.analyticsource_id
    JOIN 
      devicemaster dm ON dm.device_id = cm.device_id
    JOIN 
      deptmaster dt ON dt.dept_id = dm.dept_id
    LEFT JOIN 
      deptcontacts dc ON dc.dept_id = dt.dept_id
    JOIN 
      branchmaster bm ON bm.branch_id = dt.branch_id
    LEFT JOIN 
      ${EventLog} el ON el.Event_ID = em.Event_ID
    LEFT JOIN 
      ${WhatsappLog} wl ON wl.Event_ID = em.Event_ID
    WHERE 
      el.Event_ID IS NULL
      AND wl.Event_ID IS NULL
      AND (em.Event_Name LIKE 'notconnected%')
    ORDER BY 
      em.Row_updated_date DESC
    LIMIT 
      ${offset}, ${config.eventlistpage};
    `;
    
    const rows = await db.query(sql);
    const data = helper.emptyOrRows(rows);
    const eventLinks = data.map(event => ({
      Event_ID: event.Event_ID,
      Event_Name: event.Event_Name,
      whatsappgroupname: event.whatsappgroupname,
      eventtime: event.eventtime,
      Alertmessage: event.Alertmessage,
      cameraid: event.camera_id,
      cameraname: event.camera_name,
      IpDomain: event.IP_Domain,
      IpPort: event.IP_port,
      username: event.IP_Uname,
      password: event.IP_Pwd,
      devicename: event.device_name,
      SDK_ID: event.SDK_ID,
      deviceid: event.device_id,
      deptname: event.Dept_name,
      Dept_Location: event.Dept_Location,
      Name1: event.Name1,
      Contact_mobile1: event.Contact_mobile1,
      Contact_Email1: event.Contact_Email1,
      Name2: event.Name2,
      Contact_mobile2: event.Contact_mobile2,
      Contact_Email2: event.Contact_Email2,
      Name3: event.Name3,
      Contact_mobile3: event.Contact_mobile3,
      Contact_Email3: event.Contact_Email3,
      Branch_name: event.Branch_name,
      device_name: event.device_name,
      Camera_Status: event.Camera_Status,
      Userrole1: event.User_role1,
      Userrole2: event.User_role2,
      Userrole3: event.User_role3,
    }));

    const meta = { page };
    return helper.getSuccessResponse(true, "Not connected events fetched successfully", eventLinks, secret);

  } catch (er) {
    return helper.getErrorResponse(false, 'Internal error. Please contact Administration', er, "");
  }
}



//#########################################################################################################################################################################################################
//##################### GET DEVICE EVENT #################################################################################################################################################################################
//#####################################################################################################################################################################################################

async function getWhatsappEvent(page = 1,event){
  try{
  if(event.hasOwnProperty('STOKEN')==false){
    return helper.getErrorResponse("LOGIN_SESSIONTOKEN_MISSING","Login sessiontoken is missing. Please provide a valid sessiontoken.","CUSTOMER WHATSAPP NOTIFIED EVENT LIST","");
  }
  var secret=event.STOKEN.substring(0,16);
// // console("secret-->"+secret);
  //CHECK IF THE SESSIONTOKEN SIZE IS VALID OR NOT
  if(event.STOKEN.length > 50 || event.STOKEN.length  < 30){
    return helper.getErrorResponse("SESSIONTOKEN_SIZE_ERROR","Invalid size for the sessiontoken. Please provide a sessiontoken of valid size.","CUSTOMER WHATSAPP NOTIFIED EVENT LIST",secret);
  }
  // CHECK IF THE GIVEN SESSIONTOKEN IS VALID OR NOT
  const [result] =await db.spcall('CALL SP_STOKEN_CHECK(?,@result,@custid,@custname,@custemail); select @result,@custid,@custname,@custemail',[event.STOKEN]);
  const objectvalue = result[1][0];
  const userid = objectvalue["@result"];
  // // console("Whatsapp notified event list userid ->"+ userid);
  if(userid == null){
    return helper.getErrorResponse("LOGIN_SESSIONTOKEN_ERROR","Invalid login sessiontoken. Please provide a valid sessiontoken.","CUSTOMER WHATSAPP NOTIFIED EVENT LIST",secret);
  }

   //BEGIN VALIDATION 2
// CHECK IF THE QUERYSTRING IS GIVEN AS AN INPUT
if(event.hasOwnProperty("querystring")==false){
  return helper.getErrorResponse("WHATSAPP_QUERYASTRING_MISSING","WhatsApp querystring is missing. Please provide a valid querystring.","CUSTOMER WHATSAPP NOTIFIED EVENT LIST",secret);
}

// console("whatsapp notified event querystring ->"+ event.querystring);
var querydata;

try{ 
   querydata = await helper.decrypt(event.querystring,secret);
   // console("decrypted querydata->"+querydata);
}
catch(ex){
  return helper.getErrorResponse("WHATSAPP_QUERYSTRING_ERROR","There is an error with the WhatsApp querystring format. Please provide a valid querystring.","CUSTOMER WHATSAPP NOTIFIED EVENT LIST",secret);
}
try{
  querydata= JSON.parse(querydata);
}
catch(ex){
  return helper.getErrorResponse("QUERYSTRING_JSON_ERROR","There's an error with parsing the querystring as JSON. Please provide a valid JSON querystring.","CUSTOMER WHATSAPP NOTIFIED EVENT LIST",secret);
} 
const offset = helper.getOffset(page, config.listPerPage);

if(querydata.hasOwnProperty('currentdate')== false){
  return helper.getErrorResponse("EVENT_CURRENT_DATE_MISSING","Current date is missing. Please provide the current date.","Please enter the current date for the whatsapp notified event",secret);
}

try{
let sql=""
//sql=`SELECT * from eventactionlog where event_id=${event.eventid} LIMIT ${offset},${config.listPerPage}`;		    
sql=`select em.Event_ID,em.Event_Name,em.Row_updated_date,em.enddate,em.Alertmessage,em.IsHumanDetected,cm.camera_id,cm.camera_name,dm.device_name,dm.short_name,dm.SDK_ID,dt.Dept_name,dt.Dept_Location,dc.Name1,dc.Contact_mobile1,dc.Contact_Email1,bm.Branch_name,bm.contact_person,cm.Camera_Status from eventmaster em,cameramaster cm,devicemaster dm,deptmaster dt,deptcontacts dc,branchmaster bm where bm.branch_id=dt.branch_id and dc.dept_id=dt.dept_id and dt.dept_id=dm.dept_id and dm.device_id=cm.device_id and cm.camera_id=em.analyticsource_id and Date(em.Row_updated_date) ='${querydata.currentdate}' and Event_ID  in (select Event_ID from whatsapplog where DATE(row_updated_date) = '${querydata.currentdate}')  ORDER BY Row_updated_date DESC LIMIT ${offset},${config.listPerPage}`;
console.error(`SQL==>`, sql);
const rows = await db.query(sql);
const data = helper.emptyOrRows(rows);
const imageLinks = [];
const eventsWithImages = [];
var formattedDateTime;

for (const event of data) {
  const str = event.enddate;
  const evDate = new Date(str);
  const yyyy = evDate.getFullYear().toString();
  const mm = (evDate.getMonth() + 1).toString();
  const dd = evDate.getDate().toString();
  const hh = evDate.getHours().toString().padStart(2, '0'); // Adding zero padding if needed
  const min = evDate.getMinutes().toString().padStart(2, '0'); // Adding zero padding if needed
  const sec = evDate.getSeconds().toString().padStart(2, '0');
  formattedDateTime = `${yyyy}-${mm}-${dd} ${hh}:${min}:${sec}`;         
  // console("11111111111111111111111111111111111111111111111111111111111111111111111111111111111"+formattedDateTime);


  const strDate = yyyy + (mm[1] ? mm : '0' + mm[0]) + (dd[1] ? dd : '0' + dd[0]);
  const strSitenane = event.Branch_name.replace(/\s/g, '');
  const strCamID = event.camera_id;
  const strEventID = event.Event_ID;

  const FullPaththumb = `\\\\192.168.0.198\\volumes\\${strDate}\\${strSitenane}\\cam${strCamID}\\ivs\\Event${strEventID}\\thumb`;

  const testFolder = FullPaththumb;

  try {
    const folderImages = fs
      .readdirSync(testFolder)
      .map(file => {
        return FullPaththumb + '/' + file;
      });

    if (folderImages.length > 0) {
      imageLinks.push(folderImages);
      eventsWithImages.push(event);
    } else {
      console.error('Image files not found for Event', strEventID);
      continue;
    }

  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error('Image files not found for Event', strEventID);
      continue;
    } else {
      console.error('Error while processing Event', strEventID, error);
    }
  }
}

const eventLinks = eventsWithImages.map((event, index) => {
  const firstImageFile = imageLinks[index][0]; 

  return {
    Event_ID: event.Event_ID,
    Event_Name: event.Event_Name,
    Row_updated_date: formattedDateTime,
    device_name: event.device_name,
    enddate: event.enddate,
    Alertmessage: event.Alertmessage,
    IsHumanDetected: event.IsHumanDetected,
    camera_id: event.camera_id,
    camera_name: event.camera_name,
    Branch_name: event.Branch_name,
    Dept_Location: event.Dept_Location,
    imagepath:imageLinks,
    imageUrls: firstImageFile
      ? [`http://192.168.0.198:8080/event/serve-image?path=${encodeURIComponent(firstImageFile)}`]
      : [],
  };
});

  const meta = { page };
  return helper.getSuccessResponse("WHATSAPP_EVENT_FETCHED_SUCCESSFULLY","Whatsapp Notified event list fetched successfully",eventLinks,secret);

}catch(er){
  return helper.getErrorResponse("UNEXPECTED_ERROR","Unexpected error happened. Please try again",er,secret);
}
  }catch(er){
    return helper.getErrorResponse("UNEXPECTED_ERROR","Unexpected error happened. Please try again",er,secret);
  }
}



//#########################################################################################################################################################################################################
//##################### CREATE AND STORE THE SNAPSHOT #################################################################################################################################################################################
//#####################################################################################################################################################################################################

async function CreateSnapshot(page = 1,event){
  try{
  if(event.hasOwnProperty('STOKEN')==false){
    return helper.getErrorResponse(false,"Login sessiontoken is missing. Please provide a valid sessiontoken.","EVENT CREATE NEW EVENT","");
  }
  var secret=event.STOKEN.substring(0,16);
  // // console("secret-->"+secret);
  //CHECK IF THE SESSIONTOKEN SIZE IS VALID OR NOT
  if(event.STOKEN.length > 50 || event.STOKEN.length  < 30){
    return helper.getErrorResponse(false,"Invalid size for the sessiontoken. Please provide a sessiontoken of valid size.","EVENT CREATE NEW EVENT","");
  }
  // CHECK IF THE GIVEN SESSIONTOKEN IS VALID OR NOT
  const [result] =await db.spcall('CALL SP_STOKEN_CHECK(?,@result,@custid,@custname,@custemail); select @result,@custid,@custname,@custemail',[event.STOKEN]);
  const objectvalue = result[1][0];
  const userid = objectvalue["@result"];
  // // console("create new event list userid ->"+ userid);
  if(userid == null){
    return helper.getErrorResponse(false,"Login sessiontoken Invalid. Please provide the valid sessiontoken","EVENT CREATE NEW EVENT","");
  }
 
  
   //BEGIN VALIDATION 2
// CHECK IF THE QUERYSTRING IS GIVEN AS AN INPUT
if(event.hasOwnProperty("querystring")==false){
  return helper.getErrorResponse(false,"Event querystring is missing. Please provide a valid querystring for the event.","EVENT CREATE NEW EVENT",secret);
}

// // console("Create new event querystring ->"+ event.querystring);
var querydata;

try{ 
   querydata = await helper.decrypt(event.querystring,secret);
  //  // console("decrypted querydata->"+querydata);
}
catch(ex){
  return helper.getErrorResponse(false,"There is an error with the querystring for the event. Please provide a valid querystring.","EVENT CREATE NEW EVENT",secret);
}
try{
  querydata= JSON.parse(querydata);
}
catch(ex){
  return helper.getErrorResponse(false,"There's an error with parsing the querystring as JSON. Please provide a valid JSON querystring.","EVENT CREATE NEW EVENT",secret);
} 
const offset = helper.getOffset(page, config.listPerPage);

if(querydata.hasOwnProperty('cameraid')== false){
  return helper.getErrorResponse(false,'Camera id missing. Please provide the camera id',"EVENT CREATE NEW EVENT",secret);
} 
if(querydata.hasOwnProperty('eventname')==false){
  return helper.getErrorResponse(false,'Event name missing. Please provide the event name',"EVENT CREATE NEW EVENT",secret);
}
 

  let sql =''
  sql = `SELECT dm.IP_Domain, dm.IP_Port, dm.IP_Uname, dm.IP_pwd, dm.SDK_ID, dm.device_name, dm.Device_id, cm.Camera_status, cm.camera_name,bm.Branch_name, bm.branch_id, bm.site_starttime, 
         bm.whatsappgroupname,dt.Dept_location, dc.Name1, dc.Name2, dc.Name3, dc.Contact_mobile1, dc.Contact_mobile2, dc.Contact_mobile3, dc.Contact_Email1, dc.Contact_Email2, dc.Contact_Email3,dc.User_role1 Userrole1, dc.User_role2 Userrole2, dc.User_role3 Userrole3 
         FROM cameramaster cm JOIN devicemaster dm ON dm.Device_ID = cm.Device_ID JOIN deptmaster dt ON dt.Dept_id = dm.Dept_id JOIN branchmaster bm ON bm.Branch_id = dt.Branch_id
         LEFT JOIN deptcontacts dc ON dt.Dept_id = dc.Dept_id WHERE cm.Camera_ID = ${querydata.cameraid} LIMIT 1;`;
  const rows = await db.query(sql);
  if(rows[0] != null){
    const {
      IP_Domain: ipaddress,
      IP_Port: port,
      IP_Uname: username,
      IP_pwd: password,
      SDK_ID,
      Device_id: deviceid,
      device_name: devicename,
      Camera_status: camerastatus,
      Dept_location: Location,
      whatsappgroupname,
      branch_id: siteid,
      camera_name: camera_no,
      site_starttime: Notifytime,
      Branch_name: sitename,
      Name1 : Name1,
      Name2: Name2,
      Name3: Name3,
      Contact_mobile1:Contact_mobile1,
      Contact_mobile2: Contact_mobile2,
      Contact_mobile3: Contact_mobile3,
      Contact_Email1:Contact_Email1,
      Contact_Email2: Contact_Email2,
      Contact_Email3: Contact_Email3,
      Userrole1: Userrole1,
      Userrole2: Userrole2 ,
      Userrole3: Userrole3,
    } = rows[0];
  var channelno=camera_no.replace("Channel","");
  channelno=camera_no.replace("channel","");
  // // console("ipaddress ->"+ipaddress);
  // // console("ipport ->"+port);
  const [result1] = await db.spcall(`CALL addeventruntime3_notigored(?,?,?,@camID,@eid); select @camID,@eid`,[deviceid,channelno,querydata.eventname]);
  const objectvalue1 =result1[1][0];
  var eventid =  objectvalue1["@eid"];
  var cameraid = objectvalue1["@camID"];
  const eventname = querydata.eventname
  // const sql = await db.query(`Insert Into eventuser(event_id,user_id,event_path) values(?,?,?)`,[eventid,userid,sitename]);
  // // console("eventID ->"+eventid);
  // // console("sitename ->"+sitename);
  try
    {
      const returnstr = JSON.stringify({code:true,message:'Event created Successfully',cameraid,eventid,eventname,sitename,ipaddress,port,username,password,SDK_ID,deviceid,devicename,channelno,camerastatus,whatsappgroupname,Location,Notifytime,siteid,Name1, Name2, Name3,Contact_mobile1, Contact_mobile2, Contact_mobile3,Contact_Email1, Contact_Email2, Contact_Email3, Userrole1, Userrole2, Userrole3});
      if (secret!="")
      {

        const encryptedResponse = helper.encrypt(returnstr,secret);
        // // console("returnstr=>"+JSON.stringify(encryptedResponse));
        return {encryptedResponse};
      }
      else
      {
        return ({code:true,message:'Event created Successfully',cameraid,eventid,eventname,sitename,ipaddress,port,username,password,SDK_ID,deviceid,devicename,channelno,camerastatus,whatsappgroupname,Location,Notifytime,siteid,Name1, Name2, Name3,Contact_mobile1, Contact_mobile2, Contact_mobile3,Contact_Email1, Contact_Email2, Contact_Email3,Userrole1, Userrole2, Userrole3});
      }
    }
    catch(Ex)
    {
      return ({code:true,message:'Event created Successfully',cameraid,eventid,eventname,sitename,ipaddress,port,username,password,SDK_ID,deviceid,devicename,channelno,camerastatus,whatsappgroupname,Location,Notifytime,siteid,Name1, Name2, Name3,Contact_mobile1, Contact_mobile2, Contact_mobile3,Contact_Email1, Contact_Email2, Contact_Email3,Userrole1, Userrole2, Userrole3});
    }
 }else{
    return helper.getErrorResponse(false,"Error creating the Event","CREATE NEW EVENT",secret);   
 }
}catch(er){
  return helper.getErrorResponse(false,'Internal error. Please contact Administration',er,secret);
}
}



//#########################################################################################################################################################################################################
//##################### GET THE CUSTOMER FEEDBACK FOR SELF MONITORING #################################################################################################################################################################################
//############################################################################################################ws#########################################################################################

async function addCustomerSelfFeedback(page = 1,event){
  let message = 'Error in adding the customer self feedback';
  let responsecode = "8005";
  //CHECK IF THE SESSIONTOKEN SIZE IS VALID OR NOT
  if(event.STOKEN.length > 50 || event.STOKEN.length  < 30){
    return helper.getErrorResponse("SESSIONTOKEN_SIZE_ERROR","CUSTOMER ADD SELF FEEDBACK","");
  }
  // CHECK IF THE GIVEN SESSIONTOKEN IS VALID OR NOT
  const [result] =await db.spcall('CALL SP_STOKEN_CHECK(?,@result,@custid,@custname,@custemail); select @result,@custid,@custname,@custemail',[event.STOKEN]);
  const objectvalue = result[1][0];
  const userid = objectvalue["@result"]; 
  // // console("not conneceted event list userid ->"+ userid);
  if(userid == null){
    return helper.getErrorResponse("LOGIN_SESSIONTOKEN_ERROR","CUSTOMER ADD SELF FEEDBACK","");
  }
  if(event.hasOwnProperty('STOKEN')==false){
    return helper.getErrorResponse("LOGIN_SESSIONTOKEN_MISSING","CUSTOMER ADD SELF FEEDBACK","");
  }
   //BEGIN VALIDATION 2
// CHECK IF THE QUERYSTRING IS GIVEN AS AN INPUT
if(event.hasOwnProperty("querystring")==false){
  return helper.getErrorResponse("SELF_FEEDBACK_QUERY_MISSING","CUSTOMER ADD SELF FEEDBACK","");
}
var secret=event.STOKEN.substring(0,16);
// // console("secret-->"+secret);
// // console("filter event querystring ->"+ event.querystring);
var querydata;

try{   
   querydata = await helper.decrypt(event.querystring,secret);
  //  // console("decrypted querydata->"+querydata);
}
catch(ex){
  return helper.getErrorResponse("SELF_FEEDBACK_QUERY_ERROR","CUSTOMER ADD SELF FEEDBACK",secret);
}
try{
  querydata= JSON.parse(querydata);
}
catch(ex){
  return helper.getErrorResponse("SELF_FEEDBACK_JSON_ERROR","CUSTOMER ADD SELF FEEDBACK",secret);
} 
const offset = helper.getOffset(page, config.listPerPage);
if(querydata.hasOwnProperty('eventid')== false){
  return helper.getErrorResponse("SELF_FEEDBACK_EVENT_ID_MISSING","Please enter the event id for self feedback",secret);
}
if(querydata.hasOwnProperty('eventfeedback')==false){
  return helper.getErrorResponse("SELF_MONITORING_EVENT_FEEDBACK_MISSING","Please enter the self monitoring feedback of the customer",secret);
}
if(querydata.hasOwnProperty('customerid')==false){
  return helper.getErrorResponse("SELF_MONITIORING_CUSTOMER_ID_MISSING","Please enter the self monitoring customer id is missing.",secret);
}

const [result1]=await db.spcall(`CALL SP_SELF_FEEDBACK_ADD(?,?,?,?,@custevent_id); select @custevent_id`,[querydata.eventid,querydata.eventfeedback,querydata.customerid,userid]);
  const objectvalue1= result1[1][0];
  let custevent_id = objectvalue1["@custevent_id"];
  // // console("SELF MONITORING CUSOMER EVENT ID MISSING --->"+custevent_id);
  if(custevent_id!=''){
    return helper.getSuccessResponse("SELF_MONITORING_FEEDBACK_ADDED_SUCCESSFULLY","THE CUSTOMER SELF MONITORING FEEDBACK IS ADDED SUCCESSFULLY",custevent_id,secret);
  }
  else{
    return helper.getErrorResponse("SELF_MONITORING_FEEDBACK_ADDED_FAILED","THE CUSTOMER SELF MONITORING FEEDBACK ADDED FAILED.. CHECK THE DETAILS AND RE-ENTER IT",secret);
  }
}

//#####################################################################################################################################################################################################
//#####################################################################################################################################################################################################
//####################################################################################################################################################################################################

async function GetUserReport(page,event){
  try {
    if(event.hasOwnProperty('STOKEN')==false){
      return helper.getErrorResponse(false,"Login sessiontoken missing. Please provide the Login sessiontoken","USER EVENT REPORT","");
    }
    //CHECK IF THE SESSIONTOKEN SIZE IS VALID OR NOT
    if(event.STOKEN.length > 50 || event.STOKEN.length  < 30){
      return helper.getErrorResponse(false,"Login sessiontoken size invalid. Please provide the valid Sessiontoken","USER EVENT REPORT","");
    }
    // CHECK IF THE GIVEN SESSIONTOKEN IS VALID OR NOT
    const [result] =await db.spcall('CALL SP_STOKEN_CHECK(?,@result,@custid,@custname,@custemail); select @result,@custid,@custname,@custemail',[event.STOKEN]);
    const objectvalue = result[1][0];
    const userid = objectvalue["@result"];
    // console("event list userid ->"+ userid);
    if(userid == null){
      return helper.getErrorResponse(false,"Login sessiontoken Invalid. Please provide the valid sessiontoken","USER EVENT REPORT","");
    }
  
     //BEGIN VALIDATION 2
  // CHECK IF THE QUERYSTRING IS GIVEN AS AN INPUT
  if(event.hasOwnProperty("querystring")==false){
    return helper.getErrorResponse(false,"Querystring missing. Please provide the querystring","USER EVENT REPORT","");
  }
  var secret=event.STOKEN.substring(0,16);
  // console("secret-->"+secret);
  // console("filter event querystring ->"+ event.querystring);
  var querydata;
  
  try{ 
     querydata = await helper.decrypt(event.querystring,secret);
     // console("decrypted querydata->"+querydata);
  }
  catch(ex){
    return helper.getErrorResponse(false,"Querystring Invalid error. Please provide the valid querystring.","USER EVENT REPORT",secret);
  }
  try{
    querydata= JSON.parse(querydata);
  }
  catch(ex){
    return helper.getErrorResponse(false,"Querystring JSON error. Please provide the valid JSON","USER EVENT REPORT",secret);
  } 
  // Check if 'starttime' is missing or empty
  if(!querydata.hasOwnProperty('starttime') || querydata.starttime == ''){
    return helper.getErrorResponse(false,"Start time missing. Please provide the start time","Please enter the start time for the event",secret);
  }
  // Check if 'endtime' is missing or empty
  if(!querydata.hasOwnProperty('endtime') || querydata.endtime == ''){
    return helper.getErrorResponse(false,"End time missing. Please provide the end time","Please enter the end time for the event",secret);
  }
  if(!querydata.hasOwnProperty('filtertype') || querydata.filtertype == ''){
  return helper.getErrorResponse(false,"Filter type missing. Please provide the filter type","Please provide the filter type for the event",secret);
  }
  if(!querydata.hasOwnProperty('userid') || querydata.userid == ''){
    return helper.getErrorResponse(false,"User id missing. Please provide the User id","Please provide the user id for the event",secret);
    }
  
    const offset = helper.getOffset(page, config.listPerPage);
    const startTime = new Date(querydata.starttime);
    const endTime = new Date(querydata.endtime);
    const currentDate = new Date();
    const currentDay = helper.formatDate(currentDate, 'yyyyMMdd');
    const currentHour = currentDate.getHours();
    const previousDay = helper.formatDate(new Date(Date.now() - 86400000), 'yyyyMMdd');
    
    let archiveDate;
    if (startTime.getHours() >= 12) {
      let nextDay = new Date(startTime);
      nextDay.setDate(nextDay.getDate() + 1);
      archiveDate = helper.formatDate(nextDay, 'yyyyMMdd');
    } else {
      archiveDate = helper.formatDate(startTime, 'yyyyMMdd');
    }
    
    const startDay = helper.formatDate(startTime, 'yyyyMMdd');
    const endDay = helper.formatDate(endTime, 'yyyyMMdd');
    
    let eventTable, logTable, whatsappTable, eventaistatus, eventuserstatus, eventstatus;
    
    if (startDay === endDay) {
      // Single day
      if (startDay === currentDay) {
        // Today
        if (currentHour >= 12 && startTime.getHours() < 12) {
          // Between morning & noon of same day — mix archive & live
          eventTable = `(SELECT * FROM eventmaster_${currentDay} UNION ALL SELECT * FROM eventmaster)`;
          logTable = `(SELECT * FROM eventlog_${currentDay} UNION ALL SELECT * FROM eventlog)`;
          whatsappTable = `(SELECT * FROM whatsapplog_${currentDay} UNION ALL SELECT * FROM whatsapplog)`;
          eventaistatus = `(SELECT * FROM eventaistatus_${currentDay} UNION ALL SELECT * FROM eventaistatus)`;
          eventuserstatus = `(SELECT * FROM eventuser_${currentDay} UNION ALL SELECT * FROM eventuser)`;
          eventstatus = `(SELECT * FROM eventstatus_${currentDay} UNION ALL SELECT * FROM eventstatus)`;
        } else if (currentHour < 12 && startTime.getHours() < 12) {
          // Early morning only
          eventTable = `eventmaster`;
          logTable = `eventlog`;
          whatsappTable = `whatsapplog`;
          eventaistatus = `eventaistatus`;
          eventuserstatus = `eventuser`;
          eventstatus = `eventstatus`;
      }else if(currentHour >= 12 && startTime.getHours() >= 12 && endTime.getHours() <= 24){
        eventTable = `eventmaster`;
        logTable = `eventlog`;
        whatsappTable = `whatsapplog`;
        eventaistatus = `eventaistatus`;
        eventuserstatus = `eventuser`;
        eventstatus = `eventstatus`;
      }else {
          // After 12 noon
          eventTable = `eventmaster_${currentDay}`;
          logTable = `eventlog_${currentDay}`;
          whatsappTable = `whatsapplog_${currentDay}`;
          eventaistatus = `eventaistatus_${currentDay}`;
          eventuserstatus = `eventuser_${currentDay}`;
          eventstatus = `eventstatus_${currentDay}`;
        }
      } else if (startDay == previousDay && currentHour < 12) {
        // Yesterday before noon = still live
        eventTable = `eventmaster`;
        logTable = `eventlog`;
        whatsappTable = `whatsapplog`;
        eventaistatus = `eventaistatus`;
        eventuserstatus = `eventuser`;
        eventstatus = `eventstatus`;
      } else if(startDay == previousDay && endDay == previousDay && currentHour >= 12 && startTime.getHours() >= 12 && endTime.getHours() < 24){
        // Archived
        eventTable = `eventmaster_${currentDay}`;
        logTable = `eventlog_${currentDay}`;
        whatsappTable = `whatsapplog_${currentDay}`;
        eventaistatus = `eventaistatus_${currentDay}`;
        eventuserstatus = `eventuser_${currentDay}`;
        eventstatus = `eventstatus_${currentDay}`;
      }else{
        // Archived
        eventTable = `eventmaster_${endDay}`;
        logTable = `eventlog_${endDay}`;
        whatsappTable = `whatsapplog_${endDay}`;
        eventaistatus = `eventaistatus_${endDay}`;
        eventuserstatus = `eventuser_${endDay}`;
        eventstatus = `eventstatus_${endDay}`;
      }
    } else {
      // Multi-day range
      if (endDay < currentDay) {
        // Totally archived
        eventTable = `(SELECT * FROM eventmaster_${startDay} UNION ALL SELECT * FROM eventmaster_${endDay})`;
        logTable = `(SELECT * FROM eventlog_${startDay} UNION ALL SELECT * FROM eventlog_${endDay})`;
        whatsappTable = `(SELECT * FROM whatsapplog_${startDay} UNION ALL SELECT * FROM whatsapplog_${endDay})`;
        eventaistatus = `(SELECT * FROM eventaistatus_${startDay} UNION ALL SELECT * FROM eventaistatus_${endDay})`;
        eventuserstatus = `(SELECT * FROM eventuser_${startDay} UNION ALL SELECT * FROM eventuser_${endDay})`;
        eventstatus = `(SELECT * FROM eventstatus_${startDay} UNION ALL SELECT * FROM eventstatus_${endDay})`;
      } else if (startDay < currentDay && endDay === currentDay) {
        // Spanning archive + today
        if (currentHour < 12) {
          // Still before noon → use live
          eventTable = `eventmaster`;
          logTable = `eventlog`;
          whatsappTable = `whatsapplog`;
          eventaistatus = `eventaistatus`;
          eventuserstatus = `eventuser`;
          eventstatus = `eventstatus`;
        }else if(startDay == previousDay && endDay == currentDay && currentHour >= 12){
          eventTable = `(SELECT * FROM eventmaster_${currentDay} UNION ALL SELECT * FROM eventmaster)`;
          logTable = `(SELECT * FROM eventlog_${currentDay} UNION ALL SELECT * FROM eventlog)`;
          whatsappTable = `(SELECT * FROM whatsapplog_${currentDay} UNION ALL SELECT * FROM whatsapplog)`;
          eventaistatus = `(SELECT * FROM eventaistatus_${currentDay} UNION ALL SELECT * FROM eventaistatus)`;
          eventuserstatus = `(SELECT * FROM eventuser_${currentDay} UNION ALL SELECT * FROM eventuser)`;
          eventstatus = `(SELECT * FROM eventstatus_${currentDay} UNION ALL SELECT * FROM eventstatus)`
        }
         else {
          // After noon → mix
          eventTable = `(SELECT * FROM eventmaster_${endDay} UNION ALL SELECT * FROM eventmaster)`;
          logTable = `(SELECT * FROM eventlog_${endDay} UNION ALL SELECT * FROM eventlog)`;
          whatsappTable = `(SELECT * FROM whatsapplog_${endDay} UNION ALL SELECT * FROM whatsapplog)`;
          eventaistatus = `(SELECT * FROM eventaistatus_${endDay} UNION ALL SELECT * FROM eventaistatus)`;
          eventuserstatus = `(SELECT * FROM eventuser_${endDay} UNION ALL SELECT * FROM eventuser)`;
          eventstatus = `(SELECT * FROM eventstatus_${endDay} UNION ALL SELECT * FROM eventstatus)`;
        }
      } else {
        // Future stuff
        eventTable = `eventmaster`;
        logTable = `eventlog`;
        whatsappTable = `whatsapplog`;
        eventaistatus = `eventaistatus`;
        eventuserstatus = `eventuser`;
        eventstatus = `eventstatus`;
      }
    }
    

    // const offset1 = helper.getOffset1(page, config.listPerPage);
  var sql;
  if(querydata.filtertype == 'all'){
    sql = `SELECT em.Event_ID,em.Event_Name,bm.whatsappgroupname, em.Row_updated_date,DATE_FORMAT(em.enddate, '%Y-%m-%d %H:%i:%s') AS eventtime,em.Alertmessage,em.IsHumanDetected,
    cm.camera_id,cm.camera_name,dm.device_name,dm.IP_Domain,dm.RTSP_port, dm.IP_port, dm.IP_Uname, dm.IP_Pwd, dm.short_name, dm.SDK_ID,  dm.device_id, dt.Dept_name,dt.Dept_Location, 
    dc.Name1,dc.Name2,dc.Name3, dc.Contact_mobile1, dc.Contact_mobile2, dc.Contact_mobile3, dc.Contact_Email1, dc.Contact_Email2, dc.Contact_Email3,dc.User_role1 Userrole1, dc.User_role2 Userrole2, dc.User_role3 Userrole3,bm.Branch_name,bm.site_starttime Notifytime,bm.branch_id siteid,bm.contact_person, cm.Camera_Status, MIN(es.detected_file) AS imagepath,CASE WHEN el.Event_ID IS NOT NULL OR wl.Event_ID IS NOT NULL THEN 'Acknowledged' 
    ELSE 'Unacknowledged' END AS eventstatus, MAX(el.feedback) AS feedback,MAX(el.Row_upd_date) Acknowleged_time,CASE WHEN EXISTS (SELECT 1 FROM ecsmaster ec WHERE ec.site_id = bm.branch_id and status = 1 and ECStype = 'Two way') THEN TRUE
    ELSE FALSE END AS twoway_status,CASE WHEN EXISTS (SELECT 1 FROM ecsmaster ec WHERE ec.site_id = bm.branch_id and status = 1 and ECStype = 'PA system') THEN TRUE
    ELSE FALSE END AS oneway_status FROM ${eventTable} em JOIN cameramaster cm ON cm.camera_id = em.analyticsource_id JOIN devicemaster dm ON dm.device_id = cm.device_id
    JOIN deptmaster dt ON dt.dept_id = dm.dept_id LEFT JOIN deptcontacts dc ON dc.dept_id = dt.dept_id JOIN branchmaster bm ON bm.branch_id = dt.branch_id
    LEFT JOIN ${eventaistatus} es ON es.event_id = em.Event_ID LEFT JOIN ${logTable} el ON el.event_id = em.Event_ID LEFT JOIN ${whatsappTable} wl ON wl.Event_id = em.Event_ID
    JOIN ${eventuserstatus} eu ON eu.Event_ID = em.Event_ID WHERE em.enddate BETWEEN '${querydata.starttime}' and '${querydata.endtime}' AND eu.user_id = ${querydata.userid} GROUP BY em.Event_ID LIMIT ${offset}, ${config.listPerPage}`;
  }else if(querydata.filtertype == 'unacknowledged'){
    sql = `SELECT em.Event_ID, em.Event_Name, bm.whatsappgroupname, em.Row_updated_date,DATE_FORMAT(em.enddate, '%Y-%m-%d %H:%i:%s') AS eventtime, em.Alertmessage, em.IsHumanDetected, 
    cm.camera_id, cm.camera_name, dm.device_name, dm.IP_Domain, dm.RTSP_port, dm.IP_port, dm.IP_Uname, dm.IP_Pwd, dm.short_name, dm.SDK_ID, dm.device_id, dt.Dept_name, dt.Dept_Location, 
     dc.Name1,dc.Name2,dc.Name3, dc.Contact_mobile1, dc.Contact_mobile2, dc.Contact_mobile3, dc.Contact_Email1, dc.Contact_Email2, dc.Contact_Email3,dc.User_role1 Userrole1, dc.User_role2 Userrole2, dc.User_role3 Userrole3, bm.Branch_name,bm.site_starttime Notifytime,bm.branch_id siteid,bm.contact_person, cm.Camera_Status, ep.imagepath,CASE WHEN EXISTS (SELECT 1 FROM ecsmaster ec WHERE ec.site_id = bm.branch_id and status = 1 and ECStype = 'Two way') THEN TRUE
    ELSE FALSE END AS twoway_status,CASE WHEN EXISTS (SELECT 1 FROM ecsmaster ec WHERE ec.site_id = bm.branch_id and status = 1 and ECStype = 'PA system') THEN TRUE
    ELSE FALSE END AS oneway_status FROM ${eventTable} em JOIN cameramaster cm ON cm.camera_id = em.analyticsource_id JOIN devicemaster dm ON dm.device_id = cm.device_id JOIN deptmaster dt ON dt.dept_id = dm.dept_id 
    LEFT JOIN deptcontacts dc ON dc.dept_id = dt.dept_id JOIN branchmaster bm ON bm.branch_id = dt.branch_id LEFT JOIN (SELECT Event_ID, MIN(detected_file) AS imagepath FROM ${eventaistatus} es GROUP BY Event_ID
    ) ep ON ep.Event_ID = em.Event_ID WHERE em.Event_ID NOT IN (SELECT el.Event_ID FROM ${logTable} el) AND em.Event_ID NOT IN (SELECT wl.Event_id FROM ${whatsappTable} wl) AND em.Event_ID IN (SELECT eu.Event_id FROM ${eventuserstatus} eu 
    WHERE eu.user_id = ${querydata.userid}) AND (em.Row_updated_date between '${querydata.starttime}' and '${querydata.endtime}') GROUP BY em.Event_ID ORDER BY em.Row_updated_date LIMIT ${offset}, ${config.listPerPage}`;
  }else if(querydata.filtertype == 'acknowledged'){
    sql = `SELECT em.Event_ID, em.Event_Name, bm.whatsappgroupname, em.Row_updated_date,DATE_FORMAT(em.enddate, '%Y-%m-%d %H:%i:%s') AS eventtime, em.Alertmessage,em.IsHumanDetected,
    cm.camera_id, cm.camera_name, dm.device_name, dm.IP_Domain,dm.RTSP_port, dm.IP_port, dm.IP_Uname, dm.IP_Pwd, dm.short_name, dm.SDK_ID, dm.device_id, dt.Dept_name,
    dt.Dept_Location,  dc.Name1,dc.Name2,dc.Name3, dc.Contact_mobile1, dc.Contact_mobile2, dc.Contact_mobile3, dc.Contact_Email1, dc.Contact_Email2, dc.Contact_Email3,dc.User_role1 Userrole1, dc.User_role2 Userrole2, dc.User_role3 Userrole3,bm.Branch_name, bm.site_starttime Notifytime,bm.branch_id siteid, bm.contact_person,cm.Camera_Status, ep.imagepath, el.feedback,el.Row_upd_date Acknowledged_time,CASE WHEN EXISTS (SELECT 1 FROM ecsmaster ec WHERE ec.site_id = bm.branch_id and status = 1 and ECStype = 'Two way') THEN TRUE
    ELSE FALSE END AS twoway_status,CASE WHEN EXISTS (SELECT 1 FROM ecsmaster ec WHERE ec.site_id = bm.branch_id and status = 1 and ECStype = 'PA system') THEN TRUE
    ELSE FALSE END AS oneway_status
    FROM  ${eventTable}  em JOIN cameramaster cm ON cm.camera_id = em.analyticsource_id JOIN devicemaster dm ON dm.device_id = cm.device_id JOIN deptmaster dt ON dt.dept_id = dm.dept_id
    LEFT JOIN deptcontacts dc ON dc.dept_id = dt.dept_id JOIN branchmaster bm ON bm.branch_id = dt.branch_id
    LEFT JOIN (SELECT Event_ID, MIN(eventpath) AS imagepath FROM ${eventstatus} es GROUP BY Event_ID) ep ON ep.Event_ID = em.Event_ID
    JOIN ${logTable} el ON el.event_id = em.Event_ID WHERE EXISTS (SELECT 1 FROM ${eventuserstatus} eu WHERE eu.Event_id = em.Event_ID AND eu.user_id = ${querydata.userid}) and 
    (em.Row_updated_date between '${querydata.starttime}' and '${querydata.endtime}') GROUP BY em.Event_ID ORDER BY em.Row_updated_date LIMIT ${offset}, ${config.listPerPage}`;
  }else if(querydata.filtertype == 'whatsapp'){
    // sql = `SELECT em.Event_ID, em.Event_Name, bm.whatsappgroupname, em.Row_updated_date,DATE_FORMAT(em.enddate, '%Y-%m-%d %H:%i:%s') AS eventtime, em.Alertmessage, em.IsHumanDetected, 
    // cm.camera_id, cm.camera_name, dm.device_name, dm.IP_Domain, dm.RTSP_port, dm.IP_port, dm.IP_Uname, dm.IP_Pwd, dm.short_name, dm.SDK_ID, dm.device_id, dt.Dept_name, dt.Dept_Location, 
    // dc.Name1,dc.Name2,dc.Name3, dc.Contact_mobile1, dc.Contact_mobile2, dc.Contact_mobile3, dc.Contact_Email1, dc.Contact_Email2, dc.Contact_Email3,dc.User_role1 Userrole1, dc.User_role2 Userrole2, dc.User_role3 Userrole3, bm.Branch_name,bm.site_starttime Notifytime,bm.contact_person,bm.branch_id siteid, cm.Camera_Status, ep.imagepath,CASE WHEN EXISTS (SELECT 1 FROM ecsmaster ec WHERE ec.site_id = bm.branch_id and status = 1 and ECStype = 'Two way') THEN TRUE
    // ELSE FALSE END AS twoway_status,CASE WHEN EXISTS (SELECT 1 FROM ecsmaster ec WHERE ec.site_id = bm.branch_id and status = 1 and ECStype = 'PA system') THEN TRUE
    // ELSE FALSE END AS oneway_status FROM  ${eventTable} em JOIN cameramaster cm ON cm.camera_id = em.analyticsource_id JOIN devicemaster dm ON dm.device_id = cm.device_id JOIN deptmaster dt ON dt.dept_id = dm.dept_id 
    // LEFT JOIN deptcontacts dc ON dc.dept_id = dt.dept_id JOIN branchmaster bm ON bm.branch_id = dt.branch_id LEFT JOIN (SELECT Event_ID, MIN(detected_file) AS imagepath FROM ${eventaistatus} es GROUP BY Event_ID
    // ) ep ON ep.Event_ID = em.Event_ID WHERE em.Event_ID IN (SELECT wl.Event_id FROM ${whatsappTable} wl) AND em.Event_ID IN (SELECT eu.Event_id FROM ${eventuserstatus} eu 
    // WHERE eu.user_id = ${querydata.userid}) and (em.Row_updated_date between '${querydata.starttime}' and '${querydata.endtime}') GROUP BY em.Event_ID ORDER BY em.Row_updated_date LIMIT ${offset}, ${config.listPerPage}`;
    sql = `SELECT em.Event_ID, em.Event_Name, bm.whatsappgroupname, em.Row_updated_date, DATE_FORMAT(em.enddate, '%Y-%m-%d %H:%i:%s') AS eventtime, em.Alertmessage, em.IsHumanDetected, 
     cm.camera_id, cm.camera_name, dm.device_name,dm.IP_Domain, dm.RTSP_port, dm.IP_port,dm.IP_Uname, dm.IP_Pwd, dm.short_name, dm.SDK_ID, dm.device_id,dt.Dept_name, dt.Dept_Location, 
     dc.Name1,dc.Name2,dc.Name3, dc.Contact_mobile1, dc.Contact_mobile2, dc.Contact_mobile3, dc.Contact_Email1, dc.Contact_Email2, dc.Contact_Email3,dc.User_role1 AS Userrole1, 
     dc.User_role2 AS Userrole2, dc.User_role3 AS Userrole3, bm.Branch_name,bm.site_starttime AS Notifytime,bm.contact_person,bm.branch_id AS siteid, cm.Camera_Status, ep.imagepath,
     CASE WHEN EXISTS (SELECT 1 FROM ecsmaster ec WHERE ec.site_id = bm.branch_id AND status = 1 AND ECStype = 'Two way') THEN TRUE ELSE FALSE 
     END AS twoway_status,CASE WHEN EXISTS (SELECT 1 FROM ecsmaster ec WHERE ec.site_id = bm.branch_id  AND status = 1 AND ECStype = 'PA system') THEN TRUE ELSE FALSE 
     END AS oneway_status,el.feedback, el.Row_upd_date AS Acknowledged_time FROM ${eventTable} em JOIN cameramaster cm ON cm.camera_id = em.analyticsource_id
     JOIN devicemaster dm ON dm.device_id = cm.device_id JOIN deptmaster dt ON dt.dept_id = dm.dept_id LEFT JOIN deptcontacts dc ON dc.dept_id = dt.dept_id JOIN 
     branchmaster bm ON bm.branch_id = dt.branch_id LEFT JOIN 
    ( SELECT Event_ID, MIN(detected_file) AS imagepath FROM ${eventaistatus} es GROUP BY  Event_ID) ep ON ep.Event_ID = em.Event_ID
    LEFT JOIN ${logTable} el ON el.Event_id = em.Event_ID WHERE em.Event_ID IN (SELECT wl.Event_id FROM ${whatsappTable} wl)AND em.Event_ID IN ( SELECT eu.Event_id 
    FROM ${eventuserstatus} eu WHERE eu.user_id = ${querydata.userid}) AND em.Row_updated_date BETWEEN '${querydata.starttime}' AND '${querydata.endtime}'
    GROUP BY em.Event_ID ORDER BY em.Row_updated_date LIMIT ${offset}, ${config.listPerPage};`
  }else if(querydata.filtertype == 'ai'){
    sql = `SELECT em.Event_ID, em.Event_Name, bm.whatsappgroupname, em.Row_updated_date,DATE_FORMAT(em.enddate, '%Y-%m-%d %H:%i:%s') AS eventtime, em.Alertmessage, em.IsHumanDetected, 
    cm.camera_id, cm.camera_name, dm.device_name, dm.IP_Domain, dm.RTSP_port, dm.IP_port, dm.IP_Uname, dm.IP_Pwd, dm.short_name, dm.SDK_ID, dm.device_id, dt.Dept_name, dt.Dept_Location, 
    dc.Name1,dc.Name2,dc.Name3, dc.Contact_mobile1, dc.Contact_mobile2, dc.Contact_mobile3, dc.Contact_Email1, dc.Contact_Email2, dc.Contact_Email3,dc.User_role1 Userrole1, dc.User_role2 Userrole2, dc.User_role3 Userrole3, bm.Branch_name,bm.site_starttime Notifytime,bm.contact_person, bm.branch_id siteid,cm.Camera_Status, ep.imagepath,CASE WHEN EXISTS (SELECT 1 FROM ecsmaster ec WHERE ec.site_id = bm.branch_id and status = 1 and ECStype = 'Two way') THEN TRUE
    ELSE FALSE END AS twoway_status,CASE WHEN EXISTS (SELECT 1 FROM ecsmaster ec WHERE ec.site_id = bm.branch_id and status = 1 and ECStype = 'PA system') THEN TRUE
    ELSE FALSE END AS oneway_status,el.feedback, el.Row_upd_date AS Acknowledged_time FROM  ${eventTable} em JOIN cameramaster cm ON cm.camera_id = em.analyticsource_id JOIN devicemaster dm ON dm.device_id = cm.device_id JOIN deptmaster dt ON dt.dept_id = dm.dept_id 
    LEFT JOIN deptcontacts dc ON dc.dept_id = dt.dept_id JOIN branchmaster bm ON bm.branch_id = dt.branch_id LEFT JOIN (SELECT Event_ID, MIN(detected_file) AS imagepath FROM ${eventaistatus} eai GROUP BY eai.Event_ID
    ) ep ON ep.Event_ID = em.Event_ID JOIN ${logTable} el ON el.Event_ID = em.Event_ID WHERE em.Event_ID IN (SELECT wl.Event_ID FROM ${logTable} wl where wl.feedback like '%AI%') AND em.Event_ID IN (SELECT eu.Event_id FROM ${eventuserstatus} eu 
    WHERE eu.user_id = ${querydata.userid}) and (em.Row_updated_date between '${querydata.starttime}' and '${querydata.endtime}') GROUP BY em.Event_ID ORDER BY em.Row_updated_date LIMIT ${offset}, ${config.listPerPage}`;
  }else{
    return helper.getErrorResponse(false,"Unknown filter type.","Please choose the valid filter type",secret);
  }
  // console.log(sql);
  const rows = await db.query(sql);
  if (!rows.length) {
    return helper.getErrorResponse(false, "Events not available.", [], secret);
}

// Get all event IDs from the rows
const eventIds = rows.map(row => row.Event_ID);
let imagePaths = [];
if (eventIds.length) {
// Dynamically create placeholders for the IN clause
const placeholders = eventIds.map(() => '?').join(',');
var imageQuery;
if(querydata.filtertype == 'whatsapp'){
  imageQuery = `SELECT eas.event_id, eas.imgpath AS imagepath 
  FROM ${whatsappTable} as eas 
  WHERE eas.event_id IN (${placeholders})`;
  imagePaths = await db.query(imageQuery, eventIds); 
}else{
  imageQuery = `SELECT eas.event_id, eas.detected_file AS imagepath 
  FROM ${eventaistatus} as eas 
  WHERE eas.event_id IN (${placeholders})`;
  imagePaths = await db.query1(imageQuery, eventIds); 
}
}

const imagePathsMap = new Map();
for (const img of imagePaths) {
  const eventIdStr = String(img.event_id); // normalize key
  if (!imagePathsMap.has(eventIdStr)) {
    imagePathsMap.set(eventIdStr, []);
  }
  imagePathsMap.get(eventIdStr).push(img.imagepath);
}

// Merge the image paths with each event row
const resultData = rows.map(row => {
  const eventIdStr = String(row.Event_ID); // normalize key
  return {
    ...row,
    imagepaths: imagePathsMap.get(eventIdStr) || []
  };
});
  if(rows.length > 0){
    return helper.getSuccessResponse(true,'User reports fetched successfully',resultData,secret)
  } else{
    return helper.getErrorResponse(false,"Events not available.","USER REPORTS",secret);
  }
  } catch (er) {
    return helper.getErrorResponse(false,"Internal error. Please contact Administration",er,secret);
  }
}

//#####################################################################################################################################################################################################
//#####################################################################################################################################################################################################
//####################################################################################################################################################################################################

async function IgnoreCameras(event){
   try{
    if(event.hasOwnProperty('STOKEN')==false){
      return helper.getErrorResponse(false,"Login sessiontoken missing. Please provide the Login sessiontoken","USER EVENT REPORT","");
    }
    //CHECK IF THE SESSIONTOKEN SIZE IS VALID OR NOT
    if(event.STOKEN.length > 50 || event.STOKEN.length  < 30){
      return helper.getErrorResponse(false,"Login sessiontoken size invalid. Please provide the valid Sessiontoken","USER EVENT REPORT","");
    }
    // CHECK IF THE GIVEN SESSIONTOKEN IS VALID OR NOT
    const [result] =await db.spcall('CALL SP_STOKEN_CHECK(?,@result,@custid,@custname,@custemail); select @result,@custid,@custname,@custemail',[event.STOKEN]);
    const objectvalue = result[1][0];
    const userid = objectvalue["@result"];
    // // console("event list userid ->"+ userid);
    if(userid == null){
      return helper.getErrorResponse(false,"Login sessiontoken Invalid. Please provide the valid sessiontoken","USER EVENT REPORT","");
    }
  
     //BEGIN VALIDATION 2
  // CHECK IF THE QUERYSTRING IS GIVEN AS AN INPUT
  if(event.hasOwnProperty("querystring")==false){
    return helper.getErrorResponse(false,"Querystring missing. Please provide the querystring","USER EVENT REPORT","");
  }
  var secret=event.STOKEN.substring(0,16);
  // // console("secret-->"+secret);
  // // console("filter event querystring ->"+ event.querystring);
  var querydata;
  
  try{ 
     querydata = await helper.decrypt(event.querystring,secret);
    //  // console("decrypted querydata->"+querydata);
  }
  catch(ex){
    return helper.getErrorResponse(false,"Querystring Invalid error. Please provide the valid querystring.","USER EVENT REPORT",secret);
  }
  try{
    querydata= JSON.parse(querydata);
  }
  catch(ex){
    return helper.getErrorResponse(false,"Querystring JSON error. Please provide the valid JSON","USER EVENT REPORT",secret);
  } 
  if(querydata.hasOwnProperty('cameras') == false){
     return helper.getErrorResponse(false,"Camera id missing.","IGNORE CAMERA RECORDS",secret);
  }
  if(querydata.hasOwnProperty('ignoretype') == false){
    return helper.getErrorResponse(false,"Ignore type missing","IGNORE CAMERA RECORDS",secret);
  }
  if(querydata.hasOwnProperty('starttime') == false){
    return helper.getErrorResponse(false,"Start time missing","IGNORE CAMERA RECORDS",secret);
  }
  if(querydata.hasOwnProperty('endtime') == false){
    return helper.getErrorResponse(false,"End time missing","IGNORE CAMERA RECORDS",secret);
  }
  try{
      let cameraIds = querydata.cameras;
      if (typeof cameraIds === 'string') {
        // Replace various delimiters with commas and split by comma
        cameraIds = cameraIds.replace(/[\s;]+/g, ',').split(',').map(id => id.trim()).filter(id => id.length > 0);
      } else if (!Array.isArray(cameraIds)) {
        return helper.getErrorResponse(false, "Invalid camera id format.", "IGNORE CAMERA RECORDS", secret);
      }
    for (const cameraId of cameraIds) {
      try{
     const [result] = await db.spcall(`CALL AddEventIgnoreCamera(?,?,?,?,?);`,[cameraId,querydata.ignoretype,querydata.starttime,querydata.endtime,userid]);
      }catch(er){
        console.error(`Error calling stored procedure for camera ID ${cameraId}:`, error);
      }
    }
    return helper.getSuccessResponse(true,"Camera's added successfully","",secret);
  }catch(er){
    return helper.getErrorResponse(false,"Internal error. Please contact Administration",er,secret);
  }
   }catch(er){
      return helper.getErrorResponse(false,"Internal error. Please contact Administration",er,secret);
   }
}

//#####################################################################################################################################################################################################
//#####################################################################################################################################################################################################
//####################################################################################################################################################################################################

async function DeviceNotify(event){
  try{
    if(event.hasOwnProperty('STOKEN')==false){
      return helper.getErrorResponse(false,"Login sessiontoken missing. Please provide the Login sessiontoken","DEVICE INFO NOTIFY","");
    }
    //CHECK IF THE SESSIONTOKEN SIZE IS VALID OR NOT
    if(event.STOKEN.length > 50 || event.STOKEN.length  < 30){
      return helper.getErrorResponse(false,"Login sessiontoken size invalid. Please provide the valid Sessiontoken","DEVICE INFO NOTIFY","");
    }
    // CHECK IF THE GIVEN SESSIONTOKEN IS VALID OR NOT
    const [result] =await db.spcall('CALL SP_STOKEN_CHECK(?,@result,@custid,@custname,@custemail); select @result,@custid,@custname,@custemail',[event.STOKEN]);
    const objectvalue = result[1][0];
    const userid = objectvalue["@result"];
    // // console("event list userid ->"+ userid);
    if(userid == null){
      return helper.getErrorResponse(false,"Login sessiontoken Invalid. Please provide the valid sessiontoken","DEVICE INFO NOTIFY","");
    }
  
     //BEGIN VALIDATION 2
  // CHECK IF THE QUERYSTRING IS GIVEN AS AN INPUT
  if(event.hasOwnProperty("querystring")==false){
    return helper.getErrorResponse(false,"Querystring missing. Please provide the querystring","DEVICE INFO NOTIFY","");
  }
  var secret=event.STOKEN.substring(0,16);

  var querydata;
  
  try{ 
     querydata = await helper.decrypt(event.querystring,secret);
    //  // console("decrypted querydata->"+querydata);
  }
  catch(ex){
    return helper.getErrorResponse(false,"Querystring Invalid error. Please provide the valid querystring.","DEVICE INFO NOTIFY",secret);
  }
  try{
    querydata= JSON.parse(querydata);
  }
  catch(ex){
    return helper.getErrorResponse(false,"Querystring JSON error. Please provide the valid JSON","DEVICE INFO NOTIFY",secret);
  } 
  if(querydata.hasOwnProperty('deviceid') == false){
     return helper.getErrorResponse(false,"Device id missing.","DEVICE INFO NOTIFY",secret);
  }
  const sql = await db.query(`select whatsappgroupname from branchmaster where branch_id in(select  branch_id from deptmaster where dept_id in
    (select dept_id from devicemaster where Device_id IN(${querydata.deviceid}))) LIMIT 1;`);
  if(sql[0]){
    return helper.getSuccessResponse(true,'SUCCESS',sql,secret);
  }else{
    return helper.getErrorResponse(false,'FAILED','DEVICE INFO NOTIFY',secret);
  }
}catch(er){
  return helper.getErrorResponse(false,"Internal error. Please contact Administration",er,secret);
}
}

//#####################################################################################################################################################################################################
//#####################################################################################################################################################################################################
//####################################################################################################################################################################################################

async function Acknowledge(page,event){
  try{
    if(event.hasOwnProperty('STOKEN')==false){
      return helper.getErrorResponse(false,"Login sessiontoken missing. Please provide the Login sessiontoken","ACKNOWLEGED EVENTS FETCHED SUCCESSFULLY","");
    }
    //CHECK IF THE SESSIONTOKEN SIZE IS VALID OR NOT
    if(event.STOKEN.length > 50 || event.STOKEN.length  < 30){
      return helper.getErrorResponse(false,"Login sessiontoken size invalid. Please provide the valid Sessiontoken","ACKNOWLEDGED EVENTS FETCHED SUCCESSFULLY","");
    }
    // CHECK IF THE GIVEN SESSIONTOKEN IS VALID OR NOT
    const [result] =await db.spcall('CALL SP_STOKEN_CHECK(?,@result,@custid,@custname,@custemail); select @result,@custid,@custname,@custemail',[event.STOKEN]);
    const objectvalue = result[1][0];
    const userid = objectvalue["@result"];
    // // console("event list userid ->"+ userid);
    if(userid == null){
      return helper.getErrorResponse(false,"Login sessiontoken Invalid. Please provide the valid sessiontoken","ACKNOWLEDGED EVENTS FETCHED SUCCESSFULLY","");
    }
  
     //BEGIN VALIDATION 2
  // CHECK IF THE QUERYSTRING IS GIVEN AS AN INPUT
  if(event.hasOwnProperty("querystring")==false){
    return helper.getErrorResponse(false,"Querystring missing. Please provide the querystring","ACKNOWLEDGED EVENTS FETCHED SUCCESSFULLY","");
  }
  var secret=event.STOKEN.substring(0,16);

  var querydata;
  
  try{ 
     querydata = await helper.decrypt(event.querystring,secret);
    //  // console("decrypted querydata->"+querydata);
  }
  catch(ex){
    return helper.getErrorResponse(false,"Querystring Invalid error. Please provide the valid querystring.","ACKNOWLEDGED EVENTS FETCHED SUCCESSFULLY",secret);
  }
  try{
    querydata= JSON.parse(querydata);
  }
  catch(ex){
    return helper.getErrorResponse(false,"Querystring JSON error. Please provide the valid JSON","ACKNOWLEDGED EVENTS FETCHED SUCCESSFULLY",secret);
  } 
  if(querydata.hasOwnProperty('userid') == false){
     return helper.getErrorResponse(false,"User id missing.","ACKNOWLEDGED EVENTS FETCHED SUCCESSFULLY",secret);
  }
  const offset = helper.getOffset(page, config.eventlistpage);
  const sql = await db.query(`
  SELECT em.Event_ID, em.Event_Name, bm.whatsappgroupname, em.Row_updated_date,
         DATE_FORMAT(em.enddate, '%Y-%m-%d %H:%i:%s') AS eventtime, em.Alertmessage, em.IsHumanDetected,
         cm.camera_id, cm.camera_name, dm.device_name, dm.IP_Domain, dm.RTSP_port, dm.IP_port, dm.IP_Uname, 
         dm.IP_Pwd, dm.short_name, dm.SDK_ID, dm.device_id, dt.Dept_name, dt.Dept_Location,
         dc.Name1, dc.Contact_mobile1, dc.Contact_Email1,dc.Name2, dc.Contact_mobile2, dc.Contact_Email2,dc.Name3, dc.Contact_mobile3, dc.Contact_Email3,dc.User_role1, dc.User_role2, dc.User_role3, bm.Branch_name, bm.site_starttime AS 
         Notifytime, 
         bm.contact_person, cm.Camera_Status, ep.imagepath, el.feedback, el.Row_upd_date,CASE WHEN EXISTS (SELECT 1 FROM ecsmaster ec WHERE ec.site_id = bm.branch_id and status = 1 and ECStype 
         = 'Two way') THEN TRUE
         ELSE FALSE END AS twoway_status,CASE WHEN EXISTS (SELECT 1 FROM ecsmaster ec WHERE ec.site_id = bm.branch_id and status = 1 and ECStype = 'PA system') THEN TRUE
         ELSE FALSE END AS oneway_status FROM eventmaster em JOIN cameramaster cm ON cm.camera_id = em.analyticsource_id
         JOIN devicemaster dm ON dm.device_id = cm.device_id JOIN deptmaster dt ON dt.dept_id = dm.dept_id LEFT JOIN deptcontacts dc ON dc.dept_id = dt.dept_id
         JOIN branchmaster bm ON bm.branch_id = dt.branch_id
         LEFT JOIN (SELECT Event_ID, MIN(eventpath) AS imagepath FROM eventstatus GROUP BY Event_ID) ep ON ep.Event_ID = em.Event_ID JOIN eventlog el ON el.event_id = em.Event_ID
         WHERE EXISTS (SELECT 1 FROM eventuser eu WHERE eu.user_id = ${querydata.userid} AND eu.Event_id = em.Event_ID) ORDER BY el.Row_upd_date DESC LIMIT ${offset}, ${config.eventlistpage}`);


 if(sql[0]){
  return helper.getSuccessResponse(true,'SUCCESS',sql,secret);
 }else{
  return helper.getErrorResponse(false,"Please Acknowledge the events. There is no acknowledged events","ACKNOWLEDGED EVENTS FETCHED SUCCESSFULLY",secret);
 }
}catch(er){
  return helper.getErrorResponse(false,"Internal error. Please contact Administration",er,secret);
}
}



//#####################################################################################################################################################################################################
//#####################################################################################################################################################################################################
//####################################################################################################################################################################################################

async function CheckCameraActive(event){
  try{
    if(event.hasOwnProperty('STOKEN')==false){
      return helper.getErrorResponse(false,"Login sessiontoken missing. Please provide the Login sessiontoken","CHECK CAMERA ACTIVE STATUS","");
    }
    //CHECK IF THE SESSIONTOKEN SIZE IS VALID OR NOT
    if(event.STOKEN.length > 50 || event.STOKEN.length  < 30){
      return helper.getErrorResponse(false,"Login sessiontoken size invalid. Please provide the valid Sessiontoken","CHECK CAMERA ACTIVE STATUS","");
    }
    // CHECK IF THE GIVEN SESSIONTOKEN IS VALID OR NOT
    const [result] =await db.spcall('CALL SP_STOKEN_CHECK(?,@result,@custid,@custname,@custemail); select @result,@custid,@custname,@custemail',[event.STOKEN]);
    const objectvalue = result[1][0];
    const userid = objectvalue["@result"];
    // // console("event list userid ->"+ userid);
    if(userid == null){
      return helper.getErrorResponse(false,"Login sessiontoken Invalid. Please provide the valid sessiontoken","CHECK CAMERA ACTIVE STATUS","");
    }
  
     //BEGIN VALIDATION 2
  // CHECK IF THE QUERYSTRING IS GIVEN AS AN INPUT
  if(event.hasOwnProperty("querystring")==false){
    return helper.getErrorResponse(false,"Querystring missing. Please provide the querystring","CHECK CAMERA ACTIVE STATUS","");
  }
  var secret=event.STOKEN.substring(0,16);

  var querydata;
  
  try{ 
     querydata = await helper.decrypt(event.querystring,secret);
    //  // console("decrypted querydata->"+querydata);
  }
  catch(ex){
    return helper.getErrorResponse(false,"Querystring Invalid error. Please provide the valid querystring.","CHECK CAMERA ACTIVE STATUS",secret);
  }
  try{
    querydata= JSON.parse(querydata);
  }
  catch(ex){
    return helper.getErrorResponse(false,"Querystring JSON error. Please provide the valid JSON","CHECK CAMERA ACTIVE STATUS",secret);
  } 
  if(querydata.hasOwnProperty('channelno') == false){
     return helper.getErrorResponse(false,"Channel number missing.Please provide the valid phone number.","CHECK CAMERA ACTIVE STATUS",secret);
  }
  if(querydata.hasOwnProperty('deviceid') == false){
    return helper.getErrorResponse(false,"Device id missing.Please provide the valid device id.","CHECK CAMERA ACTIVE STATUS",secret);
 }
  // const offset = helper.getOffset(page, config.listPerPage);
  const [sql] = await db.spcall(`CALL getIsCamActive(?,?,@isactive); select @isactive`,[querydata.channelno,querydata.deviceid]);
  const objectvalue1 = sql[1][0];
  
 if(objectvalue1["@isactive"] != null){
  return helper.getSuccessResponse(true,'SUCCESS',objectvalue1["@isactive"],secret);
 }else{
  return helper.getErrorResponse(false,"Camera not available. Please check the channel number.","CHECK CAMERA ACTIVE STATUS",secret);
 }
}catch(er){
  return helper.getErrorResponse(false,"Internal error. Please contact Administration",er,secret);
}
}


//#####################################################################################################################################################################################################
//#####################################################################################################################################################################################################
//####################################################################################################################################################################################################

async function WhatsappWall(event){
  try{
    if(event.hasOwnProperty('STOKEN')==false){
      return helper.getErrorResponse(false,"Login sessiontoken missing. Please provide the Login sessiontoken","CHECK WHATSAPP GROUP","");
    }
    //CHECK IF THE SESSIONTOKEN SIZE IS VALID OR NOT
    if(event.STOKEN.length > 50 || event.STOKEN.length  < 30){
      return helper.getErrorResponse(false,"Login sessiontoken size invalid. Please provide the valid Sessiontoken","CHECK WHATSAPP GROUP","");
    }
    // CHECK IF THE GIVEN SESSIONTOKEN IS VALID OR NOT
    const [result] =await db.spcall('CALL SP_STOKEN_CHECK(?,@result,@custid,@custname,@custemail); select @result,@custid,@custname,@custemail',[event.STOKEN]);
    const objectvalue = result[1][0];
    const userid = objectvalue["@result"];
    // // console("event list userid ->"+ userid);
    if(userid == null){
      return helper.getErrorResponse(false,"Login sessiontoken Invalid. Please provide the valid sessiontoken","CHECK WHATSAPP GROUP","");
    }
  
     //BEGIN VALIDATION 2
  // CHECK IF THE QUERYSTRING IS GIVEN AS AN INPUT
  if(event.hasOwnProperty("querystring")==false){
    return helper.getErrorResponse(false,"Querystring missing. Please provide the querystring","CHECK WHATSAPP GROUP","");
  }
  var secret=event.STOKEN.substring(0,16);

  var querydata;
  
  try{ 
     querydata = await helper.decrypt(event.querystring,secret);
    //  // console("decrypted querydata->"+querydata);
  }
  catch(ex){
    return helper.getErrorResponse(false,"Querystring Invalid error. Please provide the valid querystring.","CHECK WHATSAPP GROUP",secret);
  }
  try{
    querydata= JSON.parse(querydata);
  }
  catch(ex){
    return helper.getErrorResponse(false,"Querystring JSON error. Please provide the valid JSON","CHECK WHATSAPP GROUP",secret);
  } 
  if(querydata.hasOwnProperty('cameraid') == false){
     return helper.getErrorResponse(false,"Camera id missing.Please provide the valid Camera id.","CHECK WHATSAPP GROUP",secret);
  }
  
  // const sql = await db.query(`select camera_id from groupcameras where group_id = ${querydata.groupid};`);
  // if(sql.length > 0){
      //  const cameraIds = sql.map(row => row.camera_id).join(",");
       const sql1 = await db.query(`select DISTINCT whatsappgroupname from branchmaster where branch_id IN(select Branch_id from deptmaster where dept_id in(select place from cameramaster where camera_id IN(${querydata.cameraid})));`);
       if (sql1.length === 1) {
        // All cameras belong to the same site
        return helper.getSuccessResponse(true, sql1[0].whatsappgroupname, "CHECK WHATSAPP GROUP", secret);
      } else {
        // Cameras belong to different sites
        return helper.getErrorResponse(false, "Cameras belong to different sites", "CHECK WHATSAPP GROUP", secret);
      }
  //     }else{
  //   return helper.getErrorResponse(false,"Invalid group id. Please provide the valid group id","CHECK WHATSAPP GROUP",secret);
  // }
  // const offset = helper.getOffset(page, config.listPerPage);

}catch(er){
  return helper.getErrorResponse(false,"Internal error. Please contact Administration",er,secret);
}
}

//#####################################################################################################################################################################################################
//#####################################################################################################################################################################################################
//####################################################################################################################################################################################################

async function GetEventCount(event){
  try {
    if(event.hasOwnProperty('STOKEN')==false){
      return helper.getErrorResponse(false,"Login sessiontoken missing. Please provide the Login sessiontoken","GET EVENT COUNT","");
    }
    //CHECK IF THE SESSIONTOKEN SIZE IS VALID OR NOT
    if(event.STOKEN.length > 50 || event.STOKEN.length  < 30){
      return helper.getErrorResponse(false,"Login sessiontoken size invalid. Please provide the valid Sessiontoken","GET EVENT COUNT","");
    }
    // CHECK IF THE GIVEN SESSIONTOKEN IS VALID OR NOT
    const [result] =await db.spcall('CALL SP_STOKEN_CHECK(?,@result,@custid,@custname,@custemail); select @result,@custid,@custname,@custemail',[event.STOKEN]);
    const objectvalue = result[1][0];
    const userid = objectvalue["@result"];
    if(userid == null){
      return helper.getErrorResponse(false,"Login sessiontoken Invalid. Please provide the valid sessiontoken","GET EVENT COUNT","");
    }
    var secret=event.STOKEN.substring(0,16);
   const sql = await db.query(`SELECT um.username,COALESCE(eu.totalevents, 0) AS totalevents,COALESCE(el.ackevent, 0) AS ackevent,COALESCE(ua.unackevent, 0) AS unackevent,
   COALESCE(wl.whatsapp, 0) AS whatsapp FROM usermaster um LEFT JOIN (SELECT eu.user_id, COUNT(DISTINCT eu.event_id) AS totalevents FROM eventuser eu
   INNER JOIN eventmaster em ON eu.event_id = em.event_id GROUP BY eu.user_id) eu ON eu.user_id = um.user_id LEFT JOIN ( SELECT el.created_by AS user_id,
   COUNT(DISTINCT el.event_id) AS ackevent FROM eventlog el INNER JOIN eventmaster em ON el.event_id = em.event_id GROUP BY el.created_by) el ON el.user_id = um.user_id
   LEFT JOIN (SELECT eu.user_id,COUNT(DISTINCT eu.event_id) AS unackevent FROM eventuser eu INNER JOIN eventmaster em ON eu.event_id = em.event_id
   LEFT JOIN eventlog el ON eu.event_id = el.event_id AND eu.user_id = el.created_by WHERE el.event_id IS NULL GROUP BY eu.user_id
   ) ua ON ua.user_id = um.user_id LEFT JOIN ( SELECT wl.user_id,COUNT(DISTINCT wl.event_id) AS whatsapp FROM whatsapplog wl INNER JOIN eventmaster em ON wl.event_id = em.event_id 
  GROUP BY wl.user_id) wl ON wl.user_id = um.user_id 
   WHERE um.user_id = ${userid}`);
    const sql1 = await db.query(`select SEC_TO_TIME(SUM(TIMESTAMPDIFF(SECOND, break_time,Break_finished_time))) as total_break from usersbreak where user_id = ${userid}`);
    try
    {
      const returnstr = JSON.stringify({code : true,message : 'Event count Fetched Successfully',Value: sql,Breaktime :sql1});
      if (secret!="")
      {

        const encryptedResponse = helper.encrypt(returnstr,secret);
        // // console("returnstr=>"+JSON.stringify(encryptedResponse));
        return {encryptedResponse};
      }
      else
      {
        return ({code : true,message : 'Event count Fetched Successfully',Value: sql,Breaktime :sql1});
      }
    }
    catch(Ex)
    {
      return ({code : true,message : 'Event count Fetched Successfully',Value: sql,Breaktime :sql1});
    }
            return helper.getSuccessResponse(true,'Event count Fetched Successfully',sql,secret);
            // return helper.getSuccessResponse(true,'Event count Fetched Successfully',sql,secret);

  } catch (er) {
    return helper.getErrorResponse(false,"Internal error. Please contact Administration",er,secret);
  }
}



//#####################################################################################################################################################################################################
//#####################################################################################################################################################################################################
//####################################################################################################################################################################################################

async function GetBreakDuration(event){
  try {
    if(event.hasOwnProperty('STOKEN')==false){
      return helper.getErrorResponse(false,"Login sessiontoken missing. Please provide the Login sessiontoken","GET EVENT COUNT","");
    }
    //CHECK IF THE SESSIONTOKEN SIZE IS VALID OR NOT
    if(event.STOKEN.length > 50 || event.STOKEN.length  < 30){
      return helper.getErrorResponse(false,"Login sessiontoken size invalid. Please provide the valid Sessiontoken","GET EVENT COUNT","");
    }
    // CHECK IF THE GIVEN SESSIONTOKEN IS VALID OR NOT
    const [result] =await db.spcall('CALL SP_STOKEN_CHECK(?,@result,@custid,@custname,@custemail); select @result,@custid,@custname,@custemail',[event.STOKEN]);
    const objectvalue = result[1][0];
    const userid = objectvalue["@result"];
    if(userid == null){
      return helper.getErrorResponse(false,"Login sessiontoken Invalid. Please provide the valid sessiontoken","GET EVENT COUNT","");
    }
    var secret=event.STOKEN.substring(0,16);
    const sql = await db.query(`select SEC_TO_TIME(SUM(TIMESTAMPDIFF(SECOND, break_time,Break_finished_time))) as total_break from usersbreak where user_id = ${userid}`);
    if(sql[0]){
      return helper.getSuccessResponse(true,"Break Fetched Successfully",sql,secret);
    }else{
      return helper.getErrorResponse(false,"No break time Available",sql,secret);;
    }
  } catch (er) {     
    return helper.getErrorResponse(false,"Internal error. Please contact Administration",er,secret);
  }
}

//#####################################################################################################################################################################################################
//#####################################################################################################################################################################################################
//####################################################################################################################################################################################################

async function AddEventforAI(event){
  try {
    if(event.hasOwnProperty('STOKEN')==false){
      return helper.getErrorResponse(false,"Login sessiontoken missing. Please provide the Login sessiontoken","ADD EVENT FOR AI","");
    }
    //CHECK IF THE SESSIONTOKEN SIZE IS VALID OR NOT
    if(event.STOKEN.length > 50 || event.STOKEN.length  < 30){
      return helper.getErrorResponse(false,"Login sessiontoken size invalid. Please provide the valid Sessiontoken","ADD EVENT FOR AI","");
    }
    // CHECK IF THE GIVEN SESSIONTOKEN IS VALID OR NOT
    const [result] =await db.spcall('CALL SP_STOKEN_CHECK(?,@result,@custid,@custname,@custemail); select @result,@custid,@custname,@custemail',[event.STOKEN]);
    const objectvalue = result[1][0];
    const userid = objectvalue["@result"];
    if(userid == null){
      return helper.getErrorResponse(false,"Login sessiontoken Invalid. Please provide the valid sessiontoken","ADD EVENT FOR AI","");
    }
    var secret=event.STOKEN.substring(0,16);
      // CHECK IF THE QUERYSTRING IS GIVEN AS AN INPUT
  if(event.hasOwnProperty("querystring")==false){
    return helper.getErrorResponse(false,"Querystring missing. Please provide the querystring","ADD EVENT FOR AI","");
  }
  var secret=event.STOKEN.substring(0,16);

  var querydata;
  
  try{ 
     querydata = await helper.decrypt(event.querystring,secret);
    //  // console("decrypted querydata->"+querydata);
  }
  catch(ex){
    return helper.getErrorResponse(false,"Querystring Invalid error. Please provide the valid querystring.","ADD EVENT FOR AI",secret);
  }
  try{
    querydata= JSON.parse(querydata);
  }
  catch(ex){
    return helper.getErrorResponse(false,"Querystring JSON error. Please provide the valid JSON","ADD EVENT FOR AI",secret);
  } 
  if(querydata.hasOwnProperty('eventid') == false){
     return helper.getErrorResponse(false,"Event id missing. Please provide the valid Event id.","ADD EVENT FOR AI",secret);
  }
  if(querydata.hasOwnProperty('imagepath') == false){
    return helper.getErrorResponse(false,"Image path missing. Please provide the valid image path.","ADD EVENT FOR AI",secret);
 }
    const sql = await db.query(`INSERT INTO eventuser(event_id,user_id,event_path) values(?,?,?)`,[querydata.eventid,userid,querydata.imagepath]);
    const sql1 = await db.query(`INSERT INTO eventstatus(event_id,event_status,eventpath) values(?,?,?)`,[querydata.eventid,1,querydata.imagepath]);
    const sql2 = await db.query1(`Insert into eventaistatus(event_id, camera_id,detected_file,event_timeout) VALUES (?, ?, ?,?);`,[querydata.eventid, userid, querydata.imagepath,0]);
    if(sql.affectedRows){
      return helper.getSuccessResponse(true,"Event added Successfully",sql,secret);
    }else{
      return helper.getErrorResponse(false,"Error adding the Event",sql,secret);;
    }
  } catch (er) {
    return helper.getErrorResponse(false,"Internal error. Please contact Administration",er,secret);
  }
}

//#####################################################################################################################################################################################################
//#####################################################################################################################################################################################################
//####################################################################################################################################################################################################

async function FetchWhatsappbyCam(event){
  try {
    if(event.hasOwnProperty('STOKEN')==false){
      return helper.getErrorResponse(false,"Login sessiontoken missing. Please provide the Login sessiontoken","FETCH WHATSAPP GROUP FOR CAMERA ID","");
    }
    //CHECK IF THE SESSIONTOKEN SIZE IS VALID OR NOT
    if(event.STOKEN.length > 50 || event.STOKEN.length  < 30){
      return helper.getErrorResponse(false,"Login sessiontoken size invalid. Please provide the valid Sessiontoken","FETCH WHATSAPP GROUP FOR CAMERA ID","");
    }
    // CHECK IF THE GIVEN SESSIONTOKEN IS VALID OR NOT
    const [result] =await db.spcall('CALL SP_STOKEN_CHECK(?,@result,@custid,@custname,@custemail); select @result,@custid,@custname,@custemail',[event.STOKEN]);
    const objectvalue = result[1][0];
    const userid = objectvalue["@result"];
    if(userid == null){
      return helper.getErrorResponse(false,"Login sessiontoken Invalid. Please provide the valid sessiontoken","FETCH WHATSAPP GROUP FOR CAMERA ID","");
    }
    var secret=event.STOKEN.substring(0,16);
      // CHECK IF THE QUERYSTRING IS GIVEN AS AN INPUT
  if(event.hasOwnProperty("querystring")==false){
    return helper.getErrorResponse(false,"Querystring missing. Please provide the querystring","FETCH WHATSAPP GROUP FOR CAMERA ID","");
  }
  var secret=event.STOKEN.substring(0,16);

  var querydata;
  
  try{ 
     querydata = await helper.decrypt(event.querystring,secret);
    //  // console("decrypted querydata->"+querydata);
  }
  catch(ex){
    return helper.getErrorResponse(false,"Querystring Invalid error. Please provide the valid querystring.","FETCH WHATSAPP GROUP FOR CAMERA ID",secret);
  }
  try{
    querydata= JSON.parse(querydata);
  }
  catch(ex){
    return helper.getErrorResponse(false,"Querystring JSON error. Please provide the valid JSON","FETCH WHATSAPP GROUP FOR CAMERA ID",secret);
  } 
  if(querydata.hasOwnProperty('cameraid') == false){
     return helper.getErrorResponse(false,"Camera id missing. Please provide the valid Camera id.","FETCH WHATSAPP GROUP FOR CAMERA ID",secret);
  }
  
    const sql = await db.query(`select bm.Branch_name, bm.Branch_id, bm.whatsappgroupname,dm.device_name from branchmaster bm,Deptmaster dt,devicemaster dm,cameramaster cm where bm.Branch_id = dt.branch_id and dt.dept_id = dm.Dept_id and dm.Device_id = cm.Device_id and cm.camera_id IN(?) LIMIT 1`,[querydata.cameraid]);
    if(sql[0]){
      return helper.getSuccessResponse(true,"Whatsapp Group Fetched Successfully",sql,secret);
    }else{
      return helper.getErrorResponse(false,"There is No Whatsappgroup",sql,secret);;
    }
  } catch (er) {
    return helper.getErrorResponse(false,"Internal error. Please contact Administration",er,secret);
  }
}

//###############################################################################################################################################################################################
//###############################################################################################################################################################################################
//###############################################################################################################################################################################################

// async function userDailyReport(event){
//   try {
//     if(event.hasOwnProperty('STOKEN')==false){
//       return helper.getErrorResponse(false,"Login sessiontoken missing. Please provide the Login sessiontoken","FETCH REPORT OF THE USER","");
//     }
//     //CHECK IF THE SESSIONTOKEN SIZE IS VALID OR NOT
//     if(event.STOKEN.length > 50 || event.STOKEN.length  < 30){
//       return helper.getErrorResponse(false,"Login sessiontoken size invalid. Please provide the valid Sessiontoken","FETCH REPORT OF THE USER","");
//     }
//     // CHECK IF THE GIVEN SESSIONTOKEN IS VALID OR NOT
//     const [result] =await db.spcall('CALL SP_STOKEN_CHECK(?,@result,@custid,@custname,@custemail); select @result,@custid,@custname,@custemail',[event.STOKEN]);
//     const objectvalue = result[1][0];
//     const userid = objectvalue["@result"];
//     if(userid == null){
//       return helper.getErrorResponse(false,"Login sessiontoken Invalid. Please provide the valid sessiontoken","FETCH REPORT OF THE USER","");
//     }
//     var secret=event.STOKEN.substring(0,16);
//       // CHECK IF THE QUERYSTRING IS GIVEN AS AN INPUT
//   if(event.hasOwnProperty("querystring")==false){
//     return helper.getErrorResponse(false,"Querystring missing. Please provide the querystring","FETCH REPORT OF THE USER","");
//   }
//   var secret=event.STOKEN.substring(0,16);

//   var querydata;
  
//   try{ 
//      querydata = await helper.decrypt(event.querystring,secret);
//     //  // console("decrypted querydata->"+querydata);
//   }
//   catch(ex){
//     return helper.getErrorResponse(false,"Querystring Invalid error. Please provide the valid querystring.","FETCH REPORT OF THE USER",secret);
//   }
//   try{
//     querydata= JSON.parse(querydata);
//   }
//   catch(ex){
//     return helper.getErrorResponse(false,"Querystring JSON error. Please provide the valid JSON","FETCH REPORT OF THE USER",secret);
//   } 
//   if(querydata.hasOwnProperty('reportdate') == false){
//      return helper.getErrorResponse(false,"Report Date missing. Please provide the valid report date.","FETCH REPORT OF THE USER",secret);
//   }
//   const reportDate = new Date(querydata.reportdate); 
//   if (isNaN(reportDate.getTime())) {
//    return helper.getErrorResponse(false, "Invalid report date format.", "FETCH REPORT OF THE USER", secret);
//   }
//   const endDate = new Date(reportDate);
//   endDate.setDate(endDate.getDate() + 1);

// // Format both dates to 'YYYY-MM-DD 07:10:00'
// function formatDate(date) {
//   const yyyy = date.getFullYear();
//   const mm = ('0' + (date.getMonth() + 1)).slice(-2);
//   const dd = ('0' + date.getDate()).slice(-2);
//   return `${yyyy}-${mm}-${dd} 11:59:00`;
// }
// function logindate(date) {
//   const yyyy = date.getFullYear();
//   const mm = ('0' + (date.getMonth() + 1)).slice(-2);
//   const dd = ('0' + date.getDate()).slice(-2);
//   return `${yyyy}-${mm}-${dd} 12:00:00`;
// }

// function userbreak(date) {
//   const yyyy = date.getFullYear();
//   const mm = ('0' + (date.getMonth() + 1)).slice(-2);
//   const dd = ('0' + date.getDate()).slice(-2);
//   return `${yyyy}-${mm}-${dd} 12:00:00`;
// }

// const startDatetime = logindate(reportDate); // '2025-04-03 07:10:00'
// const endDatetime = formatDate(endDate);
// const logintime = logindate(reportDate);
// const breakstarttime = userbreak(reportDate);

// const startTime = new Date(startDatetime);
// const endTime = new Date(endDatetime);
// const currentDate = new Date();
// const currentDay = helper.formatDate(currentDate, 'yyyyMMdd');
// const currentHour = currentDate.getHours();
// // Decide archive date based on event start time:
// // If event occurs at or after 12:00, the event is archived using next day’s date.
// let archiveDate;
// if (startTime.getHours() >= 12) {
//   let nextDay = new Date(startTime);
//   nextDay.setDate(nextDay.getDate() + 1);
//   archiveDate = helper.formatDate(nextDay, 'yyyyMMdd');
// } else {
//   archiveDate = helper.formatDate(startTime, 'yyyyMMdd');
// }

// // Determine which tables to use.
// const startDay = helper.formatDate(startTime, 'yyyyMMdd');
// const endDay = helper.formatDate(endTime, 'yyyyMMdd');
// let eventTable, logTable, whatsappTable, eventaistatus,eventuserstatus,userbreaks;
// if (startDay < currentDay && endDay < currentDay) {
//   // Both dates in the past: use archived tables with the computed archiveDate.
//   eventTable = `eventmaster_${archiveDate}`;
//   logTable = `eventlog_${archiveDate}`;
//   whatsappTable = `whatsapplog_${archiveDate}`;
//   eventaistatus = `eventaistatus_${archiveDate}`;
//   eventuserstatus = `eventuser_${archiveDate}`;
//   userbreaks = `usersbreak_${archiveDate}`;
// } else if (startDay === currentDay && (currentHour <= 12 || currentHour >= 18)) {
//   // For the current day, use live tables (so you get full time details).
//   eventTable = `eventmaster`;
//   logTable = `eventlog`;
//   whatsappTable = `whatsapplog`;
//   eventaistatus = `eventaistatus`;
//   eventuserstatus = `eventuser`;
//   userbreaks = `usersbreak`;
// } else if (startDay > currentDay && endDay > currentDay) {
//   // Future dates: use live tables.
//   eventTable = `eventmaster`;
//   logTable = `eventlog`;
//   whatsappTable = `whatsapplog`;
//   eventaistatus = `eventaistatus`;
//   eventuserstatus = `eventuser`;
//   userbreaks = `usersbreak`;
// } else {
//   if (currentHour < 12) {
//     // Before noon: use live tables.
//     eventTable = 'eventmaster';
//     logTable = 'eventlog';
//     whatsappTable = 'whatsapplog';
//     eventaistatus = 'eventaistatus';
//     eventuserstatus = `eventuser`;
//     userbreaks = `usersbreak`;
//   }else{
//   // Spanning dates: use UNION of archived and live tables.
//   eventTable = `eventmaster_${archiveDate}`;
//   logTable = `eventlog_${archiveDate}`;
//   whatsappTable = `whatsapplog_${archiveDate}`;
//   eventaistatus = `eventaistatus_${archiveDate}`;
//   eventuserstatus = `eventuser_${archiveDate}`;
//   userbreaks = `usersbreak_${archiveDate}`;
//   }
// } 
// var sql;

//   try{
//      sql = await db.query(`SELECT um.user_id,um.username,COALESCE(ul.first_logged_in, 'N/A') AS first_login_time, COALESCE(ul.last_logged_out, 'N/A') AS last_logout_time,COALESCE(SUM(ub.break_duration_minutes), 0) AS availed_break_time,
//     '01:00:00' AS allowed_break_time, COALESCE(eu.totalevent, 0) AS total_events, COALESCE(el.ackevent, 0) AS acknowledged_events,(COALESCE(eu.totalevent, 0) - COALESCE(el.ackevent, 0)) AS unacknowledged_events,
//     COALESCE(wl.whatsapp, 0) AS whatsapp_events FROM usermaster um LEFT JOIN ( SELECT user_id,COUNT(DISTINCT event_id) AS totalevent FROM ${eventuserstatus} WHERE Row_updated_date BETWEEN ? AND ?
//     GROUP BY user_id) eu ON eu.user_id = um.user_id LEFT JOIN (SELECT Created_by AS user_id,COUNT(DISTINCT event_id) AS ackevent FROM ${logTable} WHERE Row_upd_date BETWEEN ? AND ?
//     GROUP BY Created_by) el ON el.user_id = um.user_id LEFT JOIN (SELECT user_id,COUNT(DISTINCT event_id) AS whatsapp FROM ${whatsappTable}  WHERE Row_updated_date BETWEEN ? AND ?
//     GROUP BY user_id) wl ON wl.user_id = um.user_id LEFT JOIN (SELECT  user_id,  MIN(logged_in) AS first_logged_in,MAX(logged_out) AS last_logged_out FROM userlog WHERE deleted_flag = 0 AND logged_in >= ? AND (logged_out <= ? OR logged_out IS NULL) GROUP BY user_id
//     ) ul ON ul.user_id = um.user_id LEFT JOIN (SELECT user_id, SUM(TIMESTAMPDIFF(MINUTE, Break_time, Break_finished_time)) AS break_duration_minutes FROM ${userbreaks} WHERE Row_updated_date >= ?
//     GROUP BY user_id) ub ON ub.user_id = um.user_id WHERE um.user_design IN ('executive', 'supervisor', 'administrator') AND um.status = 1 AND um.Customer_ID = 0 AND eu.totalevent > 0
//     GROUP BY um.user_id, um.username, ul.first_logged_in, ul.last_logged_out;
//     `,[startDatetime,endDatetime,startDatetime,endDatetime,startDatetime,endDatetime,logintime,endDatetime,breakstarttime]);
//   }catch(er){
//     return helper.getErrorResponse(false,"There is no Report to show",er.message,secret);
//   }

//     if(sql[0]){
//       return helper.getSuccessResponse(true,"User's Daily report Fetched Successfully",sql,secret);
//     }else{
//       return helper.getErrorResponse(false,"There is no Report to show",sql,secret);
//     }
    
//   } catch (er) {
//     return helper.getErrorResponse(false,"Internal error. Please contact Administration",er,secret);
//   }
// }

async function userDailyReport(event){
  try {
    if(event.hasOwnProperty('STOKEN')==false){
      return helper.getErrorResponse(false,"Login sessiontoken missing. Please provide the Login sessiontoken","FETCH REPORT OF THE USER","");
    }
    //CHECK IF THE SESSIONTOKEN SIZE IS VALID OR NOT
    if(event.STOKEN.length > 50 || event.STOKEN.length  < 30){
      return helper.getErrorResponse(false,"Login sessiontoken size invalid. Please provide the valid Sessiontoken","FETCH REPORT OF THE USER","");
    }
    // CHECK IF THE GIVEN SESSIONTOKEN IS VALID OR NOT
    const [result] =await db.spcall('CALL SP_STOKEN_CHECK(?,@result,@custid,@custname,@custemail); select @result,@custid,@custname,@custemail',[event.STOKEN]);
    const objectvalue = result[1][0];
    const userid = objectvalue["@result"];
    if(userid == null){
      return helper.getErrorResponse(false,"Login sessiontoken Invalid. Please provide the valid sessiontoken","FETCH REPORT OF THE USER","");
    }
    var secret=event.STOKEN.substring(0,16);
      // CHECK IF THE QUERYSTRING IS GIVEN AS AN INPUT
  if(event.hasOwnProperty("querystring")==false){
    return helper.getErrorResponse(false,"Querystring missing. Please provide the querystring","FETCH REPORT OF THE USER","");
  }
  var secret=event.STOKEN.substring(0,16);

  var querydata;
  
  try{ 
     querydata = await helper.decrypt(event.querystring,secret);
    //  // console("decrypted querydata->"+querydata);
  }
  catch(ex){
    return helper.getErrorResponse(false,"Querystring Invalid error. Please provide the valid querystring.","FETCH REPORT OF THE USER",secret);
  }
  try{
    querydata= JSON.parse(querydata);
  }
  catch(ex){
    return helper.getErrorResponse(false,"Querystring JSON error. Please provide the valid JSON","FETCH REPORT OF THE USER",secret);
  } 
  // querydata = {startdate:"2025-06-07 18:00:00",enddate:"2025-06-08 18:00:00"};
  if(querydata.hasOwnProperty('startdate') == false){
     return helper.getErrorResponse(false,"Start Date missing. Please provide the valid Start date.","FETCH REPORT OF THE USER",secret);
  }

  if(querydata.hasOwnProperty('enddate') == false){
    return helper.getErrorResponse(false,"End Date missing. Please provide the valid end date.","FETCH REPORT OF THE USER",secret);
 }

//  const offset = helper.getOffset(page, config.listPerPage);
    const startTime = new Date(querydata.startdate);
    const endTime = new Date(querydata.enddate);
    const currentDate = new Date();
    const currentDay = helper.formatDate(currentDate, 'yyyyMMdd');
    const currentHour = currentDate.getHours();
    const previousDay = helper.formatDate(new Date(Date.now() - 86400000), 'yyyyMMdd');
    
    let archiveDate;
    if (startTime.getHours() >= 12) {
      let nextDay = new Date(startTime);
      nextDay.setDate(nextDay.getDate() + 1);
      archiveDate = helper.formatDate(nextDay, 'yyyyMMdd');
    } else {
      archiveDate = helper.formatDate(startTime, 'yyyyMMdd');
    }
    
    const startDay = helper.formatDate(startTime, 'yyyyMMdd');
    const endDay = helper.formatDate(endTime, 'yyyyMMdd');
    
    let eventTable, logTable, whatsappTable, eventaistatus, eventuserstatus, userbreaks;
    
    if (startDay === endDay) {
      // Single day
      if (startDay === currentDay) {
        // Today
        if (currentHour >= 12 && startTime.getHours() < 12) {
          // Between morning & noon of same day — mix archive & live
          eventTable = `(SELECT * FROM eventmaster_${currentDay} UNION ALL SELECT * FROM eventmaster)`;
          logTable = `(SELECT * FROM eventlog_${currentDay} UNION ALL SELECT * FROM eventlog)`;
          whatsappTable = `(SELECT * FROM whatsapplog_${currentDay} UNION ALL SELECT * FROM whatsapplog)`;
          eventaistatus = `(SELECT * FROM eventaistatus_${currentDay} UNION ALL SELECT * FROM eventaistatus)`;
          eventuserstatus = `(SELECT * FROM eventuser_${currentDay} UNION ALL SELECT * FROM eventuser)`;
          userbreaks = `(SELECT * FROM usersbreak_${currentDay} UNION ALL SELECT * FROM usersbreak)`;
        } else if (currentHour < 12 && startTime.getHours() < 12) {
          // Early morning only
          eventTable = `eventmaster`;
          logTable = `eventlog`;
          whatsappTable = `whatsapplog`;
          eventaistatus = `eventaistatus`;
          eventuserstatus = `eventuser`;
          userbreaks = `usersbreak`;
        }
        else if (currentHour >= 12 && startTime.getHours() >= 12 && endTime.getHours() < 24) {
          // Early morning only
          eventTable = `eventmaster`;
          logTable = `eventlog`;
          whatsappTable = `whatsapplog`;
          eventaistatus = `eventaistatus`;
          eventuserstatus = `eventuser`;
          userbreaks = `usersbreak`;
        } else {
          // After 12 noon
          eventTable = `eventmaster_${currentDay}`;
          logTable = `eventlog_${currentDay}`;
          whatsappTable = `whatsapplog_${currentDay}`;
          eventaistatus = `eventaistatus_${currentDay}`;
          eventuserstatus = `eventuser_${currentDay}`;
          userbreaks = `usersbreak_${currentDay}`;
        }
      } else if (startDay == previousDay && currentHour < 12) {
        // Yesterday before noon = still live
        eventTable = `eventmaster`;
        logTable = `eventlog`;
        whatsappTable = `whatsapplog`;
        eventaistatus = `eventaistatus`;
        eventuserstatus = `eventuser`;
        userbreaks = `usersbreak`;
      } else if(startDay == previousDay && endDay == previousDay && currentHour >= 12 && startTime.getHours() >= 12 && endTime.getHours() < 24){
        // Archived
        eventTable = `eventmaster_${currentDay}`;
        logTable = `eventlog_${currentDay}`;
        whatsappTable = `whatsapplog_${currentDay}`;
        eventaistatus = `eventaistatus_${currentDay}`;
        eventuserstatus = `eventuser_${currentDay}`;
        userbreaks = `usersbreak_${currentDay}`;
      }else{
        // Archived
        eventTable = `eventmaster_${endDay}`;
        logTable = `eventlog_${endDay}`;
        whatsappTable = `whatsapplog_${endDay}`;
        eventaistatus = `eventaistatus_${endDay}`;
        eventuserstatus = `eventuser_${endDay}`;
        userbreaks = `usersbreak_${currentDay}`;
      }
    } else {
      // Multi-day range
      if (endDay < currentDay) {
        // Totally archived
        eventTable = `(SELECT * FROM eventmaster_${startDay} UNION ALL SELECT * FROM eventmaster_${endDay})`;
        logTable = `(SELECT * FROM eventlog_${startDay} UNION ALL SELECT * FROM eventlog_${endDay})`;
        whatsappTable = `(SELECT * FROM whatsapplog_${startDay} UNION ALL SELECT * FROM whatsapplog_${endDay})`;
        eventaistatus = `(SELECT * FROM eventaistatus_${startDay} UNION ALL SELECT * FROM eventaistatus_${endDay})`;
        eventuserstatus = `(SELECT * FROM eventuser_${startDay} UNION ALL SELECT * FROM eventuser_${endDay})`;
        userbreaks = `(SELECT * FROM usersbreak_${startDay} UNION ALL SELECT * FROM usersbreak_${endDay})`;
      } else if (startDay < currentDay && endDay === currentDay) {
        // Spanning archive + today
        if (currentHour < 12) {
          // Still before noon → use live
          eventTable = `eventmaster`;
          logTable = `eventlog`;
          whatsappTable = `whatsapplog`;
          eventaistatus = `eventaistatus`;
          eventuserstatus = `eventuser`;
          userbreaks = `usersbreak`;
        }else if(startDay == previousDay && endDay == currentDay && currentHour >= 12){
          eventTable = `(SELECT * FROM eventmaster_${currentDay} UNION ALL SELECT * FROM eventmaster)`;
          logTable = `(SELECT * FROM eventlog_${currentDay} UNION ALL SELECT * FROM eventlog)`;
          whatsappTable = `(SELECT * FROM whatsapplog_${currentDay} UNION ALL SELECT * FROM whatsapplog)`;
          eventaistatus = `(SELECT * FROM eventaistatus_${currentDay} UNION ALL SELECT * FROM eventaistatus)`;
          eventuserstatus = `(SELECT * FROM eventuser_${currentDay} UNION ALL SELECT * FROM eventuser)`;
          userbreaks = `(SELECT * FROM usersbreak_${currentDay} UNION ALL SELECT * FROM usersbreak)`;       }
         else {
          // After noon → mix
          eventTable = `(SELECT * FROM eventmaster_${startDay} UNION ALL SELECT * FROM eventmaster)`;
          logTable = `(SELECT * FROM eventlog_${startDay} UNION ALL SELECT * FROM eventlog)`;
          whatsappTable = `(SELECT * FROM whatsapplog_${startDay} UNION ALL SELECT * FROM whatsapplog)`;
          eventaistatus = `(SELECT * FROM eventaistatus_${startDay} UNION ALL SELECT * FROM eventaistatus)`;
          eventuserstatus = `(SELECT * FROM eventuser_${startDay} UNION ALL SELECT * FROM eventuser)`;
          userbreaks = `(SELECT * FROM usersbreak_${startDay} UNION ALL SELECT * FROM usersbreak)`;
        }
      } else {
        // Future stuff
        eventTable = `eventmaster`;
        logTable = `eventlog`;
        whatsappTable = `whatsapplog`;
        eventaistatus = `eventaistatus`;
        eventuserstatus = `eventuser`;
        userbreaks = `usersbreak`;
      }
    }
var sql;

  try{
     sql = await db.query(`SELECT um.user_id,um.username,COALESCE(ul.first_logged_in, 'N/A') AS first_login_time,COALESCE(ul.last_logged_out, 'N/A') AS last_logout_time,
     COALESCE(SUM(ub.break_duration_minutes), 0) AS availed_break_time,'01:00:00' AS allowed_break_time,COALESCE(eu.totalevent, 0) AS total_events,COALESCE(el.ackevent, 0) AS 
     acknowledged_events,(COALESCE(eu.totalevent, 0) - COALESCE(el.ackevent, 0)) AS unacknowledged_events,COALESCE(wl.whatsapp, 0) AS whatsapp_events FROM usermaster um LEFT JOIN (
     SELECT eul.user_id, COUNT(DISTINCT eul.event_id) AS totalevent FROM ${eventuserstatus} eul WHERE eul.Row_updated_date BETWEEN ? AND ? GROUP BY eul.user_id ) eu ON eu.user_id = 
     um.user_id LEFT JOIN (SELECT ell.Created_by AS user_id, COUNT(DISTINCT ell.event_id) AS ackevent FROM ${logTable} ell WHERE ell.Row_upd_date BETWEEN ? AND ?
     GROUP BY ell.Created_by) el ON el.user_id = um.user_id LEFT JOIN (SELECT wbl.user_id, COUNT(DISTINCT wbl.event_id) AS whatsapp FROM ${whatsappTable} wbl
     WHERE wbl.Row_updated_date BETWEEN ? AND ? GROUP BY wbl.user_id ) wl ON wl.user_id = um.user_id LEFT JOIN ( SELECT user_id, MIN(logged_in) AS first_logged_in, MAX(logged_out) AS 
     last_logged_out FROM userlog WHERE deleted_flag = 0 AND logged_in >= ? AND (logged_out <= ? OR logged_out IS NULL) GROUP BY user_id) ul ON ul.user_id = um.user_id
     LEFT JOIN (SELECT ubl.user_id, SUM(TIMESTAMPDIFF(MINUTE, ubl.Break_time, ubl.Break_finished_time)) AS break_duration_minutes FROM ${userbreaks} ubl WHERE ubl.Row_updated_date >= ?
     GROUP BY ubl.user_id) ub ON ub.user_id = um.user_id WHERE um.user_design IN ('executive', 'supervisor') AND um.status = 1 AND um.Customer_ID = 0
     AND eu.totalevent > 0 GROUP BY um.user_id, um.username, ul.first_logged_in, ul.last_logged_out;`,[startTime,endTime,startTime,endTime,startTime,endTime,startTime,endTime,startTime]);
  }catch(er){
    return helper.getErrorResponse(false,"There is no Report to show",er.message,secret);
  }

    if(sql[0]){
      return helper.getSuccessResponse(true,"User's Daily report Fetched Successfully",sql,secret);
    }else{
      return helper.getErrorResponse(false,"There is no Report to show",sql,secret);
    }
    
  } catch (er) {
    return helper.getErrorResponse(false,"Internal error. Please contact Administration",er,secret);
  }
}
module.exports = {
  create,
  createSnapshot,
  createAction,
  update,
  deletedata,
  getEventSnapshot,          
  createSnapshotSingle,
  getRecentEvent,
  getUnAckEvent,
  getDeviceEvent,
  getMultiple,
  getCustomMessage,
  getEventAction,
  getEventProperty,
  addCustomMessage,
  addEventFeedback,
  addWhatsappLog,    
  GetAIEvent, 
  Eventlistfilter,
  getUnAcknoEvent,
  getRecEvent,
  getDevEvent,
  getVideolossEvent,
  getNotConnect,
  CreateSnapshot,
  addCustomerSelfFeedback,
  getWhatsappEvent,
  GetUserReport,
  IgnoreCameras,
  DeviceNotify,
  Acknowledge,
  CheckCameraActive,
  WhatsappWall,
  GetEventCount,
  GetBreakDuration,
  AddEventforAI,
  FetchWhatsappbyCam,
  userDailyReport,
} 