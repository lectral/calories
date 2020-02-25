var $deleteTimer
var $app = document.querySelector('#app');
$app.addEventListener('appinit', onInit)

var $source, $container,$date,$dateleft,$dateright,$items,$summary,$settingsIcon,$closeSettingsIcon,
$main,$settingsIcon,$themeChanger,$home,$command

function registerEvents(){
  $source = document.querySelector('#command');
  $container = document.querySelector('.container');
  // $date = document.querySelector("#date")
  $dateMonth = document.querySelector("#month")
  $dateDayName = document.querySelector("#day-name")
  $dateDayNumber = document.querySelector("#day-number")
  $dateleft = document.querySelector('#date-left');
  // $dateright = document.querySelector('#date-right');
  $items = document.querySelector('#items');
  $summary = document.querySelector('#summary')
  $settingsIcon = document.querySelector("#settings-btn")
  $closeSettingsIcon = document.querySelector("#close-settings-btn")
  $main = document.querySelector("#main")
  $settings = document.querySelector("#settings")
  $themeChanger = document.querySelector("#theme-changer")
  $command = document.querySelector("#command-input")
  $home = document.querySelector("#home")

  $app.addEventListener('item added', onItemAdd)
  $app.addEventListener('on items clean', onItemsClean)
  $app.addEventListener('date changed', onDateChanged)
  $app.addEventListener('item deleted', onItemDelete)
  $app.addEventListener('summary updated', onSummaryUpdate)
  $command.addEventListener('keypress', onNewCommand);

  $settingsIcon.addEventListener('click', onSettingsClick)
  $themeChanger.addEventListener('click', onThemeChange)
  $closeSettingsIcon.addEventListener('click', onCloseSettingsClick)
  // $dateleft.addEventListener('click', onPreviousDate);
  // $dateright.addEventListener('click', onNextDate);
}

function onInit(event) {
  registerEvents();
  if (getCookie("darktheme") === "true") {
    $themeChanger.textContent = "JASNY"
    changeTheme(1)
  } else {
    $themeChanger.textContent = "CIEMNY"
    changeTheme(0)
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
  var item_nutrients = document.createElement("div")
  item_nutrients.className = "item-nutrients"

  var item_input = document.createElement("div")
  item_input.className = "item-input"

  var item = document.createElement("div");
  item.classList.add("item")
  var span_delete = document.createElement("div")
  
  var db_data = findFoodItem(event.detail.parsed.foodItem)
  if(db_data){
    var nutrients = calculateNutrients(event.detail.parsed, db_data)
    addToSummary(event.detail.raw.id, nutrients)
    item_nutrients.innerHTML = nutrients.kcal + " kcal, " + nutrients.protein+" białka, "+nutrients.fat+" tłuszczu, "+nutrients.carbs+" węgli" 
    item_input.innerHTML = "" + event.detail.parsed.input;
  } else if ('kcal' in event.detail.parsed.custom){
    addToSummary(event.detail.raw.id, event.detail.parsed.custom)
    item_nutrients.innerHTML = nutrients.kcal + " kcal, " + nutrients.protein + " białka, " + nutrients.fat + " tłuszczu, " + nutrients.carbs + " węgli"
    item_input.innerHTML = "" + event.detail.parsed.input
    item_input.innerHTML += " (c)"
  }else{
    item_nutrients.innerHTML = "brak danych"
    item_input.innerHTML = ""+event.detail.raw.string +""
  }
  item.id = "id-"+event.detail.raw.id
  span_delete.textContent = " D"
  span_delete.classList.add("delete")
  span_delete.classList.add("hidden")
  span_delete.id = "delete-id-"+event.detail.raw.id

  item.addEventListener('click', onItemClick);
  span_delete.addEventListener('click', onDeleteClick)
  item.appendChild(item_nutrients)
  item.appendChild(item_input)
  item_input.appendChild(span_delete)
  $items.appendChild(item)
}


function onNewCommand(event) {
  if (event.which === 13) {
    const textContent = event.target.value
    var splitted_text = textContent.split("\n")
    event.preventDefault();
    if(textContent !== ""){
      for(let index in splitted_text){
        addItemToState(splitted_text[index])
      }
      
      saveStateToDb();
    }
    event.target.value = ""
  }
}

function onPreviousDate(event){
  updateDate(modifyDate(getCurrentSelectedDate(), -1))
}

function onNextDate(event) {
  updateDate(modifyDate(getCurrentSelectedDate(),1))
}

function onItemClick(event){
  var item_id = event.currentTarget.id.split("-")[1]
  
  var delete_icon = document.querySelector("#delete-id-"+item_id)
  if(delete_icon.classList.contains("hidden")){
    delete_icon.classList.remove("hidden")
  }else{
    delete_icon.classList.add("hidden")
  }
}

function changeTheme(mode){
  if(mode === 1){
    $themeChanger.textContent = "JASNY"
    $main.classList.add("dark-theme")
    document.body.style.backgroundColor = "#212121";
    $container.classList.add("dark-theme")
    setCookie("darktheme", true, 10000)
  }else{
    $main.classList.remove("dark-theme")
    document.body.style.backgroundColor = "#fff";
    $themeChanger.textContent = "CIEMNY"
    $container.classList.remove("dark-theme")

    setCookie("darktheme", false, 10000)
  }
}

function onThemeChange(event){

  if ($main.classList.contains("dark-theme")) {
    changeTheme(0)
  } else {
    changeTheme(1)
  }
}

async function onDateChanged() {
  const date = new Date(getCurrentSelectedDate());
  $dateMonth.innerHTML = getMonthName(date)
  $dateDayNumber.innerHTML = date.getDate()
  $dateDayNumber.innerHTML += "<span id=\"date-left\">L</span>"
  $dateDayNumber.innerHTML += "<span id=\"date-right\">R</span>"
  document.querySelector('#date-left').addEventListener('click',onPreviousDate);
  document.querySelector('#date-right').addEventListener('click', onNextDate);
  $dateDayName.innerHTML = getDayName(date)
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
  
  $home.classList.add("hidden")
  $settings.classList.remove("hidden")
}

function onCloseSettingsClick(event){
  
  $home.classList.remove("hidden")
  $settings.classList.add("hidden")
}
