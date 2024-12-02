import express, { Router, Request, Response, RequestHandler } from "express";
import axios from 'axios';

const router: Router = express.Router();
const EXAMPLE_SEARCH_QUERY = "donald trump 2024 presidential election";
import { readCache, writeCache } from "../utils/cache";

// @route POST /search
// @description Processes a news search query
// @returns list of articles
router.post("/search", async (req: Request, res: Response): Promise<void> => {
    try {
        const { query, search_preferences, ai_preferences, cluster } = req.body;

        if (!query) {
            res.status(400).json({ message: "Query is required" });
            return;
        }
        if (!search_preferences) {
            res.status(400).json({ message: "Search preferences are required" });
            return;
        }

        if (!ai_preferences) {
            res.status(400).json({ message: "AI preferences are required" });
            return;
        }


        // read cache
        const cache = readCache();
        if (query === EXAMPLE_SEARCH_QUERY) {
            if (cache[query]) {
                console.log("search: using cached response for example query");
                res.json(cache[query]);
                return;
            }
        }

        // Step 1: fetch articles
        const articlesResponse = await axios.post("http://localhost:5000/search", { query, search_preferences, cluster });

        
        const filteredResults = articlesResponse.data.results
        .filter((entry: any) => entry.title !== "[Removed]")
        .map((entry: any) => ({
            id: entry.id,
            url: entry.url,
            imageUrl: entry.urlToImage,
            title: entry.title,
            source: entry.source.name,
            content: entry.content,
            time: new Date(entry.publishedAt).toLocaleTimeString(),
            bias: entry.biasRating,
            readTime: entry.readTime,
            relatedSources: [], // TODO
            details: [], // TODO: summary 
            // ^^ @karen unsure what this means? -jared
            fullContent: null
        }));

        const { clusters } = articlesResponse.data;
        const articlesData = filteredResults;

        console.log("search step 1, found articles:", articlesData);

        // Step 2: Generate summaries for the top 5 relevant articles (in future will use clustering results)
        const summaryRequestBody = {
            articles: Object.fromEntries(
                articlesData.slice(0, 5).map((article: any) => [
                    article.url,
                    { title: article.title, fullContent: article.fullContent }
                ])
            ),
            ai_preferences,
        };

        const summaryResponse = await axios.post("http://localhost:5000/summarize-articles", summaryRequestBody);
        const { summary, enriched_articles } = summaryResponse.data;

        console.log("Summary:", summary);
        console.log("Enriched Articles:", enriched_articles);

        // step 4: update articles with content (for caching)
        const enrichedArticlesData = articlesData.map((article: any) => {
            const enrichedArticle = enriched_articles.find((ea: any) => ea.url === article.url);
            return {
                ...article,
                fullContent: enrichedArticle?.content || null,
            };
        });

        // Step 4: Combine articles and summaries into a single response
        const result: { articles: any; summary: { title: any; summary: any; }; clusters?: any } = {
            articles: enrichedArticlesData,
            summary: {
                title: query,
                summary: summary,
            },
        };

        // Add clusters to the response if clustering was requested
        if (cluster && clusters) {
            result.clusters = clusters.map((cluster: any) => ({
                cluster_id: cluster.cluster_id,
                articles: cluster.articles.map((article: any) => ({
                    title: article.title,
                    description: article.description,
                    url: article.url,
                })),
            }));
        }

        // Step 5: cache response if it matches example query (see step 4 format)
        if (query === EXAMPLE_SEARCH_QUERY) {
            console.log("search: caching response for example query");
            cache[query] = result;
            writeCache(cache);
        }

        res.json(result);
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
        const { search_preferences } = req.body;

        if (!search_preferences) {
            res.status(400).json({ message: 'User preferences are required' });
        }

        const response = await axios.post('http://localhost:5000/daily-news', { search_preferences });
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
        const { article, ai_preferences } = req.body; 
        if (!article) {
            res.status(400).json({ message: 'Article is required' });
        }
        if (!ai_preferences) {
            res.status(400).json({ message: 'AI preferences are required' });
        }

        // send article and user prefs to the Python backend
        const response = await axios.post('http://localhost:5000/summarize-article', { 
            article, 
            ai_preferences 
        });

        res.json(response.data); 
    } catch (error) {
        console.error("Error processing summarize article request", error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// @route POST summarize/articles
// @description Summarizes multiple articles and provides an overview based on user preferences using OpenAI
// this would only be called by frontend for REFRESHING summary such as updating params
router.post('/summarize/articles', async (req: Request, res: Response): Promise<void> => {
    try {
        const { articles, ai_preferences } = req.body; 
        if (!articles) {
            res.status(400).json({ message: 'Articles are required' });
        }
        if (!ai_preferences) {
            res.status(400).json({ message: 'AI preferences are required' });
        }

        // send articles and user prefs to the Python backend
        const response = await axios.post('http://localhost:5000/summarize-articles', { 
            articles, 
            ai_preferences 
        });

        res.json(response.data); 
    } catch (error) {
        console.error("Error processing summarize articles request", error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


export default router;