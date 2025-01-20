Start python backend (use Python version 3.11 or later, and ensure that `ffmpeg` is installed on your device (`brew install ffmpeg`)):

```
cd python-api
pip install -r requirements.txt
python app.py
```

Start webapp backend: (`npm install` once)

```
cd backend
npx ts-node src/server.ts
```

Start webapp frontend: (`npm install` once)

```
cd frontend
npm run dev
```
