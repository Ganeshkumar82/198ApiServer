var axios = require('axios');
var sendSiteStatusMail = require('./alertmailer.js').sendSiteStatusMail;
var sendAlertMail = require('./alertmailer.js').sendAlertMail;
var { sendwhatsapp } = require('./alertwhatsapp.js');
var cron = require('node-cron');
var Query = require('./services/db.js').Query;
var stringSimilarity = require('string-similarity');

var BASE_URL = 'http://localhost:8080/alert';

var alertMessageMap = {
  'Site Not Connected': 'Site Not Connected',
  'Video loss alarm': 'Video Loss',
  'HDD error alarm': 'HDD Error',
  'Read or Write HDD error alarm': 'HDD Read/Write Error',
  'Camera masking alarm': 'Camera Masking',
  'Tampering alarm': 'Tampering',
  'HDD full alarm': 'HDD Full',
  'IO alarm': 'IO Alarm',
  'Video signal exception alarm': 'Video Signal Exception',
  'Illegal access alarm': 'Illegal Access',
  'RAID is abnormal alarm': 'RAID Abnormal',
  'Input or Output video standard mismatch alarm': 'Video Standard Mismatch',
};

var ENDPOINTS = [
  { path: '/vidloss', type: 'alert' },
  { path: '/hdderror', type: 'alert' },
  { path: '/hddfull', type: 'alert' },
  { path: '/masking', type: 'alert' },
  { path: '/tamper', type: 'alert' },
  { path: '/ioalarm', type: 'alert' },
  { path: '/videx', type: 'alert' },
  { path: '/illegal', type: 'alert' },
  { path: '/raid', type: 'alert' },
  { path: '/iomismatch', type: 'alert' },
  { path: '/notconn', type: 'status' },
];

function fetchWithRetry(url, data, retries = 3, delay = 1000) {
  let attempt = 0;

  function tryFetch() {
    return axios.post(url, data || {}).catch((err) => {
      if (++attempt >= retries) throw err;
      console.warn(`Retrying ${url} (${attempt}/${retries})...`);
      return new Promise((res) => setTimeout(() => res(tryFetch()), delay));
    });
  }

  return tryFetch();
}

function mapAlertMessage(alertMessage) {
  var keys = Object.keys(alertMessageMap);
  var bestMatch = stringSimilarity.findBestMatch(alertMessage, keys).bestMatch;
  return bestMatch.rating >= 0.7 ? bestMatch.target : alertMessage;
}

function parseEventTime(str) {
  var parts = str.split(/[, ]+/);
  if (parts.length < 2) throw new Error('Invalid event time format: ' + str);
  var dateBits = parts[0].split('/');
  var timeBits = parts[1].split(':');
  return new Date(`${dateBits[2]}-${dateBits[1]}-${dateBits[0]}T${pad(timeBits[0])}:${pad(timeBits[1])}:${pad(timeBits[2])}.000+05:30`);
}

function pad(n) {
  return n.toString().padStart(2, '0');
}

function deduplicateEvents(events) {
  var grouped = {};
  for (let ev of events) {
    let key = `${ev.devicename}__${ev.channelname || 'N/A'}__${mapAlertMessage(ev.alertmessage)}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(ev);
  }

  return Object.values(grouped).map(group =>
    group.sort((a, b) => parseEventTime(b.eventtime) - parseEventTime(a.eventtime))[0]
  );
}

function groupEventsByDeviceAlert(events) {
  var grouped = {};
  for (let ev of events) {
    let alertKey = mapAlertMessage(ev.alertmessage);
    let key = `${ev.devicename}__${alertKey}`;
    if (!grouped[key]) {
      grouped[key] = { ...ev, channels: {} };
    }
    if (ev.channelname) grouped[key].channels[ev.channelname] = true;
  }

  return Object.values(grouped).map(ev => ({
    ...ev,
    channelList: Object.keys(ev.channels).join(', ') || 'N/A'
  }));
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function wasSimilarEventProcessedRecently(ev) {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const mapped = mapAlertMessage(ev.alertmessage);

  const result = await Query(
    `SELECT 1 FROM processed_alert_events 
     WHERE device_name = ? 
       AND alert_message = ? 
       AND channel_name = ? 
       AND processed_at >= ? 
     LIMIT 1`,
    [ev.devicename, mapped, ev.channelList || 'N/A', oneHourAgo]
  );

  return result && result.length > 0;
}

function processEventsInBatches(events) {
  return new Promise((resolve) => {
    const batchSize = 10;

    function processBatch(i) {
      if (i >= events.length) return resolve();
      const batch = events.slice(i, i + batchSize);

      (function processEach(j) {
        if (j >= batch.length) return processBatch(i + batchSize);

        const ev = batch[j];

        Query('SELECT 1 FROM processed_alert_events WHERE event_id = ?', [ev.eventid])
          .then(existing => {
            if (existing && existing.length) {
              console.log('Skipped already processed Event ID: ' + ev.eventid);
              return processEach(j + 1);
            }

            const mapped = mapAlertMessage(ev.alertmessage);
            const msg = ev.channelList && ev.channelList !== 'N/A'
              ? `${mapped} on ${ev.devicename} (Channels: ${ev.channelList}) at ${ev.eventtime}`
              : `${mapped} on ${ev.devicename} at ${ev.eventtime}`;

            return sendwhatsapp(ev.whatsappgroupname, msg, mapped, ev.devicename)
              .then((resp) => {
                if (resp?.result === 'Message sent successfully') {
                  return Query(
                    'INSERT INTO processed_alert_events (event_id, whatsapp_group_name, alert_message, device_name, event_time, channel_name, contact_email) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [
                      ev.eventid,
                      ev.whatsappgroupname,
                      ev.alertmessage,
                      ev.devicename,
                      ev.eventtime,
                      ev.channelList || 'N/A',
                      ev.contactemail
                    ]
                  ).then(() => {
                    console.log('Alert event processed and stored for Event ID: ' + ev.eventid);
                  });
                } else {
                  console.warn(`WhatsApp failed for Event ID ${ev.eventid}, skipping DB insert.`);
                }
              })
              .catch(err => {
                console.error(`WhatsApp send failed for Event ID ${ev.eventid}: ${err.message}`);
              })
              .finally(() => delay(2000).then(() => processEach(j + 1)));
          })
          .catch(err => {
            console.error(`Error processing Event ID: ${ev.eventid} - ${err.message}`);
            processEach(j + 1);
          });
      })(0);
    }

    processBatch(0);
  });
}

function processStatus(ev) {
  return Query('SELECT 1 FROM processed_status_events WHERE status_id = ?', [ev.statusid])
    .then(existing => {
      if (existing && existing.length) {
        console.log('Skipped already processed Status ID: ' + ev.statusid);
        return;
      }

      const mapped = mapAlertMessage(ev.alertmessage);
      const msg = `${mapped} - Device: ${ev.devicename} at ${ev.eventtime}`;

      return sendwhatsapp(ev.whatsappgroupname, msg, mapped, ev.devicename)
        .then((resp) => {
          if (resp?.result === 'Message sent successfully') {
            return Query(
              'INSERT INTO processed_status_events (status_id, whatsapp_group_name, alert_message, device_name, event_time, contact_email) VALUES (?, ?, ?, ?, ?, ?)',
              [
                ev.statusid,
                ev.whatsappgroupname,
                ev.alertmessage,
                ev.devicename,
                ev.eventtime,
                ev.contactemail
              ]
            ).then(() => {
              console.log('Status event processed and stored for Status ID: ' + ev.statusid);
            });
          } else {
            console.warn(`WhatsApp failed for Status ID ${ev.statusid}, skipping DB insert.`);
          }
        });
    })
    .catch(err => {
      console.error(`Failed to process Status ID: ${ev.statusid} - ${err.message}`);
    })
    .finally(() => delay(2000));
}

async function runDispatcher() {
  console.log('Dispatcher running at ' + new Date().toLocaleString());

  for (let ep of ENDPOINTS) {
    let allEvents = [];
    let page = 1;

    async function fetchNext() {
      try {
        const res = await fetchWithRetry(BASE_URL + ep.path, { page });
        const data = res.data;
        if (!data || !data.length) {
          console.log(`No more data from ${ep.path} at page ${page}`);
          return allEvents;
        }

        console.log(`Fetched ${data.length} events from ${ep.path} page ${page}`);
        allEvents = allEvents.concat(data);
        page++;
        return await fetchNext();
      } catch (err) {
        console.error(`Error fetching paged data from ${ep.path}: ${err.message}`);
        return [];
      }
    }

    const rawEvents = await fetchNext();

    if (ep.type === 'alert') {
      if (rawEvents.length > 0) {
        const latestEvents = deduplicateEvents(rawEvents);
        const grouped = groupEventsByDeviceAlert(latestEvents);

        const filtered = [];
        for (let ev of grouped) {
          const alreadyProcessed = await Query('SELECT 1 FROM processed_alert_events WHERE event_id = ?', [ev.eventid]);
          if (alreadyProcessed && alreadyProcessed.length) {
            console.log(`Skipping already processed Event ID ${ev.eventid}`);
            continue;
          }

          const recentlyProcessedSimilar = await wasSimilarEventProcessedRecently(ev);
          if (recentlyProcessedSimilar) {
            console.log(`Duplicate event skipped by time-filter: ${ev.devicename} - ${ev.alertmessage}`);
            continue;
          }

          filtered.push(ev);
        }

        await processEventsInBatches(filtered);
      }
    } else if (ep.type === 'status') {
      for (let ev of rawEvents) {
        await processStatus(ev);
      }
    }
  }
}

runDispatcher();

cron.schedule('0 * * * *', runDispatcher);