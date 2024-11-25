import express, { Application, Request, Response } from 'express';
import axios from 'axios';

const app: Application = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.post('/api/search', async (req: Request, res: Response) => {
    try {
        const { query } = req.body;
        // we could also make this not required and just default to something
        if (!query) {
            return res.status(400).json({ message: 'Query is required' });
        }

        const response = await axios.post('http://localhost:5000/process-news', { query });
        res.json(response.data);
    } catch (error) {
        console.error("error processing search request", error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});