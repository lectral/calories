const $db = {
  "mods" : [ 
    {"id" : "gram" ,"aliases": ["gram", "gramów", "g", "gramy"]},
    {"id" : "teaspoon" ,"aliases": ["łyżeczek","łyżeczka","łyżeczki"]},
    {"id" : "spoon" ,"aliases": ["łyżka","łyżek","łyżki"]},
    {"id" : "glass" ,"aliases": ["szklanka","szklanek","szklanki"]},
    {"id" : "wrap" ,"aliases": ["placka","placków","placki", "placek"]},
	{"id" : "ball" ,"aliases": ["kula","kulka","kule", "kulki"]}
  ],
  "products" : [ 
    {
      "id": 1,
      "name": "jajko", 
      "aliases": ["jajka","jajko","jajo","jaja","jajek"],
      "nutrition": {
        "kcal": 143,
        "protein": 12.56,
        "fat": 9.51,
        "carbs" : 0.72
      }, 
      "mods": {
        "unit" : 56
      }
    },
    {
      "id": 2,
      "name": "cukier", 
      "aliases": ["cukru","cukrowi","cukrem","cukru"],
      "nutrition": {
        "kcal": 405,
        "protein": 0,
        "fat": 0, 
        "carbs" : 100 
      }, 
      "mods": {
        "unit" : 56,
        "teaspoon" : 6,
        "spoon" : 12, 
        "glass" : 200
      }
    },
    {
      "id": 3,
      "name": "jabłko", 
      "aliases": ["jabłko","jabłek","jabłka","japka","japko"],
      "nutrition": {
        "kcal": 50,
        "protein": 0.4, 
        "fat": 0.4, 
        "carbs" : 10.1 
      }, 
      "mods": {
        "unit" : 180
      }
    },
    {
      "id": 4,
      "name": "placek tortilla",
      "aliases": ["tortilii", "tortilla", "tortille"],
      "nutrition" : {
        "kcal" : 319,
        "protein" : 9.7,
        "fat" : 5.4,
        "carbs" : 50.4
      },
      "mods": {
        "unit" : 62,
        "wrap" : 62
      }
    },
	  {
      "id": 5,
      "name": "mozzarela",
      "aliases": ["mozzarelli", "mozzarela", "mozzarelle"],
      "nutrition" : {
        "kcal" : 254,
        "protein" : 24,
        "fat" : 16,
        "carbs" : 3
      },
      "mods": {
        "unit" : 60,
        "ball" : 125,
      }
    },
	  {
      "id": 6,
      "name": "pomidor",
      "aliases": ["pomidor", "pomidora", "pomidory"],
      "nutrition" : {
        "kcal" : 19,
        "protein" : 0.9,
        "fat" : 0.2,
        "carbs" : 2.9
      },
      "mods": {
        "unit" : 170
      }
    },
	{
      "id": 7,
      "name": "pesto",
      "aliases": ["pesto", "pesta"],
      "nutrition" : {
        "kcal" : 340,
        "protein" : 3.7,
        "fat" : 34.6,
        "carbs" : 6.3
      },
      "mods": {
        "unit" : 170,
		"spoon" : 20,
		"teaspoon" : 10
      }
    }
  ] 
}
