var $deleteTimer
var $app = document.querySelector('#app');
$app.addEventListener('appinit', onInit)

var $source, $container,$date,$dateleft,$dateright,$items,$summary,$settingsIcon,$closeSettingsIcon,
$main,$settingsIcon,$themeChanger

function registerEvents(){
  $source = document.querySelector('#command');
  $container = document.querySelector('.container');
  $date = document.querySelector("#date")
  $dateleft = document.querySelector('#date-left');
  $dateright = document.querySelector('#date-right');
  $items = document.querySelector('#items');
  $summary = document.querySelector('#summary')
  $settingsIcon = document.querySelector("#settings-icon")
  $closeSettingsIcon = document.querySelector("#close-settings-icon")
  $main = document.querySelector("#main")
  $settings = document.querySelector("#settings")
  $themeChanger = document.querySelector("#theme-changer")

  $app.addEventListener('item added', onItemAdd)
  $app.addEventListener('on items clean', onItemsClean)
  $app.addEventListener('date changed', onDateChanged)
  $app.addEventListener('item deleted', onItemDelete)
  $app.addEventListener('summary updated', onSummaryUpdate)
  $app.addEventListener('keypress', onNewCommand);

  $settingsIcon.addEventListener('click', onSettingsClick)
  $themeChanger.addEventListener('click', onThemeChange)
  $closeSettingsIcon.addEventListener('click', onCloseSettingsClick)
  $dateleft.addEventListener('click', onPreviousDate);
  $dateright.addEventListener('click', onNextDate);
}

function onInit(event) {
  registerEvents();
  if (darkmode.isActivated()) {
    $themeChanger.textContent = "JASNY"
  } else {
    $themeChanger.textContent = "CIEMNY"
  }
  updateDate(getCurrentSelectedDate())
 
}

function onItemDelete(event) {
  
  var div = document.querySelector("#id-"+event.detail.id)
  div.remove()
  removeFromSummary(parseInt(event.detail.id))
}

function onDeleteClick(event){
  let id = parseInt(event.target.id.split('-')[2])
  removeItemFromState(id);
  saveStateToDb()
}

function onItemAdd(event){
  var div = document.createElement("div");
  var span_item = document.createElement("div")
  div.classList.add("flex")
  span_item.classList.add("item")
  var span_delete = document.createElement("div")
  var db_data = findFoodItem(event.detail.parsed.foodItem)
  console.log(db_data)
  if(db_data){
    var nutrients = calculateNutrients(event.detail.parsed, db_data)
    addToSummary(event.detail.raw.id, nutrients)
    span_item.innerHTML = "" + event.detail.parsed.input + " - " + nutrients.kcal + " kcal"+"";
  } else if ('kcal' in event.detail.parsed.custom){
    addToSummary(event.detail.raw.id, event.detail.parsed.custom)
    span_item.innerHTML = "" + event.detail.parsed.input + " - " + event.detail.parsed.custom.kcal + " kcal" + "";
    span_item.innerHTML += " (c)"
  }else{
    span_item.innerHTML = ""+event.detail.raw.string +""
  }
  div.id = "id-"+event.detail.raw.id
  span_delete.textContent = " D"
  span_delete.classList.add("delete")
  span_delete.classList.add("hidden")
  span_delete.id = "delete-id-"+event.detail.raw.id

  span_item.id = "item-id-"+event.detail.raw.id
  span_item.addEventListener('click', onItemClick);
  span_delete.addEventListener('click', onDeleteClick)
  div.appendChild(span_item)
  div.appendChild(span_delete)
  $items.appendChild(div)
}


function onNewCommand(event) {
  if (event.which === 13) {
    const textContent = event.target.textContent
    var splitted_text = event.target.textContent.split("\n")
    event.preventDefault();
    if(textContent !== ""){
      for(let index in splitted_text){
        addItemToState(splitted_text[index])
      }
      
      saveStateToDb();
    }
    event.target.textContent = ""
  }
}

function onPreviousDate(event){
  updateDate(modifyDate(getCurrentSelectedDate(), -1))
}

function onNextDate(event) {
  updateDate(modifyDate(getCurrentSelectedDate(),1))
}

function onItemClick(event){
  var item_id = event.target.id.split("-")[2]
  
  var delete_icon = document.querySelector("#delete-id-"+item_id)
  if(delete_icon.classList.contains("hidden")){
    delete_icon.classList.remove("hidden")
  }else{
    delete_icon.classList.add("hidden")
  }
}

function onThemeChange(event){

  darkmode.toggle();
  
  if (darkmode.isActivated()) {
    $themeChanger.textContent = "JASNY"
  } else {
    $themeChanger.textContent = "CIEMNY"
  }
}

async function onDateChanged() {

  $date.innerHTML = getCurrentSelectedDate()
  cleanStateItems();
  cleanSummary();
  
  getDiaryItems(getCurrentSelectedDate(), function (data) {
    if (data) {
      for (let index in data.items) {
        
        addItemToState(data.items[index].string, data.items[index].id)
      }
     onDateChangeCompleted();
    } else {
      onDateChangeCompleted();
    }
  },
    function () {
      onDateChangeCompleted();})
    
}

function onDateChangeCompleted(){
  if ($demo) {
    
    
    if ($state['diary']['items'].length === 0) {
      

      addItemToState("1 jabłko")
      addItemToState("1/2 szklanki mleka")
      saveStateToDb()
      $demo = false
    }
  }
}

function onUpdate(event) {

}

function onSummaryUpdate(event){
  var summary = {
    "total_kcal": 0,
    "protein": 0,
    "fat": 0,
    "carbs": 0
  }
  for(let index in $state.summary2){
    let item = $state.summary2[index].nutrients
    
    summary.total_kcal += item.kcal
    summary.protein += item.protein
    summary.fat += item.fat
    summary.carbs += item.carbs
  }
  
  if(summary.total_kcal !== 0){
  $summary.innerHTML = `<span> ${summary.total_kcal} kcal, ${summary.protein}
  białko, ${summary.fat} tłuszcze, ${summary.carbs} węgle </span>`
  }else{
    $summary.innerHTML = "<span> ^ Kliknij i dodaj jakieś papu</span>"
  }
}

function onItemsClean(event) {
  $items.innerHTML = ""
}

function onSettingsClick(event){
  
  $main.classList.add("hidden")
  $settings.classList.remove("hidden")
}

function onCloseSettingsClick(event){
  
  $main.classList.remove("hidden")
  $settings.classList.add("hidden")
}
