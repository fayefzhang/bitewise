from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/process', methods=['POST'])
def process_data():
    data = request.json
    search_term = data.get("search_term", "")
    user_info = data.get("user_info", {})
    
    # more things


    return jsonify({"status": "success"})

# For summarizing a single article
@app.route('/summarize-article', methods=['POST'])
def summarize_article():
    data = request.get_json()
    article = data.get('article')
    user_preferences = data.get('user_preferences')

    if not article:
        return jsonify({"error": "Article is required"}), 400
    if not user_preferences:
        return jsonify({"error": "User preferences are required"}), 400

    summary = generate_summary_individual(article, user_preferences)
    return jsonify({"summary": summary})

# For summarizing multiple articles into one summary
@app.route('/summarize-articles', methods=['POST'])
def summarize_article():
    data = request.get_json()
    articles = data.get('articles')
    user_preferences = data.get('user_preferences')

    if not articles:
        return jsonify({"error": "Articles are required"}), 400
    if not user_preferences:
        return jsonify({"error": "User preferences are required"}), 400

    summary = generate_summary_collection(articles, user_preferences)
    return jsonify({"summary": summary})


if __name__ == '__main__':
    app.run(port=5000)