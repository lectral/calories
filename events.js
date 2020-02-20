var $deleteTimer

function onInit(event) {
  updateDate(getCurrentSelectedDate())
  if($demo){
    if($state['diary']['items'].length === 0){
      addItemToState("1 jabłko")
      addItemToState("1/2 szklanki mleka")
    }
  }
}

function onItemDelete(event) {
  console.log("removing item"+event.detail.id)
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
  console.log(event.detail)
  var div = document.createElement("div");
  var span_item = document.createElement("div")
  div.classList.add("flex")
  span_item.classList.add("item")
  var span_delete = document.createElement("div")
  var db_data = findFoodItem(event.detail.parsed.foodItem)
  if(db_data){
    console.log("db dta found")
    var nutrients = calculateNutrients(event.detail.parsed, db_data)
    addToSummary(event.detail.raw.id, nutrients)
    span_item.innerHTML = event.detail.raw.string + " - " + nutrients.kcal + " kcal";
  }else{
    span_item.innerHTML = event.detail.raw.string
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
    event.preventDefault();
    if(textContent !== ""){
      addItemToState(textContent)
      console.log($state)
      saveStateToDb();
    }
    event.target.textContent = ""
  }
}

function onPreviousDate(event){
  updateDate(modifyDate(getCurrentSelectedDate(), -1))
}

function onNextDate(event) {
  console.log(getCurrentSelectedDate())
  updateDate(modifyDate(getCurrentSelectedDate(),1))
}

function onItemClick(event){
  var item_id = event.target.id.split("-")[2]
  console.log(item_id)
  var delete_icon = document.querySelector("#delete-id-"+item_id)
  if(delete_icon.classList.contains("hidden")){
    delete_icon.classList.remove("hidden")
  }else{
    delete_icon.classList.add("hidden")
  }
}



function onDateChanged() {
  console.log("date changed")
  $date.innerHTML = getCurrentSelectedDate()
  cleanStateItems();
  cleanSummary();
  getDiaryItems(getCurrentSelectedDate(), function (data) {
    if (data) {
      for (let index in data.items) {
        console.log(data.items[index])
        addItemToState(data.items[index].string, data.items[index].id)
      }
    } else {
      console.log("Data not found!")
    }
  },
    function () { })
}

function onUpdate(event) {

}

function onSummaryUpdate(event){
  console.log("updating summary")
  var summary = {
    "total_kcal": 0,
    "protein": 0,
    "fat": 0,
    "carbs": 0
  }
  for(let index in $state.summary2){
    let item = $state.summary2[index].nutrients
    console.log(item)
    summary.total_kcal += item.kcal
    summary.protein += item.protein
    summary.fat += item.fat
    summary.carbs += item.carbs
  }
  console.log(summary)
  $summary.innerHTML = `${summary.total_kcal} kcal, ${summary.protein}
  białko, ${summary.fat} tłuszcze, ${summary.carbs} węgle`
}

function onItemsClean(event) {
  $items.innerHTML = ""
}

function onSettingsClick(event){
  console.log("settings opened")
  $main.classList.add("hidden")
  $settings.classList.remove("hidden")
}

function onCloseSettingsClick(event){
  console.log("settings opened")
  $main.classList.remove("hidden")
  $settings.classList.add("hidden")
}
$container.addEventListener('appinit', onInit)
$container.addEventListener('item added', onItemAdd)
$container.addEventListener('on items clean', onItemsClean)
$container.addEventListener('date changed', onDateChanged)
$container.addEventListener('item deleted', onItemDelete)
$summary.addEventListener('summary updated', onSummaryUpdate)
$source.addEventListener('keypress', onNewCommand);

$settingsIcon.addEventListener('click', onSettingsClick)
$closeSettingsIcon.addEventListener('click', onCloseSettingsClick)
$dateleft.addEventListener('click', onPreviousDate);
$dateright.addEventListener('click', onNextDate);