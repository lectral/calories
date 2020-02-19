if (!window.indexedDB) {
  console.log(
    "Your browser doesn't support a stable version of IndexedDB. Such and such feature will not be available."
  );
}
const $source = document.querySelector('#command');
const $container = document.querySelector('.container');
const $date = document.querySelector("#date")
const $dateleft = document.querySelector('#date-left');
const $dateright = document.querySelector('#date-right');
const $items = document.querySelector('#items');
const $summary = document.querySelector('#summary')
var $deleteTimer;
var $database

var $state = {
  "diary": {
    "max_id": 0,
    "items": []
  },
  "app": {
    "current_date": getDate()
  },
  "summary": {
    "total_kcal": 0,
    "protein": 0,
    "fat": 0,
    "carbs": 0
  },
  "summary2" : []
}

function init() {
  console.log("Initializing app")
  var request = window.indexedDB.open("calories_diar2y", 2);
  request.onerror = function (event) {
    console.log("Failed to create/open database")
  }
  request.onsuccess = function (event) {
    $database = event.target.result
    console.log("Database created/opened");
    //loadState($state.app.current_date);
    $container.dispatchEvent(new CustomEvent('appinit', {}))
  }
  request.onupgradeneeded = function (event) {
    console.log("request.onupgradeneeded")
    $database = event.target.result
    var objectStore = $database.createObjectStore("diary", {
      keyPath: "date"
    });
    objectStore.createIndex("string", "string")
    objectStore.transaction.oncomplete = function (event) {
      console.log("Object store created")
    }
  }
}
// PARSE

function quantityToGrams(quantityMod, db_data){
  var grams
  if (quantityMod === 'unit') {
    var grams = db_data['mods']['unit']
  } else {
    var mod = findModifier(quantityMod)
    if (mod === "gram") {
      var grams = 1
    } else {
      var grams = db_data['mods'][mod]
    }
  }
  return grams
}

function calculateNutrients(parsed_data, db_data) {
  var quantity = parsed_data['quantity']
  var grams = quantityToGrams(parsed_data.quantityMod, db_data)
  var nutrition = db_data['nutrition']
  let nutrients = {
    kcal: 0,
    protein: 0,
    fat: 0,
    carbs: 0
  }
  nutrients.kcal = calculateNutrient(quantity, grams, nutrition['kcal']);
  nutrients.protein = calculateNutrient(quantity, grams, nutrition['protein'])
  nutrients.fat = calculateNutrient(quantity, grams, nutrition['fat'])
  nutrients.carbs = calculateNutrient(quantity, grams, nutrition['carbs'])
  return nutrients
}

function calculateNutrient(quantity, grams, kcal) {
  return Math.round(((grams / 100) * kcal) * quantity);
}

function findModifier(modifier) {
  for (let key in $db['mods']) {
    for (let kaliases in $db['mods'][key]['aliases']) {
      if ($db['mods'][key]['aliases'][kaliases] === modifier) {
        return $db['mods'][key]['id']
      }
    }
  }
  return false
}


function findFoodItem(item) {
  for (let key in $db['products']) {
    var value = $db['products'][key]
    for (let alias in value['aliases']) {
      if (value['aliases'][alias] === item) {
        return value
      }
    }
  }
  return false;
}
function parseInput(input) {
  var regex = /. .*/g;
  console.log(input)
  var found = input.split(" ").filter(Boolean)
  var dict = {
    "input": input,
    "quantity": 0,
    "quantityMod": "unit",
    "foodItem": ""
  }
  if (found.length === 1) {
    dict['quantity'] = 1
    dict['foodItem'] = found[0]
  }

  if (found.length === 2) {
    if (!isNaN(found[0])) {
      dict['quantity'] = found[0]
    } else {
      dict['quantity'] = 1
      dict['quantityMod'] = found[0]
    }
    dict['foodItem'] = found[1]
  }

  if (found.length >= 3) {
    if (!isNaN(found[0])) {
      dict['quantity'] = found[0]
    } else {
      dict['quantity'] = 1
    }
    dict['quantityMod'] = found[1]
    if (found.length < 3) {
      dict['foodItem'] = found.slice(2)
      dict['foodItem'] = dict['foodItem'].join(' ')
    } else {
      dict['foodItem'] = found[2]
    }
  }
  return dict
}

// DB
function getDiaryItems(date, record_found, record_not_found) {
  var objectStore = $database.transaction("diary", "readwrite").objectStore(
    "diary")
  var request = objectStore.get(date)
  request.onerror = function (event) {
    console.log("getDiaryItems() - error getting entry")
  };
  request.onsuccess = function (event) {
    var data = event.target.result
    if (data) {
      record_found(data);
    } else {
      record_not_found();
    }
  }
}

function saveStateToDb() {
  console.log($database)
  var objectStore = $database.transaction("diary", "readwrite").objectStore(
    "diary")
  var request = objectStore.get($state.app.current_date)
  request.onerror = function (event) {
    console.log("error finding entry. creating entry")
  };
  request.onsuccess = function (event) {
    var data = event.target.result
    if (data) {
      data.max_id = $state.diary.max_id
      data.items = $state.diary.items
      var requestUpdate = objectStore.put(data);
      requestUpdate.onerror = function (event) {
        console.log("updated")
      };
      requestUpdate.onsuccess = function (event) {
        console.log("saved")
      };

    } else {
      console.log($state['diary'])
      $state.diary.date = $state.app.current_date
      request_add = objectStore.add($state['diary'])
      request_add.onsuccess = function (event) {
        console.log("saved")
      }
      request_add.onerror = function (event) {
        console.log("error adding record")
      }
    }
  }
}

// STATE
function addItemToState(item_string, item_id){
  var new_id
  if(!item_id){
    console.log("no item id")
    new_id = $state['diary']['max_id'] + 1
    $state['diary']['max_id'] = new_id
  }else{
    new_id = item_id
    if ($state['diary']['max_id'] < new_id) {
      $state['diary']['max_id'] = new_id
    }
  }
  var new_item = {
    "id": new_id,
    "string": item_string
  }
  $state['diary']['items'].push(new_item)
  var parsed_item = parseInput(item_string)
  $container.dispatchEvent(new CustomEvent('item added',{
    detail : {
        raw : new_item, 
        parsed: parsed_item
      }}))
}

function removeItemFromState(id) {
  console.log("removing.."+id)
  $state.diary.items = $state.diary.items.filter(function (obj) {
    console.log(obj.id)
    return obj.id !== id;
  });
  $container.dispatchEvent(new CustomEvent('item deleted',{detail : {id : id}}))
}
function getCurrentSelectedDate(){
  return $state['app']['current_date']
}

function getState(){
  return $state
}

function updateSummary(data) {
  $state.summary.total_kcal = $state.summary.total_kcal + data.kcal
  $state.summary.protein = $state.summary.protein + data.protein
  $state.summary.carbs = $state.summary.carbs + data.carbs
  $state.summary.fat = $state.summary.fat + data.fat
  $summary.dispatchEvent(new CustomEvent("summary updated",{}))
}

function addToSummary(id, data) {
  var data = {
    "id" : id,
    "nutrients" : data
  }
  $state.summary2.push(data)
  console.log($state)
  $summary.dispatchEvent(new CustomEvent("summary updated", {}))
}

function removeFromSummary(id) {
  $state.summary2 = $state.summary2.filter(function (obj) {
    console.log("summary"+obj.id)
    return obj.id !== id;
  });
  console.log("removing done")
  $summary.dispatchEvent(new CustomEvent('summary updated', { detail: { id: id } }))
}

function updateDate(date){
  $state['app']['current_date'] = date
  $container.dispatchEvent(new CustomEvent("date changed",{}))
}

function cleanStateItems(){
  $state['diary']['items'] = []
  $container.dispatchEvent(new CustomEvent("on items clean",{}))
}

function loadStateFromDb(){

}

init()