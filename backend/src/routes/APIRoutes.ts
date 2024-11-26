import express, { Router, Request, Response, RequestHandler } from "express";
import axios from 'axios';

const router: Router = express.Router();


// router.get("/", (req: Request, res: Response): void => {
//     res.send("API is working");
// }
// );


// @route POST /search
// @description Processes a news search query
// @returns list of articles
router.post("/search", async (req: Request, res: Response): Promise<void> => {
    try {
        const { query, user_preferences } = req.body;

        if (!query) {
            res.status(400).json({ message: "Query is required" });
            return;
        }
        if (!user_preferences) {
            res.status(400).json({ message: "User preferences are required" });
            return;
        }

        const response = await axios.post("http://localhost:5000/search", { query, user_preferences });
        res.json(response.data);
    } catch (error) {
        console.error("Error processing search request", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// @route POST /dailynews
// @description refreshes daily news
// @returns list of articles
router.post('/dailynews', async (req: Request, res: Response): Promise<void> => {
    try {
        const { user_preferences } = req.body;

        if (!user_preferences) {
            res.status(400).json({ message: 'User preferences are required' });
        }

        const response = await axios.post('http://localhost:5000/daily-news', { user_preferences });
        res.json(response.data);
    } catch (error) {
        console.error("error processing search request", error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// @route POST summarize/article
// @description Summarizes a single article based on user preferences using OpenAI

router.post('/summarize/article', async (req: Request, res: Response): Promise<void> => {
    try {
        const { article, user_preferences } = req.body; 
        if (!article) {
            res.status(400).json({ message: 'Article is required' });
        }
        if (!user_preferences) {
            res.status(400).json({ message: 'User preferences are required' });
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
router.post('/summarize/articles', async (req: Request, res: Response): Promise<void> => {
    try {
        const { articles, user_preferences } = req.body; 
        if (!articles) {
            res.status(400).json({ message: 'Articles are required' });
        }
        if (!user_preferences) {
            res.status(400).json({ message: 'User preferences are required' });
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