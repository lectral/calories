function getDate() {
  return parseDate(new Date());
}

function parseDate(date) {
  var dd = String(date.getDate()).padStart(2, '0');
  var mm = String(date.getMonth() + 1).padStart(2, '0'); //January is 0!
  var yyyy = date.getFullYear();
  today = mm + '/' + dd + '/' + yyyy;
  return today
}

function modifyDate(date, modifier) {
  let dateObj = new Date(date)
  dateObj.setDate(dateObj.getDate() + modifier)
  return parseDate(dateObj)
}
var getJSON = function (url, callback) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.responseType = 'json';
  xhr.onload = function () {
    var status = xhr.status;
    if (status === 200) {
      callback(null, xhr.response);
    } else {
      callback(status, xhr.response);
    }
  };
  xhr.send();
};