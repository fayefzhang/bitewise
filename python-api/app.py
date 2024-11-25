from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/process', methods=['POST'])
def process_data():
    data = request.json
    search_term = data.get("search_term", "")
    user_info = data.get("user_info", {})
    
    # more things


    return jsonify({"status": "success"})

if __name__ == '__main__':
    app.run(port=5000)