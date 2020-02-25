if (!window.indexedDB) {
    console.log(
    "Your browser doesn't support a stable version of IndexedDB. Such and such feature will not be available."
  );
}

var $app = document.querySelector('#app');

// var $source = document.querySelector('#command');
// var $container = document.querySelector('.container');
// var $date = document.querySelector("#date")
// var $dateleft = document.querySelector('#date-left');
// var $dateright = document.querySelector('#date-right');
// var $items = document.querySelector('#items');
// var $summary = document.querySelector('#summary')
// var $settingsIcon = document.querySelector("#settings-icon")
// var $closeSettingsIcon = document.querySelector("#close-settings-icon")
// var $main = document.querySelector("#main")
// var $settings = document.querySelector("#settings")
// var $themeChanger = document.querySelector("#theme-changer")
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
  "settings" :{
    "max_kcal" : 1800,
    "jsonbin-url" : "",
    "jsonbin-key": ""
  },
  "summary": {
    "total_kcal": 0,
    "protein": 0,
    "fat": 0,
    "carbs": 0
  },
  "summary2" : []
}

function renderApp(){
  var xhr = new XMLHttpRequest();
  xhr.open('GET', 'app2.html', true);
  xhr.onreadystatechange = function () {
    if (this.readyState !== 4) return;
    if (this.status !== 200) return; // or whatever error handling you want
    document.getElementById('app').innerHTML = this.responseText;
    var $themeChanger = document.querySelector("#theme-changer")
    init();

  };
  xhr.send();
}

function init() {
  
  getJSON("/db.json",function(err, data){
    $db = data
    
    var request = window.indexedDB.open("calories_diar2y", 2);
    request.onerror = function (event) {
      
    }
    request.onsuccess = function (event) {
      $database = event.target.result
      
      //loadState($state.app.current_date);
      $app.dispatchEvent(new CustomEvent('appinit', {}))
    }
    request.onupgradeneeded = function (event) {

      $database = event.target.result
      var objectStore = $database.createObjectStore("diary", {
        keyPath: "date"
      });
      objectStore.transaction.oncomplete = function (event) {
        
      }
    }
  })
 
}
// PARSE

function quantityToGrams(quantityMod, db_data){
  var grams
  if (quantityMod === 'unit') {
    var grams = db_data['mods']['unit']
  } else {
    var mod = quantityMod
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
      if ($db['mods'][key]['aliases'][kaliases] === modifier.toLowerCase()) {
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
      
      if (value['aliases'][alias].toLowerCase() === item.toLowerCase()) {
        return value
      }
    }
  }
  return false;
}


function parseInput(input) {
  var regex = /. .*/g;
  
  var string_words = input.split(" ")
  input = input.toLowerCase()
  var dict = {
    "input": input,
    "quantity": 1,
    "quantityMod": "unit",
    "foodItem": "",
    "custom" : {}
  }

  var modifier = extractModifier(input)
  if(modifier !== false){
    dict.quantityMod = modifier.mod
    input = input.replace(modifier.alias,"")
  }

  var quantity = extractQuantity(input)
  
  if(quantity !== false){
    dict.quantity = quantity.quantity
    input = input.replace(quantity.raw, "")
  }

  var custom = extractCustomKcal(input)
  if(custom){
    input = input.replace(custom, "")
    dict['input'] = dict['input'].replace(custom,"")
    dict['custom']['kcal'] = parseInt(custom.replace(" kcal", "").replace(/^\s+|\s+$/g, '')); 
    dict['custom']['protein'] = 0
    dict['custom']['fat'] = 0
    dict['custom']['carbs'] = 0
    custom = extractCustomProtein(input)
    //[TO DO] REWRITE THIS!!!
    if (custom) {
      input = input.replace(custom, "")
      dict['input'] = dict['input'].replace(custom, "")
      dict['custom']['protein'] = parseInt(custom.replace("b", "").replace(/^\s+|\s+$/g, ''));
    }
    custom = extractCustomFat(input)
    if (custom) {
      input = input.replace(custom, "")
      dict['input'] = dict['input'].replace(custom, "")
      dict['custom']['fat'] = parseInt(custom.replace("t", "").replace(/^\s+|\s+$/g, ''));
    }
    custom = extractCustomCarbs(input)
    if (custom) {
      input = input.replace(custom, "")
      dict['input'] = dict['input'].replace(custom, "")
      dict['custom']['carbs'] = parseInt(custom.replace("w", "").replace(/^\s+|\s+$/g, ''));
    }
  }
  

  dict['foodItem'] = input.replace(/^\s+|\s+$/g, ''); 
  return dict
}

function extractQuantity(string){
  var words = string.split(" ")
  for(let idx in words){
    qwords = quantityWords(words[idx])
    if(!isNaN(words[idx]) && (words[idx] !== "")){
      
      return {quantity: parseInt(words[idx]), raw: words[idx]}
    }else if(qwords !== -1){
      
      return { quantity: qwords, raw: words[idx] }
    }
    return false;
  }
}

function extractModifier(string){
  for (let key in $db['mods']) {
    var value = $db['mods'][key]
    for (let kaliases in value['aliases']) {
      var alias_string = value['aliases'][kaliases].toLowerCase()
      
      
      if ((alias_string !== "") && (string.toLowerCase().includes(alias_string+" "))) {
        
        return {alias: alias_string, mod : value['id']}
      }
    }
  }
  return false
}

function extractCustomKcal(string){
  const rxp = / [0-9]+ kcal/g;
  const found = string.match(rxp)
  if(found){
    return found[0]
  }else{
    return false;
  }
}

function extractCustomProtein(string) {
  const rxp = / [0-9]+b/g;
  const found = string.match(rxp)
  if (found) {
    return found[0]
  } else {
    return false;
  }
}

function extractCustomFat(string) {
  const rxp = / [0-9]+t/g;
  const found = string.match(rxp)
  if (found) {
    return found[0]
  } else {
    return false;
  }
}

function extractCustomCarbs(string) {
  const rxp = / [0-9]+w/g;
  const found = string.match(rxp)
  if (found) {
    return found[0]
  } else {
    return false;
  }
}


function quantityWords(quantity){
  quantity = quantity.toLowerCase()
  if(quantity === "pół" || quantity === "pol" || quantity === "1/2"){
    return 0.5 
  }else if(quantity === "1/3"){
    return 0.33
  }else if(quantity === "1/4"){
    return 0.25
  }else{
    return -1
  }
}

// DB
function getDiaryItems(date, record_found, record_not_found) {
  var objectStore = $database.transaction("diary", "readwrite").objectStore(
    "diary")
  var request = objectStore.get(date)
  request.onerror = function (event) {
    
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
  
  var objectStore = $database.transaction("diary", "readwrite").objectStore(
    "diary")
  var request = objectStore.get($state.app.current_date)
  request.onerror = function (event) {
    
  };
  request.onsuccess = function (event) {
    var data = event.target.result
    if (data) {
      data.max_id = $state.diary.max_id
      data.items = $state.diary.items
      var requestUpdate = objectStore.put(data);
      requestUpdate.onerror = function (event) {
        
      };
      requestUpdate.onsuccess = function (event) {
        
      };

    } else {
      
      $state.diary.date = $state.app.current_date
      request_add = objectStore.add($state['diary'])
      request_add.onsuccess = function (event) {
        
      }
      request_add.onerror = function (event) {
        
      }
    }
  }
}

function saveSettingsToDb(){

}

// STATE
function addItemToState(item_string, item_id){
  var new_id
  if(!item_id){
    
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
  $app.dispatchEvent(new CustomEvent('item added',{
    detail : {
        raw : new_item, 
        parsed: parsed_item
      }}))
}

function removeItemFromState(id) {
  
  $state.diary.items = $state.diary.items.filter(function (obj) {
    
    return obj.id !== id;
  });
  $app.dispatchEvent(new CustomEvent('item deleted',{detail : {id : id}}))
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
  $app.dispatchEvent(new CustomEvent("summary updated",{}))
}

function addToSummary(id, data) {
  var data = {
    "id" : id,
    "nutrients" : data
  }
  $state.summary2.push(data)
  $app.dispatchEvent(new CustomEvent("summary updated", {}))
}

function cleanSummary(){
  $state.summary2 = []
  $app.dispatchEvent(new CustomEvent('summary updated', {}))
}

function removeFromSummary(id) {
  $state.summary2 = $state.summary2.filter(function (obj) {
    
    return obj.id !== id;
  });
  
  $app.dispatchEvent(new CustomEvent('summary updated', { detail: { id: id } }))
}

function updateDate(date){
  $state['app']['current_date'] = date
  $app.dispatchEvent(new CustomEvent("date changed",{}))
}

function cleanStateItems(){
  $state['diary']['items'] = []
  $app.dispatchEvent(new CustomEvent("on items clean",{}))
}

function loadStateFromDb(){

}

function updateSettings(setting,value){
  $state.settings[setting] = value
  $app.dispatchEvent(new CustomEvent('settings changed', {detail: {setting: setting, value: value}}))
}
