import express, { Router, Request, Response, RequestHandler } from "express";
import axios from 'axios';
import ArticleModel from "../models/Article";
import DashboardModel from '../models/Dashboard';
import QueryModel from '../models/Queries';
import UserModel from '../models/User';

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

const router: Router = express.Router();
const EXAMPLE_SEARCH_QUERY = "donald trump 2024 presidential election";
// const BASE_URL = "http://localhost:5000";
const BASE_URL = "http://127.0.0.1:5000";
import { readCache, writeCache } from "../utils/cache";

const fs = require('fs');
const path = require('path');

const FILTER_DICT = {
    bias: {
        "left": 0,
        "center": 1,
        "right": 2
    },
    readTime: {
        "<2 min": 0,
        "2-7 min": 1,
        ">7 min": 2
    }
};

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

                // get existing articles from database and resummarize
                const articles = await ArticleModel.find({ url: { $in: existingQuery.articles } }); 
                const summaryRequestBody = {
                    articles: Object.fromEntries(
                        articles.slice(0, 5).map((article: any) => [
                            article.url,
                            { title: article.title, fullContent: article.content }
                        ])
                    ),
                    ai_preferences,
                };

                const summaryResponse = await axios.post(`${BASE_URL}/summarize-articles`, summaryRequestBody);
                const { title, summary, enriched_articles } = summaryResponse.data;
                // create and return response
                const result: { articles: any; summary: { title: any; summary: any; }; clusters?: any } = {
                    articles: articles,
                    summary: {
                        title: query,
                        summary: summary,
                    },
                };
                res.json(result);
                return;

            } else {
                // delete existing query
                await QueryModel.deleteOne({ query: query });
            }
        }

        // Step 1: fetch articles
        const articlesResponse = await axios.post(`${BASE_URL}/search`, { query, search_preferences, cluster });

        // format and write articles to database
        const filteredResults = articlesResponse.data.results
            .filter((entry: any) => entry.title !== "[Removed]")
            .map((entry: any) => ({
                url: entry.url,  // Primary key
                content: "", // will be filled in later
                datePublished: entry.publishedAt,
                authors: entry.authors ? entry.authors[0] : "",
                source: entry.source.name,
                title: entry.title,
                readTime: entry.readTime,
                biasRating: entry.biasRating,
                imageUrl: entry.urlToImage,
            }));

        try {
            const insertManyResponse = await ArticleModel.insertMany(filteredResults, { ordered: false });
        } catch (error) {
            console.error("Error inserting articles:", error);
        }

        const { clusters } = articlesResponse.data;
        const articlesData = filteredResults;
        // console.log("search step 1, found articles:", articlesData);

        // Step 2: Generate summaries for the top 5 relevant articles (in future will use clustering results)
        const summaryRequestBody = {
            articles: articlesData.slice(0, 5).reduce((acc: any, article: any) => {
            acc[article.url] = {
                title: article.title,
                fullContent: article.fullContent,
                imageUrl: article.imageUrl,
                readTime: article.readTime,
                biasRating: article.bias,
                source: article.source,
                time: article.date,
                authors: article.authors,
            };
            return acc;
            }, {}),
            ai_preferences,
        };

        const summaryResponse = await axios.post(`${BASE_URL}/summarize-articles`, summaryRequestBody);
        const { title, summary, enriched_articles } = summaryResponse.data;

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
            .catch((error: any) => {
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

        // store query in database
        // const duplicateQuery = await QueryModel.findOne({ query });  // check duplicate

        // if (!duplicateQuery) {
        //     const newQuery = new QueryModel({
        //         query,
        //         date: new Date(),
        //         articles: articlesData.map((article: { url: string }) => article.url)
        //     });

        //     const savedQuery = await newQuery.save();
        //     console.log("saved query:", savedQuery);
        // }

        res.json(result);
    } catch (error: any) {
        console.error("Error processing search request", error);
        res.status(500).json({ error: "Internal server error" });
    }
});


// @route POST /search/filter
// @description Processes a news search query and filters based on user preferences for bias, read time, and date range
// @returns list of filtered articles
router.post("/search/filter", async (req: Request, res: Response): Promise<void> => {
    try {
        const { articles, filter_preferences } = req.body;

        if (!articles || !Array.isArray(articles)) {
            res.status(400).json({ message: "Articles array is required" });
            return;
        }

        if (!filter_preferences) {
            res.status(400).json({ message: "Filter preferences are required" });
            return;
        }

        const { bias, readTime, dateRange } = filter_preferences;

        const biasIntArray = bias.map((b: keyof typeof FILTER_DICT.bias) => FILTER_DICT.bias[b]);
        const readTimeIntArray = readTime.map((rt: keyof typeof FILTER_DICT.readTime) => FILTER_DICT.readTime[rt]);


        console.log("Filtering with preferences:", filter_preferences);

        const filteredArticles = articles.filter((article: any) => {
            const biasMatches = !bias || biasIntArray.includes(article.bias);
            const readTimeMatches = !readTime || readTimeIntArray.includes(article.readTime);
            const dateMatches = !dateRange || (article.date && new Date(article.date) >= new Date(dateRange));

            return biasMatches && readTimeMatches && dateMatches;
        });

        console.log("Filtered articles count:", filteredArticles.length);

        res.json({ filtered_articles: filteredArticles });
    } catch (error) {
        console.error("Error filtering search results", error);
        res.status(500).json({ error: "Internal server error" });
    }
});


// @route POST /daily-news
// @description Fetches top clusters of daily news articles
// @returns grouped articles by cluster

router.post('/daily-news', (req: Request, res: Response) => {
    generateNewsDashboard('daily-news', '', path.join(__dirname, '../../../python-api/data/articles_data.json'), res);
});

router.post('/local-news', (req: Request, res: Response) => {
    generateNewsDashboard('local-news', 'Philadelphia', path.join(__dirname, '../../../python-api/data/local_articles_data.json'), res);
});

// helper
async function generateNewsDashboard(newsType: string, location: string, filePath: string, res: Response) {
    try {
        // if the dashboard has already been created, read and return it from the database      
        const today = new Date().toISOString().slice(0, 10); // yyyy-mm-dd part
        const existingDashboard = await DashboardModel.findOne({ date: today, location: location });
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

        const response = await axios.post(`${BASE_URL}/${newsType}`);

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
                        fullContent: article.content,
                        imageUrl: article.imageUrl,
                        readTime: article.readTime,
                        biasRating: article.biasRating,
                        source: article.source,
                        time: article.time,
                        authors: article.authors,
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
                } catch (error: any) {
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

        // check if crawl done today to create and save new dashboard
        const stats = fs.statSync(filePath);
        const lastModifiedDate = new Date(stats.mtime);
        const currentTime = new Date();
        const timeDifference = currentTime.getTime() - lastModifiedDate.getTime();

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
                        authors: article.authors,
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
            clusterLabels: clusterSummaries.map(cs => cs.title),
            location: location,
        });

        if (timeDifference < 12 * 3600 * 1000) {  // save new dashboard only if crawl done
            const savedDashboard = await newDashboard.save();
            res.json(savedDashboard);
            return;
        } 
        res.json(newDashboard);

        // OLD JSON FOR REFERENCE
        // res.json({overall_summary, clusterSummaries});
    } catch (error: any) {
        console.error("error processing search request", error);
        res.status(500).json({ error: 'Internal server error' });
    }
}


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
            console.log(ai_preferences);
            console.log("ai pref length:", ai_preferences.AILength);
            console.log("length:", ReverseAIDictionary['AILength'][ai_preferences.AILength]);
            console.log("tone:", ReverseAIDictionary['AITone'][ai_preferences.AITone]);
            console.log("format:", ReverseAIDictionary['AIFormat'][ai_preferences.AIFormat]);
            console.log("jargon:", ReverseAIDictionary['AIJargonAllowed'][String(ai_preferences.AIJargonAllowed)]);

            // should be AILength, AITone, AIFormat, AIJargonAllowed
            // const existingSummary = existingArticle.summaries?.find((summary) =>
            //     summary.AILength === ReverseAIDictionary['AILength'][ai_preferences.AILength] &&
            //     summary.AITone === ReverseAIDictionary['AITone'][ai_preferences.AITone] &&
            //     summary.AIFormat === ReverseAIDictionary['AIFormat'][ai_preferences.AIFormat] &&
            //     summary.AIJargonAllowed === ReverseAIDictionary['AIJargonAllowed'][String(ai_preferences.AIJargonAllowed)]
            // );
            const existingSummary = existingArticle.summaries?.find((summary) =>
                summary.AILength === ReverseAIDictionary['AILength'][ai_preferences.length] &&
                summary.AITone === ReverseAIDictionary['AITone'][ai_preferences.tone] &&
                summary.AIFormat === ReverseAIDictionary['AIFormat'][ai_preferences.format] &&
                summary.AIJargonAllowed === ReverseAIDictionary['AIJargonAllowed'][String(ai_preferences.jargon_allowed)]
            );

            if (existingSummary) {
                console.log("using existing summary from database");
                res.json(existingSummary.summary);
            } else {
                // send article and user prefs to the Python backend
                const response = await axios.post(`${BASE_URL}/summarize-article`, {
                    article,
                    ai_preferences
                });

                // save summary to database by update article
                // should switch to this format once frontend fixed
                // const newSummary = {
                //     summary: response.data.summary, // The generated summary
                //     AILength: ReverseAIDictionary['AILength'][ai_preferences.AILength],
                //     AITone: ReverseAIDictionary['AITone'][ai_preferences.AITone],
                //     AIFormat: ReverseAIDictionary['AIFormat'][ai_preferences.AIFormat],
                //     AIJargonAllowed: ReverseAIDictionary['AIJargonAllowed'][String(ai_preferences.AIJargonAllowed)]
                // };
                const newSummary = {
                    summary: response.data.summary, // The generated summary
                    AILength: ReverseAIDictionary['AILength'][ai_preferences.length],
                    AITone: ReverseAIDictionary['AITone'][ai_preferences.tone],
                    AIFormat: ReverseAIDictionary['AIFormat'][ai_preferences.format],
                    AIJargonAllowed: ReverseAIDictionary['AIJargonAllowed'][String(ai_preferences.jargon_allowed)]
                };
                if (!existingArticle.summaries) {
                    existingArticle.summaries = []
                }
                existingArticle.summaries.push(newSummary);
                console.log("pushed new summary to existing article:", existingArticle);
                // @Sanya add in later when we merge branches
                // existingArticle.difficulty = readingDifficulty; 
                await existingArticle.save();

                res.json(newSummary);
            }
        } else {
            throw new Error("No existing article in database");
        }

    } catch (error: any) {
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
                .catch((error: any) => {
                    console.error("Error updating articles with full content:", error);
                });
        } else {
            console.log("No articles required content update.");
        }

        res.json(response.data);
    } catch (error: any) {
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
    } catch (error: any) {
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

        if (!response.data.s3_url) {
            res.status(500).json({ error: 'Podcast failed to upload to S3' });
        }

        res.json(response.data);
    } catch (error: any) {
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
    } catch (error: any) {
        console.error("Error fetching audio", error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// @route POST user/update
// @description Creates or updates a user's info
router.post('/user/update', async (req: Request, res: Response): Promise<void> => {
    try {
        const { user } = req.body; // see IUser interface
        if (!user || !user.email) {
            res.status(400).json({ message: 'No User object passed' });
            return
        }

        const updatedUser = await UserModel.findOneAndUpdate(
            { email: user.email },
            { 
                $set: { 
                    preferences: user.preferences,
                    password: user.password
                }
            },
            { 
                new: true,
                upsert: true,
                runValidators: true
            }
        );

        res.status(200).json({ message: 'User updated successfully', user: updatedUser });
    } catch (error: any) {
        console.error("Error updating user preferences:", error);
        res.status(500).json({ error: "Internal server error" });
    }
})

// @route GET user/preferences
// @description Gets the user's preferences by email.
router.get('/user/preferences', async (req: Request, res: Response): Promise<void> => {
    try {
        const userEmail = req.query.email as string; // Get the email from query parameters
        if (!userEmail) {
            res.status(400).json({ message: 'No user email provided' });
            return;
        }

        // Find the user by email in the database
        const user = await UserModel.findOne({ email: userEmail });
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        // Return the user's preferences
        res.json(user.preferences);
    } catch (error: any) {
        console.error("Error retrieving user preferences:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// @route POST /search/topics
// @description Gets articles related to the user's topics.
router.post('/search/topics', async (req: Request, res: Response): Promise<void> => {
    try {
        const { topics, search_preferences } = req.body; // topics: [string], search_preferences: 

        const topics_articles = await axios.post('http://127.0.0.1:5000/search/topics', {
            topics,
            search_preferences
        });

        res.json(topics_articles.data);
    } catch (error: any) {
        console.error("Error retrieving user topics", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.post('/crawl/all', async (req: Request, res: Response): Promise<void> => {
    try {
        const response = await axios.post('http://127.0.0.1:5000/crawl/all');

        res.status(response.status).json(response.data);
    } catch (error: any) {
        console.error("Error occurred during crawling:", error);

        if (axios.isAxiosError(error) && error.response) {
            res.status(error.response.status).json(error.response.data);
        } else {
            res.status(500).json({ error: "Internal server error" });
        }
    }
});

router.post('/crawl/local', async (req: Request, res: Response): Promise<void> => {
    try {
        
        const response = await axios.post('http://127.0.0.1:5000/crawl/local');

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

router.post('/crawl/local', async (req: Request, res: Response): Promise<void> => {
    try {
        
        const response = await axios.post('http://127.0.0.1:5000/crawl/local');

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