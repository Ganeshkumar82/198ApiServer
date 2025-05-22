const path = require('path');
const axios = require('axios');

const alertToImageMap = {
  'Site Not Connected': 'SiteNotConnected.png',
  'Video loss alarm': 'video-loss-icon.png',
  'HDD error alarm': 'r-w-error.png',
  'Read or Write HDD error alarm': 'r-w-error.png',
  'Camera masking alarm': 'Masking-Tampering-alarm.png',
  'Tampering alarm': 'Masking-Tampering-alarm.png',
  'HDD full alarm': 'disk-usage.png',
  'IO alarm': 'io-error.png',
  'Video signal exception alarm': 'Video signal exception.png',
  'Illegal access alarm': 'illegalaccess.png',
  'RAID is abnormal alarm': 'raid.png',
  'Input or Output video standard mismatch alarm': 'videoio.png',
};

// Replace this with your network-shared image base path
const networkImageBasePath = '\\\\192.168.0.198\\svmwebapi\\images';

async function sendwhatsapp(groupname, msgstr, Alertname, devicename) {
  try {
    const Devicename = devicename.replace(/\s+/g, '');
    const imageName = Alertname === 'Site Connected'
      ? Devicename + '.jpg'
      : alertToImageMap[Alertname];

    if (!imageName) {
      console.error('No image mapped for alert:', Alertname);
      return;
    }

    const imagePath = path.join(networkImageBasePath, imageName);

    const response = await axios.post('http://192.168.0.165:4444/api/send-message', {
      groupName: groupname,
      messageText: msgstr,
      mediaPath: imagePath,
    });

    console.log('WhatsApp API response:', response.data.result);
    return response.data; 
  } catch (error) {
    console.error('Error sending WhatsApp message:', error.message);
  }
}

module.exports = {
  sendwhatsapp
};
