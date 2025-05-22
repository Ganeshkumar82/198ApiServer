
const express = require('express');
const { alert, site } = require('../services/alert');


const router = express.Router();

// Device events - general
router.post('/alldev', async (req, res, next) => {
  try {
    const { page = 1 } = req.body || {};
    res.json(await alert.getDevEvent(page));
  } catch (err) {
    next(err);
  }
});

// Video loss events
router.post('/vidloss', async (req, res, next) => {
  try {
    const { page = 1 } = req.body || {};
    res.json(await alert.getVideolossEvent(page));
  } catch (err) {
    next(err);
  }
});

// HDD error events
router.post('/hdderror', async (req, res, next) => {
  try {
    const { page = 1 } = req.body || {};
    res.json(await alert.getHDDErrorEvent(page));
  } catch (err) {
    next(err);
  }
});

// HDD full events
router.post('/hddfull', async (req, res, next) => {
  try {
    const { page = 1 } = req.body || {};
    res.json(await alert.getHDDFullEvent(page));
  } catch (err) {
    next(err);
  }
});

// Camera masking events
router.post('/masking', async (req, res, next) => {
  try {
    const { page = 1 } = req.body || {};
    res.json(await alert.getCameraMaskingEvent(page));
  } catch (err) {
    next(err);
  }
});

// Tampering alarm events
router.post('/tamper', async (req, res, next) => {
  try {
    const { page = 1 } = req.body || {};
    res.json(await alert.getTamperingEvent(page));
  } catch (err) {
    next(err);
  }
});

// IO alarm events
router.post('/ioalarm', async (req, res, next) => {
  try {
    const { page = 1 } = req.body || {};
    res.json(await alert.getIOAlarmEvent(page));
  } catch (err) {
    next(err);
  }
});

// Video signal exception events
router.post('/videx', async (req, res, next) => {
  try {
    const { page = 1 } = req.body || {};
    res.json(await alert.getVideoSignalExceptionEvent(page));
  } catch (err) {
    next(err);
  }
});

// Illegal access events
router.post('/illegal', async (req, res, next) => {
  try {
    const { page = 1 } = req.body || {};
    res.json(await alert.getIllegalAccessEvent(page));
  } catch (err) {
    next(err);
  }
});

// RAID abnormal events
router.post('/raid', async (req, res, next) => {
  try {
    const { page = 1 } = req.body || {};
    res.json(await alert.getRaidAbnormalEvent(page));
  } catch (err) {
    next(err);
  }
});

// IO video standard mismatch events
router.post('/iomismatch', async (req, res, next) => {
  try {
    const { page = 1 } = req.body || {};
    res.json(await alert.getVideoStandardMismatchEvent(page));
  } catch (err) {
    next(err);
  }
});

// Connected events
router.post('/conn', async (req, res, next) => {
  try {
    const { page = 1 } = req.body || {};
    res.json(await site.getConnectedSites(page));
  } catch (err) {
    next(err);
  }
});
// Connected events with down time
router.post('/reconn', async (req, res, next) => {
  try {
    const { page = 1 } = req.body || {};
    res.json(await site.getRecentSiteConnectionStatus(page));
  } catch (err) {
    next(err);
  }
});

// Not connected events
router.post('/notconn', async (req, res, next) => {
  try {
    const { page = 1 } = req.body || {};
    res.json(await site.getNotConnectedSites(page));
  } catch (err) {
    next(err);
  }
});

router.get('/test', (req, res) => {
  res.send('Alert router test working!');
});


module.exports = router;

