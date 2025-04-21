# Bitewise 📰

**Your hub for personalized, digestible news.**

Bitewise tackles information overload by delivering news tailored to *your* interests and location. We aggregate, analyze, summarize, and even generate audio digests, ensuring you stay informed without feeling overwhelmed.

[![Watch the demo](https://img.youtube.com/vi/hUM5Vj07DtA/0.jpg)](https://www.youtube.com/watch?v=hUM5Vj07DtA)

## ✨ Features

| Feature                      | Description                                                 | Key Technologies Used                                                                 |
| :--------------------------- | :---------------------------------------------------------- | :------------------------------------------------------------------------------------ |
| **News Dashboard**           | Streamlined hub delivering daily summarized top news.       | Web Crawling (`Beautiful Soup`, `Exa`), Topic Modeling (`BERTopic`), Summarization (`OpenAI`) |
| **Local News & Tracked Topics** | Personalized news based on interests and location.          | Storage (`MongoDB`), Search (`NewsAPI`), Web Crawling, Topic Modeling                   |
| **AI Podcast**               | Engaging audio summaries of the day's top stories.          | Generation (`Podcastfy`, `OpenAI`), Storage (`AWS S3`)                                |
| **Article Search**           | Relevant articles and summaries based on user preferences. | Search (`NewsAPI`, `MongoDB`), Data Enhancement (`MediaBias`, `OpenAI`), Filtering (`Node.js`), Summarization (`OpenAI`) |

## 🚀 Getting Started

Follow these instructions to get Bitewise running locally on your machine.

### Prerequisites

*   **Git:** To clone the repository.
*   **Node.js & npm:** For the frontend and webapp backend. ([Download Node.js](https://nodejs.org/))
*   **Python:** Version 3.11 or 3.12 recommended. ([Download Python](https://www.python.org/))
*   **ffmpeg:** Required for audio processing (AI Podcast feature).
    *   On macOS (using Homebrew): `brew install ffmpeg`
    *   On Debian/Ubuntu: `sudo apt update && sudo apt install ffmpeg`
    *   On Windows: Download from the [official ffmpeg website](https://ffmpeg.org/download.html) and add it to your system's PATH.

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone fayefzhang/bitewise
    ```

2.  **Set up Python Backend:**
    *   Navigate to the Python API directory:
        ```bash
        cd python-api
        ```
    *   Install required Python packages:
        ```bash
        pip install -r requirements.txt
        ```
    *   *(Optional but recommended)*: Consider using a virtual environment (`venv`) to manage dependencies:
        ```bash
        python -m venv venv
        source venv/bin/activate # On Windows use `venv\Scripts\activate`
        pip install -r requirements.txt
        ```
    *   Return to the root directory:
        ```bash
        cd ..
        ```

3.  **Set up Webapp Backend:**
    *   Navigate to the Node.js backend directory:
        ```bash
        cd backend
        ```
    *   Install npm packages (only needs to be done once):
        ```bash
        npm install
        ```
    *   Return to the root directory:
        ```bash
        cd ..
        ```

4.  **Set up Webapp Frontend:**
    *   Navigate to the frontend directory:
        ```bash
        cd frontend
        ```
    *   Install npm packages (only needs to be done once):
        ```bash
        npm install
        ```
    *   Return to the root directory:
        ```bash
        cd ..
        ```

*(Note: Please make sure you've added your own API keys for NewsAPI, EXA, OpenAI, MongoDB, etc).*

### Running the Application

You'll need to run the three main components (Python backend, Node.js backend, Frontend) simultaneously in separate terminal windows/tabs.

1.  **Start Python Backend:**
    ```bash
    cd python-api
    python app.py
    # Or if using a venv: source venv/bin/activate (or venv\Scripts\activate) then python app.py
    ```

2.  **Start Webapp Backend:**
    ```bash
    cd backend
    npx ts-node src/server.ts
    ```

3.  **Start Webapp Frontend:**
    ```bash
    cd frontend
    npm run dev
    ```

Once all services are running, you should be able to access the Bitewise web application in your browser at `http://localhost:3000`.
