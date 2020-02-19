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
