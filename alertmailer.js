const nodemailer = require('nodemailer');
const hbs = require('nodemailer-express-handlebars');
const path = require('path');

// Create the transporter
const transporter = nodemailer.createTransport({
  host: 'mail.sporadasecure.com', // your mail host
  port: 465, // SSL port
  secure: true,
  auth: {
    user: 'support@sporadasecure.com',
    pass: 'Sporada@2024', // 🔥 You should move this to env too for safety
  },
});

// Configure Handlebars
const handlebarOptions = {
  viewEngine: {
    extName: '.hbs',
    partialsDir: path.resolve('./views/'),
    defaultLayout: false,
  },
  viewPath: path.resolve('./views/'),
  extName: '.hbs',
};

transporter.use('compile', hbs(handlebarOptions));

// sendAlertMail
const sendAlertMail = async function (to, context) {
  try {
    const mailOptions = {
      from: '"Alert" <kishore.k@sporadasecure.com>',
      to,
      subject: context.subject,
      template: 'alert',
      context,
    };
    const info = await transporter.sendMail(mailOptions);
    console.log('Alert email sent:', info.response);
  } catch (error) {
    console.error('Failed to send alert email:', error);
  }
};

// sendSiteStatusMail
const sendSiteStatusMail = async function (to, context, templateName) {
  try {
    const mailOptions = {
      from: '"Site Status" <kishore.k@sporadasecure.com>',
      to,
      subject: context.subject,
      template: templateName,
      context,
    };
    const info = await transporter.sendMail(mailOptions);
    console.log('Site connection email sent:', info.response);
  } catch (error) {
    console.error('Failed to send site connection email:', error);
  }
};

// Export in CommonJS style
module.exports = {
  sendAlertMail,
  sendSiteStatusMail,
};
