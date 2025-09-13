import requests

# Test the menu endpoint to see if stock status gets updated
try:
    response = requests.get("http://localhost:8000/api/menu")
    if response.status_code == 200:
        menu_data = response.json()
        print("Menu items after calling /api/menu endpoint:")
        for item in menu_data:
            if item.get("stock_status") == "Out of Stock" or item.get("dish_name") in [
                "BagnetSilog",
                "Bagnet Bagoong Rice",
            ]:
                print(f"- {item['dish_name']}: {item.get('stock_status')}")
                if "ingredients" in item:
                    print(f"  Ingredients: {len(item['ingredients'])}")
                    for ing in item["ingredients"]:
                        print(f"    * {ing['ingredient_name']}: {ing['quantity']}")
    else:
        print(f"Error: {response.status_code} - {response.text}")
except Exception as e:
    print(f"Connection error: {e}")
    print("Make sure the backend server is running on port 8000")
