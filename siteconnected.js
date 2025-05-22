const axios = require('axios');
const path = require('path');
const findImageByName = require('./eventhelper.js').findImageByName;
const Query = require('./services/db.js').Query;
const cron = require('node-cron');

const SHARED_FOLDER = '\\\\192.168.0.198\\Sharedfolder\\EventandActionEngine\\Alarmimages';
const WHATSAPP_API = 'http://192.168.0.165:4444/api/send-message';
const DEFAULT_IMAGE_PATH = "\\\\192.168.0.198\\Sharedfolder\\EventandActionEngine\\Alarmimages-backup\\SiteConnected.png";

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

async function sendSiteConnectedAlerts() {
  try {
    let page = 1;

    while (true) {
      console.log(`Fetching page ${page}...`);
      let response;

      try {
        // Fetching events from your endpoint
        response = await axios.post('http://localhost:8080/alert/reconn', { page });
      } catch (err) {
        console.error('Failed to fetch events:', err.message);
        break;
      }

      const events = response.data;

      if (!events || events.length === 0) {
        console.log('No events found.');
        break;
      }

      // Process each event
      for (const ev of events) {
        console.log(`Processing Status ID ${ev.statusid}`);

        // Skip events that are not related to "Site Connected"
        if (ev.alertmessage !== 'Site Connected') {
          console.log(`Skipping non-connected alert (${ev.alertmessage})`);
          continue;
        }

        try {
          // Check if this event has already been processed
          console.log('Checking DB if already processed...');
          const existing = await Query(
            'SELECT 1 FROM processed_status_events WHERE status_id = ?',
            [ev.statusid]
          );
          console.log('Existing event check:', existing); // Log query result

          // Skip already processed events
          if (existing && existing.length > 0) {
            console.log('Already processed, skipping.');
            continue;
          }

          const devicenameClean = ev.devicename.toLowerCase().replace(/[^a-z0-9]/g, '');
          let imagePath;

          try {
            // Try to find the device image path
            const foundPath = await findImageByName(SHARED_FOLDER, devicenameClean);
            imagePath = foundPath || DEFAULT_IMAGE_PATH;
          } catch (imgErr) {
            console.error('Image lookup failed:', imgErr.message);
            imagePath = DEFAULT_IMAGE_PATH;
          }

          // Construct the WhatsApp message
          const whatsappMsg = `Site Connected for device ${ev.devicename} at ${ev.eventtime}.` +
            (ev.downtime ? ` The total downtime is ${ev.downtime} minutes.` : '');

          console.log('Sending WhatsApp message:', whatsappMsg);
          console.log('Image path:', imagePath);

          try {
            // Send the message via WhatsApp API
            const res = await axios.post(WHATSAPP_API, {
              groupName: ev.whatsappgroupname,
              messageText: whatsappMsg,
              mediaPath: imagePath,
            });

            console.log('WhatsApp API response:', res.data);

            // Check if the result contains 'success' (to handle varying responses)
            if (!res.data.result || !res.data.result.toLowerCase().includes('success')) {
              console.error('WhatsApp message failed.');
              continue;
            }

            console.log('WhatsApp message sent successfully.');

            // Insert into DB to mark this event as processed
            await Query(
              `INSERT INTO processed_status_events 
              (status_id, whatsapp_group_name, alert_message, device_name, event_time, contact_email) 
              VALUES (?, ?, ?, ?, ?, ?)`,
              [
                ev.statusid,
                ev.whatsappgroupname,
                ev.alertmessage,
                ev.devicename,
                ev.eventtime,
                ev.contactemail,
              ]
            );

            console.log(`Event stored in DB for ${ev.statusid}.`);

            // Wait for 2 seconds to respect rate limits
            await delay(2000);

          } catch (waErr) {
            console.error('WhatsApp send error:', waErr.message);
          }

        } catch (err) {
          console.error(`Error processing Status ID ${ev.statusid}:`, err.message);
        }
      }

      page++; // Move to the next page of events
    }
  } catch (err) {
    console.error('Fatal error in sendSiteConnectedAlerts:', err.message);
  }
}

// Run the function immediately
sendSiteConnectedAlerts();

// Optional: schedule hourly run
cron.schedule('0 * * * *', () => {
  console.log('Running scheduled site connected alert check...');
  sendSiteConnectedAlerts();
});
