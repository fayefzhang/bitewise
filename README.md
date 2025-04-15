BITEWISE DEMO:
[![Watch the demo](https://img.youtube.com/vi/hUM5Vj07DtA/0.jpg)](https://www.youtube.com/watch?v=hUM5Vj07DtA)

Start python backend (use Python version 3.11 or 3.12, and ensure that `ffmpeg` is installed on your device (`brew install ffmpeg`)):

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
