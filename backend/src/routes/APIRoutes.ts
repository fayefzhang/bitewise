import express from "express";
import { Request, Response } from "express";
import axios from 'axios';

const router = express.Router();

// @route POST api/search
// @description Processes a news search query
router.post('/search', async (req: Request, res: Response) => {
    try {
        const { query, user_preferences } = req.body;

        // we could also make this not required and just default to something
        if (!query) {
            return res.status(400).json({ message: 'Query is required' });
        }

        const response = await axios.post('http://localhost:5000/search', { query, user_preferences });
        res.json(response.data);
    } catch (error) {
        console.error("error processing search request", error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// @route POST summarize/article
// @description Summarizes a single article based on user preferences using OpenAI
router.post('/summarize/article', async (req: Request, res: Response) => {
    try {
        const { article, user_preferences } = req.body; 
        if (!article) {
            return res.status(400).json({ message: 'Article is required' });
        }
        if (!user_preferences) {
            return res.status(400).json({ message: 'User preferences are required' });
        }

        // send article and user prefs to the Python backend
        const response = await axios.post('http://localhost:5000/summarize-article', { 
            article, 
            user_preferences 
        });

        res.json(response.data); 
    } catch (error) {
        console.error("Error processing summarize article request", error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// @route POST summarize/articles
// @description Summarizes multiple articles and provides an overview based on user preferences using OpenAI
router.post('/summarize/articles', async (req: Request, res: Response) => {
    try {
        const { articles, user_preferences } = req.body; 
        if (!articles) {
            return res.status(400).json({ message: 'Articles are required' });
        }
        if (!user_preferences) {
            return res.status(400).json({ message: 'User preferences are required' });
        }

        // send articles and user prefs to the Python backend
        const response = await axios.post('http://localhost:5000/summarize-articles', { 
            articles, 
            user_preferences 
        });

        res.json(response.data); 
    } catch (error) {
        console.error("Error processing summarize articles request", error);
        res.status(500).json({ error: 'Internal server error' });
    }
});



export default router;