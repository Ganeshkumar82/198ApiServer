// Converts a date string to Indian Standard Time (IST) format
function toIST(dateInput) {
  var date = new Date(dateInput);
  if (isNaN(date)) return 'Invalid Date';

  var options = {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
  };

  return new Intl.DateTimeFormat('en-IN', options).format(date);
}

// Calculates the offset for pagination
function getOffset(currentPage, listPerPage) {
  currentPage = currentPage || 1;
  listPerPage = listPerPage || 10;
  return (currentPage - 1) * listPerPage;
}

// Checks if rows array is empty or null
function emptyOrRows(rows) {
  if (!rows || rows.length === 0) {
      return [];
  }
  return rows;
}

// Converts an IST-formatted date string to SQL date format
function dateToSqlIST(inputDateStr) {
  if (!inputDateStr) return null;

  try {
      var parts = inputDateStr.split(', ');
      var datePart = parts[0];
      var timePart = parts[1];

      var dateComponents = datePart.split('/');
      var day = parseInt(dateComponents[0], 10);
      var month = parseInt(dateComponents[1], 10);
      var year = parseInt(dateComponents[2], 10);

      var timeSplit = timePart.split(' ');
      var time = timeSplit[0];
      var meridian = timeSplit[1];

      var timeComponents = time.split(':');
      var hours = parseInt(timeComponents[0], 10);
      var minutes = parseInt(timeComponents[1], 10);
      var seconds = parseInt(timeComponents[2], 10);

      if (meridian.toLowerCase() === 'pm' && hours !== 12) hours += 12;
      if (meridian.toLowerCase() === 'am' && hours === 12) hours = 0;

      var jsDate = new Date(year, month - 1, day, hours, minutes, seconds);

      var offset = 5.5 * 60 * 60 * 1000; // IST offset
      var istDate = new Date(jsDate.getTime() + offset);

      var isoString = istDate.toISOString();
      var sqlDateStr = isoString.replace('T', ' ').slice(0, 19);

      return sqlDateStr;
  } catch (err) {
      console.error('Error parsing date:', inputDateStr, err.message);
      return null;
  }
}

var fs = require('fs');
var path = require('path');

// Finds an image file in a folder by name (case-insensitive, alphanumeric comparison)
function findImageByName(folderPath, targetName) {
  return new Promise(function(resolve, reject) {
      fs.readdir(folderPath, function(err, files) {
          if (err) {
              return reject(err);
          }

          var foundFile = null;

          for (var i = 0; i < files.length; i++) {
              var file = files[i];
              var baseName = path.parse(file).name.toLowerCase().replace(/[^a-z0-9]/g, '');

              if (baseName === targetName) {
                  foundFile = path.join(folderPath, file);
                  break;
              }
          }

          resolve(foundFile || null);
      });
  });
}

// Exporting in CommonJS style (ES5-friendly)
module.exports = {
  toIST: toIST,
  dateToSqlIST: dateToSqlIST,
  getOffset: getOffset,
  emptyOrRows: emptyOrRows,
  findImageByName: findImageByName
};
