import express, { Router, Request, Response, RequestHandler } from "express";
import axios from 'axios';
import ArticleModel from "../models/Article";
import DashboardModel from '../models/Dashboard';
import QueryModel from '../models/Queries';

const AIDictionary = {
    AILength: {
        0: 'short',
        1: 'medium',
        2: 'long',
    },
    AITone: {
        0: 'formal',
        1: 'conversational',
        2: 'technical',
        3: 'analytical',
    },
    AIFormat: {
        0: 'highlights',
        1: 'bullets',
        2: 'analysis',
        3: 'quotes',
    },
    AIJargonAllowed: {
        0: 'true',
        1: 'false',
    }
};

// bi-directional dictionary
interface AIDictionaryType {
    [key: string]: { [key: number]: string };
}

interface ReverseAIDictionaryType {
    [key: string]: { [key: string]: number };
}

function createReverseMapping(dictionary: AIDictionaryType): ReverseAIDictionaryType {
    const reversed: ReverseAIDictionaryType = {};
    for (const key in dictionary) {
        reversed[key] = Object.fromEntries(
            Object.entries(dictionary[key]).map(([k, v]) => [v, Number(k)])
        );
    }
    return reversed;
}

const ReverseAIDictionary = createReverseMapping(AIDictionary);

// import ISummary from "../interfaces/ISummary";

const router: Router = express.Router();
const EXAMPLE_SEARCH_QUERY = "donald trump 2024 presidential election";
// const BASE_URL = "http://localhost:5000";
const BASE_URL = "http://127.0.0.1:5000";
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

        // if the query has been made in the last 24 hours, return the cached response
        const existingQuery = await QueryModel.findOne({ query: query });
        if (existingQuery) {
            const timeDifference = new Date().getTime() - existingQuery.date.getTime();
            if (timeDifference < 24 * 60 * 60 * 1000) {
                console.log("search: using cached response for existing query");
                res.json(existingQuery);
            }
        }

        // Step 1: fetch articles
        const articlesResponse = await axios.post(`${BASE_URL}/search`, { query, search_preferences, cluster });

        // OLD SCHEMA FOR FRONTEND REFERENCE
        // const filteredResults = articlesResponse.data.results
        // .filter((entry: any) => entry.title !== "[Removed]")
        // .map((entry: any) => ({
        //     id: entry.id,
        //     url: entry.url,
        //     imageUrl: entry.urlToImage,
        //     title: entry.title,
        //     source: entry.source.name,
        //     content: entry.content,
        //     date: entry.publishedAt,
        //     bias: entry.biasRating,
        //     readTime: entry.readTime,
        //     relatedSources: [], // TODO
        //     details: [], // TODO: summary 
        //     // ^^ @karen unsure what this means? -jared
        //     cluster: entry.cluster,
        //     fullContent: null
        // }));

        // format and write articles to database
        const filteredResults = articlesResponse.data.results
            .filter((entry: any) => entry.title !== "[Removed]")
            .map((entry: any) => ({
                url: entry.url,  // Primary key
                content: "", //will be filled in later
                datePublished: entry.publishedAt,
                author: entry.author,
                source: entry.source.name,
                title: entry.title,
                readTime: entry.readTime,
                biasRating: entry.biasRating,
                imageUrl: entry.urlToImage,
            }));

        
        console.log("filtered results:", filteredResults.slice(0, 5));
        console.log("collection name results:", ArticleModel.collection.name);

        try {
            const insertManyResponse = await ArticleModel.insertMany(filteredResults, { ordered: false });
            console.log("Articles successfully inserted into the database");
            console.log("InsertMany response:", JSON.stringify(insertManyResponse, null, 2));
        } catch (error) {
            console.error("Error inserting articles:", error);
        }

        const existingArticles = await ArticleModel.find({});
        console.log("existing articles:", existingArticles);

        const { clusters } = articlesResponse.data;
        const articlesData = filteredResults;
        // console.log("search step 1, found articles:", articlesData);

        // Step 2: Generate summaries for the top 5 relevant articles (in future will use clustering results)
        const summaryRequestBody = {
            articles: Object.fromEntries(
                articlesData.slice(0, 5).map((article: any) => [
                    article.url,
                    { title: article.title, fullContent: article.content }
                ])
            ),
            ai_preferences,
        };

        const summaryResponse = await axios.post(`${BASE_URL}/summarize-articles`, summaryRequestBody);
        const { title, summary, enriched_articles } = summaryResponse.data;
        console.log("Summary: ", summary);
        console.log("Enriched Articles: ", enriched_articles);


        // update articles with scraped content in database
        const bulkOperations = enriched_articles.map((article: any) => ({
            updateOne: {
                filter: { url: article.url, content: "" },
                update: { $set: { content: article.content } },
                upsert: false // don't create a new document if it doesn't exist
            }
        }));
        if (bulkOperations.length > 0) {
            await ArticleModel.bulkWrite(bulkOperations)
                .then(() => {
                    console.log("Successfully updated articles with full content");
                })
                .catch((error) => {
                    console.error("Error updating articles with full content:", error);
                });
        } else {
            console.log("No articles required content update.");
        }

        // Step 4: Combine articles and summaries into a single response
        const result: { articles: any; summary: { title: any; summary: any; }; clusters?: any } = {
            articles: articlesData,
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
        // if (query === EXAMPLE_SEARCH_QUERY) {
        //     console.log("search: caching response for example query");
        //     cache[query] = result;
        //     writeCache(cache);
        // }

        res.json(result);
    } catch (error) {
        console.error("Error processing search request", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
// @route POST /daily-news
// @description Fetches top clusters of daily news articles
// @returns grouped articles by cluster
router.post('/daily-news', async (req: Request, res: Response): Promise<void> => {
    try {
        // if the dashboard has already been created, read and return it from the database      
        const today = new Date().toISOString().slice(0, 10); // yyyy-mm-dd part
        const existingDashboard = await DashboardModel.findOne({ date: today });
        if (existingDashboard) {
            console.log("daily news dashboard already exists for this date");
            res.json(existingDashboard);
            return;
        }

        const ai_preferences = {
            length: "short", // options: {"short", "medium", "long"}
            tone: "formal", // options: {"formal", "conversational", "technical", "analytical"}
            format: "highlights", // options: {"highlights", "bullets", "analysis", "quotes"}
            jargon_allowed: true, // options: {True, False}
        };

        const response = await axios.post(`${BASE_URL}/daily-news`);
        const { clusters, overall_summary } = response.data;

        // summarizing each cluster
        const clusterSummaries = await Promise.all(
            clusters.map(async (cluster: { cluster_id: any; articles: any; }) => {
                // data formatted for summary endpoint
                const clusterId = cluster.cluster_id;
                const articles = cluster.articles;

                const formattedArticles = (articles as any[]).reduce((acc, article) => {
                    acc[article.url] = {
                        title: article.title,
                        fullContent: article.content
                    };
                    return acc;
                }, {});
                try {
                    const summaryResponse = await axios.post(`${BASE_URL}/summarize-articles`, {
                        articles: formattedArticles,
                        ai_preferences: ai_preferences
                    });

                    const summaryData = summaryResponse.data;
                    // console.log("Enriched articles structure:", summaryData.enriched_articles);
                    return {
                        cluster: clusterId,
                        articles: summaryData.enriched_articles,
                        title: summaryData.title,
                        summary: summaryData.summary
                    };
                } catch (error) {
                    console.error(`Error summarizing cluster ${clusterId}:`, error);
                    return {
                        cluster: Number(clusterId),
                        articles: formattedArticles,
                        title: "Title generation failed.",
                        summary: "Summary generation failed."
                    };
                }
            })
        );
        // const finalClusters = clusterSummaries.map((cluster: any) => {
        //     // Log the cluster to see its structure
        //     console.log('Cluster:', cluster);
        
        //     const mappedArticles = cluster.articles.map((article: any) => {
        //         // Log each article to inspect its fields
        //         console.log('Article:', article);
        
        //         return {
        //             content: article.content,
        //             datePublished: article.datePublished,
        //             title: article.title,  // Ensure that title exists
        //             url: article.url       // Ensure that url exists
        //         };
        //     });
        
        //     return {
        //         articles: mappedArticles,
        //         summary: cluster.summary,
        //         clusterTitle: cluster.title
        //     };
        // });

        // save to database and return dashboard
        const newDashboard = new DashboardModel({
            date: today,
            summary: overall_summary,
            clusters: clusterSummaries.map((cluster: any) => ({
                articles: cluster.articles.map((article: any) => {
                    // Check for missing title or url and log if any are missing
                    if (!article.title || !article.url) {
                        console.warn('Missing title or URL for article:', article);
                    }
        
                    return {
                        content: article.content,
                        datePublished: article.datePublished,
                        author: article.author,
                        source: article.source,
                        url: article.url,
                        title: article.title,
                        readTime: article.readTime,
                        biasRating: article.biasRating,
                        difficulty: article.difficulty,
                        imageUrl: article.imageUrl,
                        summaries: []
                    };
                })
            })),
            clusterSummaries: clusterSummaries.map(cs => cs.summary),
            clusterLabels: clusterSummaries.map(cs => cs.title)
        });

        const savedDashboard = await newDashboard.save();
        res.json(savedDashboard);

        // OLD JSON FOR REFERENCE
        // res.json({overall_summary, clusterSummaries});
    } catch (error) {
        console.error("error processing search request", error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/retrieve-article', async (req: Request, res: Response): Promise<void> => {
    try {
        const { urls } = req.body; 
        if (!urls) {
            res.status(400).json({ message: 'URLs are required' });
        }
        const articles = await ArticleModel.find({ url: { $in: urls } });
        if (!articles.length) {
            res.status(404).json({ message: "Articles not found" });
        }
        res.json({ articles });
    } catch (error) {
        console.error("Error processing summarize article request", error);
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

        // NEED URL FROM FRONTEND 
        const existingArticle = await ArticleModel.findOne({ url: article.url });

        if (existingArticle) {
            // frontend not passing it in this format
            const existingSummary = existingArticle.summaries?.find((summary) =>
                summary.AILength === ReverseAIDictionary['AILength'][ai_preferences.AILength] &&
                summary.AITone === ReverseAIDictionary['AITone'][ai_preferences.AITone] &&
                summary.AIFormat === ReverseAIDictionary['AIFormat'][ai_preferences.AIFormat] &&
                summary.AIJargonAllowed === ReverseAIDictionary['AIJargonAllowed'][String(ai_preferences.AIJargonAllowed)]
            );

            if (existingSummary) {
                res.json(existingSummary.summary);
            } else {
                // send article and user prefs to the Python backend
                const response = await axios.post(`${BASE_URL}/summarize-article`, {
                    article,
                    ai_preferences
                });

                // save summary to database by update article
                const newSummary = {
                    summary: response.data.summary, // The generated summary
                    AILength: ReverseAIDictionary['AILength'][ai_preferences.AILength],
                    AITone: ReverseAIDictionary['AITone'][ai_preferences.AITone],
                    AIFormat: ReverseAIDictionary['AIFormat'][ai_preferences.AIFormat],
                    AIJargonAllowed: ReverseAIDictionary['AIJargonAllowed'][String(ai_preferences.AIJargonAllowed)]
                };
                if (!existingArticle.summaries) {
                    existingArticle.summaries = []
                }
                existingArticle.summaries.push(newSummary);
                // @Sanya add in later when we merge branches
                // existingArticle.difficulty = readingDifficulty; 
                await existingArticle.save();

                res.json(newSummary);
            }
        } else {
            throw new Error("No existing article in database");
        }

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
        const response = await axios.post(`${BASE_URL}/summarize-articles`, {
            articles,
            ai_preferences
        });

        const { title, summary, enriched_articles } = response.data;

        // update articles with scraped content in database
        const bulkOperations = enriched_articles.map((article: any) => ({
            updateOne: {
                filter: { url: article.url, content: { $exists: false } },
                update: { $set: { content: article.content } },
                upsert: false
            }
        }));
        if (bulkOperations.length > 0) {
            await ArticleModel.bulkWrite(bulkOperations)
                .then(() => {
                    console.log("Successfully updated articles with full content");
                })
                .catch((error) => {
                    console.error("Error updating articles with full content:", error);
                });
        } else {
            console.log("No articles required content update.");
        }

        res.json(response.data);
    } catch (error) {
        console.error("Error processing summarize articles request", error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// @route POST generate/audio
// @description Generates an audio file from an article text using TTS
// should only be used on article SUMMARY to avoid rate limits
router.post('/generate/audio', async (req: Request, res: Response): Promise<void> => {
    try {
        const { article, summary } = req.body; // should be an article title and its content
        if (!article) {
            res.status(400).json({ message: 'Article title is required' });
        }
        if (!summary) {
            res.status(400).json({ message: 'Article summary is required' });
        }

        const response = await axios.post(`${BASE_URL}/generate-audio`, {
            article, summary,
        });

        res.json(response.data);
    } catch (error) {
        console.error("Error processing generate audio request", error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// @route POST generate/podcast
// @description Generates a podcast based on multiple articles
router.post('/generate/podcast', async (req: Request, res: Response): Promise<void> => {
    try {
        const { articles } = req.body; // should be a list of article URLs
        if (!articles) {
            res.status(400).json({ message: 'Articles are required' });
        }

        const response = await axios.post(`${BASE_URL}/generate-podcast`, {
            articles,
        });

        res.json(response.data);
    } catch (error) {
        console.error("Error processing generate podcast request", error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// @route GET audio/filename
// @description Gets audio clip from Python server
router.get('/audio', async (req: Request, res: Response): Promise<void> => {
    try {
        const { filename } = req.query;
        if (!filename) {
            res.status(400).json({ message: 'Audio filename is required' });
        }
        const response = await axios({
            method: 'get',
            url: `${BASE_URL}/audio/${filename}`,
            responseType: 'stream', // <- IMPORTANT: Enables streaming of the file
        });

        res.setHeader('Content-Type', 'audio/mpeg');
        response.data.pipe(res);
    } catch (error) {
        console.error("Error fetching audio", error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// @route GET user/topics
// @description Gets the user's preferences.
router.get('/user/preferences', async (req: Request, res: Response): Promise<void> => {
    console.log("APIRoutes, /user/preferences");
    try {
        const userID = req.query.userID as string; // Explicitly cast to string if using TypeScript
        if (!userID) {
            res.status(400).json({ message: 'No user is logged in' });
        }

        const preferencesResponse = await axios.get("http://127.0.0.1:5000/user/preferences", {
            params: { userID }, // Pass query parameters to Flask
        });

        res.json(preferencesResponse.data);
    } catch (error) {
        console.error("Error retrieving user preferences:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// @route POST /search/topics
// @description Gets articles related to the user's topics.
router.post('/search/topics', async (req: Request, res: Response): Promise<void> => {
    try {
        const { topics, search_preferences } = req.body;

        const topics_articles = await axios.post('http://127.0.0.1:5000/search/topics', {
            topics,
            search_preferences
        });

        res.json(topics_articles.data);
    } catch (error) {
        console.error("Error retrieving user topics", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.post('/crawl/all', async (req: Request, res: Response): Promise<void> => {
    try {
        const response = await axios.post('http://127.0.0.1:5000/crawl/all');

        res.status(response.status).json(response.data);
    } catch (error) {
        console.error("Error occurred during crawling:", error);

        if (axios.isAxiosError(error) && error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            res.status(500).json({ error: "Internal server error" });
        }
    }
});

export default router;