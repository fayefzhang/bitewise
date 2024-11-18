import json 

with open('test_daily_data.json', 'r') as file:
    data = json.load(file)
    print(len(data))