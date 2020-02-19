import simplejson as json
import requests
import time
#your spreadsheet key here. I'm using an example from the Victorian election campaign

key_products = "1Gl0Qn6fLnsKJ1HvrK_HAmD6EIV83fl7AP8ctEv_vbHE"
key_mods = "12K_UNM-R04XZt5UV8oYE1rTdw0MepWDdpTbMCHJDNVk"

def getData(key):
	#google api request urls - I'm doing the first one just to get nice key values (there's probably a better way to do this)

	url1 = "https://spreadsheets.google.com/feeds/cells/" + key + "/od6/public/values?alt=json"
	url2 = "https://spreadsheets.google.com/feeds/list/" + key + "/od6/public/values?alt=json"

	#get the json in cell format from google

	ssContent1 = requests.get(url1).json()

	#lists to store new keys and products_sheet

	newKeys = []
	newData = []

	#make a list of the entries in the first row for nice keys

	for item in ssContent1['feed']['entry']:
		if item['gs$cell']['row'] == '1':
			newKeys.append(item['content']['$t'])

	print(newKeys)

	#get json in list format 

	ssContent2 = requests.get(url2).json()

	#remap entries from having gsx$-prefixed keys to having no prefix, ie our first row as keys

	for entry in ssContent2['feed']['entry']:
		rowData = []
		for key in newKeys:
			rowData.append(entry['gsx$' + key]['$t'])
		newData.append(dict(zip(newKeys, rowData)))

	return newData

#saves the json file locally as output.json. you could do other stuff with it though, like put it on a server somewhere 
products_sheet = getData(key_products)
mods_sheet = getData(key_mods)

output = {
	"mods" : [],
	"products" : []
}

mods = [
	"unit"
]

def parseNumberData(dd):
	return float(dd.replace(",","."))
mods_db = []

for row in mods_sheet:
	mods.append(row['id'])
	aliases = []

	for key in row:
		if(key != "id" and row[key] != ''):
			aliases.append(row[key].strip())
	a = {
		"id" : row['id'],
		"aliases" : aliases
	}
	mods_db.append(a)

products = []

for products_sheet in products_sheet:
	aliases = products_sheet['aliases'].split(",")
	aliases = list(map(str.strip, aliases))
	mods_out = {}
	for mod in mods:
		if(mod in products_sheet):
			if(products_sheet[mod] != ""):
				mods_out[mod] = products_sheet[mod]
		else:
			pass

	new_product = {
		"id" : products_sheet['id'],
		"name" : products_sheet['name'],
		"aliases" : aliases,
		"nutrition" : {
			"kcal" : parseNumberData(products_sheet['kcal']),
			"protein" : parseNumberData(products_sheet['protein']),
			"fat" : parseNumberData(products_sheet['fat'].replace(",",".")),
			"carbs" : parseNumberData(products_sheet['carbs'])
		},
		"mods" : mods_out
	}
	products.append(new_product)


final = {
	"version" : time.time(),
	"mods" : mods_db,
	"products": products
}
json = json.dumps(final,indent=2)
print(json)

f = open('db.json', 'wt', encoding='utf-8')
f.write(json)