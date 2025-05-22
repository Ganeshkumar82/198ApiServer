const { Query } = require('./db');
const { emptyOrRows, getOffset } = require('../eventhelper.js');

const alert = {
  async getEvent(eventNameCondition, page = 1, requireActiveCamera = false) {
    try {
      const listPerPage = 50;
      const offset = getOffset(page, listPerPage);

      const extraJoin = requireActiveCamera
        ? "JOIN subscriptioncameras sc ON sc.Camera_ID = cm.camera_id" //join with subscription cameras
        : "";

      const statusField = requireActiveCamera
        ? ", sc.status AS camera_status"
        : "";
      const statusFilter = requireActiveCamera ? "AND sc.status = 1" : ""; //only active cameras

      const sql = `
        SELECT 
          em.Event_ID, 
          bm.whatsappgroupname, 
          em.Alertmessage, 
          dm.device_name, 
          DATE_FORMAT(em.enddate, '%Y-%m-%d %H:%i:%s') AS eventtime, 
          ch.Channel_name AS channel_name,
          cu.Email_ID AS contact_email
          ${statusField}
        FROM eventmaster em
        JOIN cameramaster cm ON cm.camera_id = em.analyticsource_id
        ${extraJoin}
        JOIN channelmaster ch ON ch.Channel_id = cm.Channel_id
        JOIN devicemaster dm ON dm.device_id = cm.device_id
        JOIN deptmaster dt ON dt.dept_id = dm.dept_id
        LEFT JOIN deptcontacts dc ON dc.dept_id = dt.dept_id
        JOIN branchmaster bm ON bm.branch_id = dt.branch_id
        JOIN customermaster cu ON cu.Customer_ID = bm.Customer_ID
        LEFT JOIN (
          SELECT Event_ID, MIN(detected_file) AS imagepath
          FROM eventaistatus
          GROUP BY Event_ID
        ) ep ON ep.Event_ID = em.Event_ID
        WHERE em.Event_ID NOT IN (SELECT el.Event_ID FROM eventlog el)
          AND em.Event_ID NOT IN (SELECT wl.Event_id FROM whatsapplog wl)
          AND (${eventNameCondition})
          AND em.Row_updated_date >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
          ${statusFilter}
        ORDER BY em.Row_updated_date DESC
        LIMIT ?, ?;
      `;

      const rows = await Query(sql, [offset, listPerPage]);
      const data = emptyOrRows(rows);

      return data.map((row) => ({
        eventid: row.Event_ID,
        whatsappgroupname: row.whatsappgroupname,
        alertmessage: row.Alertmessage,
        devicename: row.device_name,
        eventtime: row.eventtime,
        channelname: row.channel_name,
        contactemail: row.contact_email,
        ...(requireActiveCamera && { status: row.camera_status }),
      }));
    } catch (err) {
      console.error(`Error in getEvent (${eventNameCondition}):`, err);
      return [];
    }
  },

  // Grouped
  async getDevEvent(page = 1) {
    const condition = `
      em.Event_Name LIKE 'Tampering%' 
      OR em.Event_Name LIKE 'HDD%' 
      OR em.Event_Name LIKE 'Video%' 
      OR em.Event_Name LIKE '%FULL%' 
      OR em.Event_Name LIKE '%Device%' 
      OR em.Event_Name LIKE 'illegalaccess%' 
      OR em.Event_Name LIKE 'notconnected%' 
      OR em.Event_Name LIKE 'ioalarm%' 
      OR em.Event_Name LIKE 'camera%'
    `;
    return this.getEvent(condition, page);
  },

  // Specific alerts (only when status = 1)
  async getVideolossEvent(page = 1) {
    const condition = `em.Event_Name LIKE 'Video%'`;
    return this.getEvent(condition, page, true);
  },

  async getCameraMaskingEvent(page = 1) {
    const condition = `em.Event_Name LIKE '%masking%'`;
    return this.getEvent(condition, page, true);
  },

  async getTamperingEvent(page = 1) {
    const condition = `em.Event_Name LIKE '%Tampering%'`;
    return this.getEvent(condition, page, true);
  },

  async getVideoSignalExceptionEvent(page = 1) {
    const condition = `em.Event_Name LIKE '%exception%'`;
    return this.getEvent(condition, page, true);
  },

  async getVideoStandardMismatchEvent(page = 1) {
    const condition = `em.Event_Name LIKE 'mismatch%'`;
    return this.getEvent(condition, page, true);
  },

  // Not camera status filtered
  async getHDDErrorEvent(page = 1) {
    const condition = `em.Event_Name LIKE '%HDD error%'`;
    return this.getEvent(condition, page);
  },

  async getHDDFullEvent(page = 1) {
    const condition = `em.Event_Name LIKE '%HDD full%'`;
    return this.getEvent(condition, page);
  },

  async getIOAlarmEvent(page = 1) {
    const condition = `em.Event_Name LIKE '%IO'`;
    return this.getEvent(condition, page);
  },

  async getIllegalAccessEvent(page = 1) {
    const condition = `em.Event_Name LIKE '%illegalaccess%'`;
    return this.getEvent(condition, page);
  },

  async getRaidAbnormalEvent(page = 1) {
    const condition = `em.Event_Name LIKE '%RAID%'`;
    return this.getEvent(condition, page);
  },
};

//completed
const site = {
  async getSiteStatus(alertMessageCondition, page = 1) {
    try {
      const listPerPage = 50;
      const offset = getOffset(page, listPerPage);

      const sql = `
  SELECT
    ss.status_id,
    bm.whatsappgroupname,
    ss.AlertMessage,
    dm.device_name,
    DATE_FORMAT(ss.Row_updated_date, '%Y-%m-%d %H:%i:%s') AS eventtime,
    cu.Email_ID AS contact_email
  FROM sitestatusmaster ss
  JOIN (
    SELECT Device_ID, MAX(Row_updated_date) AS latest_update
    FROM sitestatusmaster
    GROUP BY Device_ID
    HAVING latest_update >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
  ) latest ON ss.Device_ID = latest.Device_ID AND ss.Row_updated_date = latest.latest_update
  JOIN devicemaster dm ON dm.device_id = ss.Device_ID
  JOIN deptmaster dt ON dt.dept_id = dm.dept_id
  JOIN branchmaster bm ON bm.branch_id = dt.branch_id
  JOIN customermaster cu ON cu.Customer_ID = bm.Customer_ID
  WHERE ss.AlertMessage = ?
  ORDER BY ss.Row_updated_date DESC
  LIMIT ?, ?;
`;

      const rows = await Query(sql, [
        alertMessageCondition,
        offset,
        listPerPage,
      ]);
      const data = emptyOrRows(rows);

      return data.map((row) => ({
        statusid: row.status_id,
        whatsappgroupname: row.whatsappgroupname,
        alertmessage: row.AlertMessage,
        devicename: row.device_name,
        eventtime: row.eventtime,
        contactemail: row.contact_email,
      }));
    } catch (err) {
      console.error(`Error in getSiteStatus (${alertMessageCondition}):`, err);
      return [];
    }
  },

  async getConnectedSites(page = 1) {
    return this.getSiteStatus("Site Connected", page);
  },

  async getNotConnectedSites(page = 1) {
    return this.getSiteStatus("Site Not Connected", page);
  },
  async getRecentSiteConnectionStatus(page = 1) {
    try {
      const listPerPage = 50;
      const offset = getOffset(page, listPerPage);

      const sql = `
        WITH LatestConnection AS (
  SELECT 
    ss.status_id,
    ss.Device_ID,
    ss.AlertMessage,
    ss.Row_updated_date,
    ROW_NUMBER() OVER (PARTITION BY ss.Device_ID ORDER BY ss.Row_updated_date DESC) AS rn
  FROM sitestatusmaster ss
  WHERE ss.AlertMessage = 'Site Connected'
    AND ss.Row_updated_date >= NOW() - INTERVAL 1 HOUR
),
FilteredConnection AS (
  SELECT * FROM LatestConnection WHERE rn = 1
),
PreviousDisconnection AS (
  SELECT 
    ss.Device_ID, 
    MAX(ss.Row_updated_date) AS last_disconnected_time
  FROM sitestatusmaster ss
  WHERE ss.AlertMessage = 'Site Not Connected'
  GROUP BY ss.Device_ID
)
SELECT 
  fc.status_id,
  bm.whatsappgroupname,
  fc.AlertMessage,
  dm.device_name,
  DATE_FORMAT(fc.Row_updated_date, '%Y-%m-%d %H:%i:%s') AS eventtime,
  cu.Email_ID AS contact_email,
  TIMESTAMPDIFF(MINUTE, pd.last_disconnected_time, fc.Row_updated_date) AS downtime_minutes
FROM FilteredConnection fc
LEFT JOIN PreviousDisconnection pd 
  ON pd.Device_ID = fc.Device_ID 
  AND pd.last_disconnected_time < fc.Row_updated_date
JOIN devicemaster dm ON dm.device_id = fc.Device_ID
JOIN deptmaster dt ON dt.dept_id = dm.dept_id
JOIN branchmaster bm ON bm.branch_id = dt.branch_id
JOIN customermaster cu ON cu.Customer_ID = bm.Customer_ID
ORDER BY fc.Row_updated_date DESC
LIMIT ?, ?;
      `;

      const rows = await Query(sql, [offset, listPerPage]);
      const data = emptyOrRows(rows);

      return data.map((row) => ({
        statusid: row.status_id,
        whatsappgroupname: row.whatsappgroupname,
        alertmessage: row.AlertMessage,
        devicename: row.device_name,
        eventtime: row.eventtime,
        contactemail: row.contact_email,
        downtime: row.downtime_minutes,
      }));
    } catch (err) {
      console.error(`Error in getRecentSiteConnectionStatus:`, err);
      return [];
    }
  },
};

module.exports = { alert, site };
