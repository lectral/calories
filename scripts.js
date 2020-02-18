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
const $item = document.querySelector('.item');
const $summary = document.querySelector('#summary')
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
  }
}

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

function init() {
  console.log("Initializing app")
  var request = window.indexedDB.open("calories_diar2y", 2);
  request.onerror = function (event) {
    console.log("Failed to create/open database")
  }
  request.onsuccess = function (event) {
    $database = event.target.result
    console.log("Database created/opened");
    loadState($state.app.current_date);
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


function loadState(date) {
  var data = []
  $date.innerHTML = date
  getDiaryItems(date,
    // on record found
    function (record) {
      console.log("Data found")
      $state.diary = record
      resetSummary()
      render()
    },
    //on record not found
    function () {
      console.log("Data not found!")
      $state.diary.items = []
      resetSummary()
      render()
    });
}

function resetDiary() {
  $state.diary.items = []
}

function resetSummary() {
  $state.summary.total_kcal = 0
  $state.summary.protein = 0
  $state.summary.fat = 0
  $state.summary.carbs = 0
}

function render() {
  clearDiaryView()
  for (let id in $state.diary.items) {
    addFoodItemToList($state.diary.items[id].string, $state.diary.items[id].id)
  }
  renderSummary()
}

function renderSummary() {
  console.log("rendering summary")
  console.log($state.summary)
  $summary.innerHTML = `${$state.summary.total_kcal} kcal, ${$state.summary.protein}
  białko, ${$state.summary.fat} tłuszcze, ${$state.summary.carbs} węgle`
}


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

function clearDiaryView() {
  $items.innerHTML = ''
}

function addOrUpdateDiaryItems() {

}

function parseInput(input) {
  var regex = /. .*/g;
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

function isQuantityMod(text) {
  let result = findModifier(text)
  if (result) {
    return true
  } else {
    return false
  }
}

function processInput() {

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

function addEntry(input, entry, item_id) {
  var div = document.createElement("div");
  if (input['quantityMod'] === 'unit') {
    var mod = entry['mods']['unit']
    var grams = entry['mods']['unit']
  } else {
    var mod = findModifier(input['quantityMod'])
    if (mod === "gram") {
      var grams = 1
    } else {
      var grams = entry['mods'][mod]
    }
  }
  var nutrients = calculateNutrients(input['quantity'], grams, entry['nutrition'])
  console.log(nutrients)
  updateSummary(nutrients)
  renderSummary()
  div.innerHTML = input['input'] + " - " + nutrients.kcal + " kcal";
  div.className = "item"
  div.id = "i-"+item_id
  div.addEventListener('mousedown', function (event) {
    // simulating hold event
    event.target.classList.add("hold")
    setTimeout(function () {
      if(event.target.classList.contains("hold")){
        event.target.remove()
        var to_remove = parseInt(event.target.id.split("-")[1])
        console.log("removing" + to_remove)
        removeItemFromDiary(to_remove);
        saveStateToDb();
        render()
      }
    }, 2000);
  });
  div.addEventListener('mouseup', function (event) {
    // simulating hold event
    setTimeout(function () {
      event.target.classList.remove("hold")
    }, 2000);
  });
  $items.appendChild(div)
  
}

function removeItemFromDiary(id){
  $state.diary.items = $state.diary.items.filter(function (obj) {
    return obj.id !== id;
  });
}

function calculateNutrients(quantity, grams, nutrition) {
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

const typeHandler = function (e) {
  var dict = parseInput(e.target.textContent)
  var foodItem = findFoodItem(dict['foodItem'])
}

//$source.addEventListener('input', typeHandler)
//

function addFoodItemToList(text, id) {
  return new Promise((resolve, reject) => {
    var dict = parseInput(text)
    var foodItem = findFoodItem(dict['foodItem'])
    if (foodItem) {
      addEntry(dict, foodItem, id)
    }
    $source.blur()
    $source.innerHTML = ''
    $source.focus()
    resolve("success");
  });
}


function saveToState(text) {
  $state['diary']['items'].push({
    "id" : $state['diary']['max_id'] + 1,
    "string": text
  })
  $state['diary']['max_id'] = $state['diary']['max_id'] + 1
  return parseInt($state['diary']['max_id'])
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

function updateSummary(data) {
  $state.summary.total_kcal = $state.summary.total_kcal + data.kcal
  $state.summary.protein = $state.summary.protein + data.protein
  $state.summary.carbs = $state.summary.carbs + data.carbs
  $state.summary.fat = $state.summary.fat + data.fat
}

$source.addEventListener('keypress', (e) => {
  if (e.which === 13) {
    const textContent = e.target.textContent
    e.preventDefault();
    var id = saveToState(textContent);
    addFoodItemToList(textContent, id)
    console.log($state)
    saveStateToDb()
  }
});

$dateleft.addEventListener('click', (e) => {
  console.log($state.app.current_date)
  let newDate = modifyDate($state.app.current_date, -1)
  $state.app.current_date = newDate
  console.log(newDate)
  loadState(newDate)
});

$dateright.addEventListener('click', (e) => {
  console.log($state.app.current_date)
  let newDate = modifyDate($state.app.current_date, 1)
  $state.app.current_date = newDate
  console.log(newDate)
  loadState(newDate)
});



init()