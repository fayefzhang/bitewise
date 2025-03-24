import express, { Router, Request, Response, RequestHandler } from "express";
import axios from 'axios';
import deleteOldDocuments from "./Helpers/DeleteFiles";
import generateTopics from "./Helpers/GenerateTopics"
import ArticleModel from "../models/Article";
import DashboardModel from '../models/Dashboard';
import QueryModel from '../models/Queries';
import UserModel from '../models/User';
import TopicsArticlesModel from '../models/TopicsArticles'

const PrefDictionary = {
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
    },
    FilterBias: {
        0: 'Left',
        1: 'Left-Center',
        2: 'Center',
        3: 'Right-Center',
        4: 'Right',
    },
    FilterReadTime: {
        0: 'Short',
        1: 'Medium',
        2: 'Long',
    }
};

// bi-directional dictionary
interface PrefDictionaryType {
    [key: string]: { [key: number]: string };
}

interface ReversePrefDictionaryType {
    [key: string]: { [key: string]: number };
}

function createReverseMapping(dictionary: PrefDictionaryType): ReversePrefDictionaryType {
    const reversed: ReversePrefDictionaryType = {};
    for (const key in dictionary) {
        reversed[key] = Object.fromEntries(
            Object.entries(dictionary[key]).map(([k, v]) => [v, Number(k)])
        );
    }
    return reversed;
}

const ReversePrefDictionary = createReverseMapping(PrefDictionary);

const router: Router = express.Router();
const BASE_URL = "http://127.0.0.1:5000";
import { readCache, writeCache } from "../utils/cache";

const fs = require('fs');
const path = require('path');


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
                            { title: article.title, content: article.content }
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

        // filter out irrelevant articles
        const fetchedArticles = articlesResponse.data.results.filter((entry: any) => entry.title !== "[Removed]");

        // 🔹 Call AI filtering before proceeding
        const filteredArticles = await fetchRelevantArticles(fetchedArticles, query);

        // format and write articles to database
        const filteredResults = filteredArticles
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

        // Step 4: Combine articles and summaries into a single response
        const result: { articles: any; clusters?: any } = {
            articles: articlesData,
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
        const newQuery = new QueryModel({
            query,
            date: new Date(),
            articles: articlesData.map((article: { url: string }) => article.url)
        });

        const savedQuery = await newQuery.save();
        // console.log("saved query:", savedQuery);

        res.json(result);
    } catch (error: any) {
        console.error("Error processing search request", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// @route POST /search/query-summary
// @description Given a list of articles relating to the same query, generates a summary regarding the contents in the articles
// @returns title of summary and the summary itself
router.post("/search/query-summary", async (req: Request, res: Response): Promise<void> => {

    const { articles, ai_preferences } = req.body;
    
    const summaryRequestBody = {
        articles: articles.reduce((acc: any, article: any) => {
        acc[article.url] = {
            title: article.title,
            content: article.content,
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

    const result: { summary: string } = {
        summary: summary,
    };

    res.json(result);
})

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

        const { bias = [], maxReadTime = [], dateRange = null } = filter_preferences;

        console.log("Received filter preferences:", filter_preferences);

        const biasIntArray = bias.map((b: string) => ReversePrefDictionary["FilterBias"][b]).filter((b: string) => b !== undefined);
        const readTimeIntArray = maxReadTime.map((rt: string) => ReversePrefDictionary["FilterReadTime"][rt]).filter((rt: string) => rt !== undefined);

        const dateFilter = dateRange ? new Date(dateRange) : null;



        // console.log("Filtering with preferences:", filter_preferences);

        const filteredArticles = articles.filter((article: any) => {
            const biasMatches = biasIntArray.length === 0 || biasIntArray.includes(article.biasRating);
            const readTimeMatches = readTimeIntArray.length === 0 || readTimeIntArray.includes(article.readTime);
            const dateMatches = !dateFilter || (article.datePublished && new Date(article.datePublished) >= dateFilter);

            return biasMatches && readTimeMatches && dateMatches;
        });

        // console.log("Filtered articles count:", filteredArticles.length);

        res.json({"articles": filteredArticles});
    } catch (error) {
        console.error("Error filtering search results", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// @route POST /relevant-articles
// @description Filters relevant articles based on a given search query
// @returns list of relevant articles
async function fetchRelevantArticles(articles: any[], query: string) {
    try {

        // Convert articles into the expected format for the Python API
        const formattedArticles = articles.map((article, index) => ({
            index,
            text: article.title
        }));

        // Call the Python `/filter-articles` API
        const response = await axios.post(`${BASE_URL}/irrelevant-articles`, {
            articles: formattedArticles,
            query: query
        });

        const { relevant_indices } = response.data;

        if (!relevant_indices || !Array.isArray(relevant_indices)) {
            console.error("Invalid response from Python API");
            return articles; // Return original articles if filtering fails
        }

        // Identify removed articles
        const irrelevantArticles = articles.filter((_article, index) => !relevant_indices.includes(index));

        // Filter out only the relevant articles
        const relevantArticles = articles.filter((_article, index) => relevant_indices.includes(index));


        // Log relevant article titles
        if (relevantArticles.length > 0) {
            console.log("🔻 Relevant Articles:");
            relevantArticles.forEach((article) => console.log(`- ${article.title}`));
        } else {
            console.log("✅ No articles were deemed irrelevant.");
        }


        const sortedArticles = [...relevantArticles, ...irrelevantArticles];

        return sortedArticles;
    } catch (error) {
        console.error("Error calling filter-articles API", error);
        return articles; // If error occurs, return the original articles
    }
};

// @route POST /daily-news
// @description Fetches top clusters of daily news articles
// @returns grouped articles by cluster

router.post('/daily-news', async (req: Request, res: Response): Promise<void> => {
    const { date } = req.body; // get date
    const today = new Date().toISOString().slice(0, 10); // current date
    if (date != today) {
        try {
            // check if dashboard already exists for this date
            const existingDashboard = await DashboardModel.findOne({ date: date, location: "" });

            if (existingDashboard) {
                console.log(`News dashboard found for ${date}`);
                res.json(existingDashboard);
            } else {  // return null if no news found for specified date
                console.log(`No news dashboard found for ${date}, returning empty.`);
                res.json({
                    summary: null,
                    clusters: []
                });
            }
        } catch (error: any) {
            console.error("Error fetching daily news:", error);
        }    
    } else {
        generateNewsDashboard('daily-news', '', path.join(__dirname, '../../../python-api/data/articles_data.json'), res);
    }
});

// @route POST /local-news
// @description Fetches top clusters of daily news articles in a given location
// @returns grouped articles by cluster
router.post('/local-news', (req: Request, res: Response) => {
    const { location } = req.body;
    // log location
    console.log("Location: " + location);
    generateNewsDashboard('local-news', location, path.join(__dirname, '../../../python-api/data/local_articles_data.json'), res);
});

// helper
async function generateNewsDashboard(newsType: string, location: string, filePath: string, res: Response) {
    try {
        // if the dashboard has already been created, read and return it from the database      
        const today = new Date().toISOString().slice(0, 10); // yyyy-mm-dd part
        // const targetDate = '2025-03-23'; // used to load prev dashboard

        const existingDashboard = await DashboardModel.findOne({ date: today, location: location });
        if (existingDashboard) {
            console.log(location, " daily news dashboard already exists for this date");
            res.json(existingDashboard);
            return;
        }
        
        const ai_preferences = {
            length: "short", // options: {"short", "medium", "long"}
            tone: "formal", // options: {"formal", "conversational", "technical", "analytical"}
            format: "highlights", // options: {"highlights", "bullets", "analysis", "quotes"}
            jargon_allowed: true, // options: {True, False}
        };

        const response = await axios.post(`${BASE_URL}/${newsType}`, { location });

        if (response.status == 202) {  // currently crawling -- load previous days dashboard
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            let existingDashboard = null;
            let dateToCheck = yesterday;

            while (!existingDashboard) {  // possibility of infinite loop?
                const dateString = dateToCheck.toISOString().slice(0, 10);
                existingDashboard = await DashboardModel.findOne({ date: dateString, location: location });

                if (existingDashboard) {
                    console.log(`News dashboard found for ${dateString}`);
                    res.json(existingDashboard);
                    return;
                }
                
                dateToCheck.setDate(dateToCheck.getDate() - 1);
            }
        }

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
                        content: article.content,
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
                        ai_preferences: ai_preferences,
                        is_dashboard: true
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
                    } else {
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
                    }
                })
            })),
            clusterSummaries: clusterSummaries.map(cs => cs.summary),
            clusterLabels: clusterSummaries.map(cs => cs.title),
            location: location,
            podcast: "",  // leave blank to start (before generation)
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
        console.error("error fulfilling dashboard request", error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

router.get("/valid-dates", async (req: Request, res: Response) => {
    try {
      const validDates = await DashboardModel.distinct("date"); // fetch distinct dates from database
      res.json(validDates);
    } catch (error) {
      console.error("Error fetching valid dates:", error);
      res.status(500).json({ error: "Failed to fetch valid dates" });
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

        ai_preferences.format = ai_preferences.format.toLowerCase();

        if (existingArticle) {
            // should be AILength, AITone, AIFormat, AIJargonAllowed
            // const existingSummary = existingArticle.summaries?.find((summary: any) =>
            //     summary.AILength === ReversePrefDictionary['AILength'][ai_preferences.length] &&
            //     summary.AITone === ReversePrefDictionary['AITone'][ai_preferences.tone] &&
            //     summary.AIFormat === ReversePrefDictionary['AIFormat'][ai_preferences.format] &&
            //     summary.AIJargonAllowed === ReversePrefDictionary['AIJargonAllowed'][String(ai_preferences.jargon_allowed)]
            // );
            
            // if (existingSummary) {
            //     console.log("existing summary from database");
            //     res.json({
            //         summary: existingSummary.summary,
            //         s3Url: existingSummary.s3Url || null,  // return s3Url
            //     });
            // } else {
                // send article and user prefs to the Python backend
                const response = await axios.post(`${BASE_URL}/summarize-article`, {
                    article,
                    ai_preferences
                });

                // save summary to database by update article
                // should switch to this format once frontend fixed
                // const newSummary = {
                //     summary: response.data.summary, // The generated summary
                //     AILength: ReversePrefDictionary['AILength'][ai_preferences.AILength],
                //     AITone: ReversePrefDictionary['AITone'][ai_preferences.AITone],
                //     AIFormat: ReversePrefDictionary['AIFormat'][ai_preferences.AIFormat],
                //     AIJargonAllowed: ReversePrefDictionary['AIJargonAllowed'][String(ai_preferences.AIJargonAllowed)]
                // };
                const newSummary = {
                    summary: response.data.summary, // The generated summary
                    AILength: ReversePrefDictionary['AILength'][ai_preferences.length],
                    AITone: ReversePrefDictionary['AITone'][ai_preferences.tone],
                    AIFormat: ReversePrefDictionary['AIFormat'][ai_preferences.format],
                    AIJargonAllowed: ReversePrefDictionary['AIJargonAllowed'][String(ai_preferences.jargon_allowed)],
                    difficulty: response.data.difficulty,
                    s3Url: response.data.s3_url
                };
                if (!existingArticle.summaries) {
                    existingArticle.summaries = []
                }
                existingArticle.difficulty = response.data.difficulty;
                existingArticle.summaries.push(newSummary);
                // console.log("pushed new summary to existing article:", existingArticle);
                // @Sanya add in later when we merge branches
                // existingArticle.difficulty = readingDifficulty; 
                await existingArticle.save();

                res.json(newSummary);
            // }
        } else {
            // generate summary
            const response = await axios.post(`${BASE_URL}/summarize-article`, {
                article,
                ai_preferences
            });

            const summary = {
                summary: response.data.summary, // The generated summary
                AILength: ReversePrefDictionary['AILength'][ai_preferences.length],
                AITone: ReversePrefDictionary['AITone'][ai_preferences.tone],
                AIFormat: ReversePrefDictionary['AIFormat'][ai_preferences.format],
                AIJargonAllowed: ReversePrefDictionary['AIJargonAllowed'][String(ai_preferences.jargon_allowed)],
                difficulty: response.data.difficulty,
                s3Url: response.data.s3_url
            };
            
            // save to mongo
            const newArticle = new ArticleModel({
                url: article.url,
                content: article.content,
                datePublished: article.datePublished,
                authors: article.authors,
                source: article.source,
                title: article.title,
                readTime: article.readTime,
                biasRating: article.biasRating,
                difficulty: response.data.difficulty,
                imageUrl: article.imageUrl,
                summaries: [summary],
            });
    
            const savedArticle = await newArticle.save();
            res.json(summary);
            
            // throw new Error("No existing article in database");
        }

    } catch (error: any) {
        // console.error("Error processing summarize article request", error);
        console.error("Error processing summarize article request", error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

// @route POST summarize/articles
// @description Summarizes multiple articles and provides an overview based on user preferences using OpenAI
// this would only be called by frontend for REFRESHING summary such as updating params
router.post('/summarize/articles', async (req: Request, res: Response): Promise<void> => {
    try {
        const { articles, ai_preferences, is_dashboard} = req.body;
        if (!articles) {
            res.status(400).json({ message: 'Articles are required' });
        }
        if (!ai_preferences) {
            res.status(400).json({ message: 'AI preferences are required' });
        }
        // if (!is_dashboard) {
        //     res.status(400).json({ message: 'is_dashboard is required' });
        // }

        // send articles and user prefs to the Python backend
        const response = await axios.post(`${BASE_URL}/summarize-articles`, {
            articles,
            ai_preferences,
            // is_dashboard
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

        // update dashboard

        const today = new Date().toISOString().slice(0, 10); // yyyy-mm-dd part
        const existingDashboard = await DashboardModel.findOne({ date: today, location: "" });
        if (existingDashboard) {
            await DashboardModel.updateOne(
                { _id: existingDashboard._id }, 
                { $set: { podcast: response.data.s3_url } }, // Update only the podcast field
                { new: true }
            );        
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

        // TODO: do hashing on password
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

// @route POST /generate/topics
// @description Generates new daily topics articles for each topic.
router.post('/generate/topics', async (req: Request, res: Response): Promise<void> => {
    try {
        const { topics, search_preferences } = req.body; // topics: [string], search_preferences: (default preferences)
  
        const today = new Date() // yyyy-mm-dd part
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));

        const existingTopics = await Promise.all(
            topics.map(async (topic: string) => {
                const existingTopicsArticles = await TopicsArticlesModel.findOne({
                    date: { $gte: startOfDay, $lte: endOfDay }, topic
                });
                // console.log(`Checking topic: ${topic}, Found:`, existingTopicsArticles);
                return existingTopicsArticles ? null : topic; // Return topic only if it doesn't exist
            })
        );

        // console.log("existingTopics: " + existingTopics)
        
        // Filter out null values
        const filteredRemainingTopics = existingTopics.filter(topic => topic !== null);

        if (filteredRemainingTopics.length === 0) {
            // console.log("topics for " + today + "already loaded")
            res.status(200).json({ error: "topics for " + today + "already loaded" })
            return;
        }

        const topics_articles_response = await axios.post('http://127.0.0.1:5000/search/topics', {
            topics: filteredRemainingTopics,
            search_preferences
        });

        // convert to TopicsArticles schema
        const formattedTopicsArticles = topics_articles_response.data.map((topicArticle: { topic: any; results: any[]; }) => ({
            date: new Date().getDate() - 10, // Current date
            topic: topicArticle.topic,
            results: topicArticle.results.map(article => ({
                article: {
                    author: article.author,
                    biasRating: article.biasRating,
                    description: article.description,
                    datePublished: new Date(article.publishedAt),
                    source: article.source.name,
                    title: article.title,
                    url: article.url,
                    readTime: article.readTime,
                }
            }))
        }));
        
        // Save to MongoDB
        TopicsArticlesModel.insertMany(formattedTopicsArticles)
            .then(() => console.log("Data successfully inserted"))
            .catch(error => console.error("Error inserting data:", error));

        res.json(topics_articles_response.data);

    } catch (error: any) {
        console.error("Error retrieving user topics", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// @route POST /user/signin
// @description Validates the user's email and password
router.post('/user/signin', async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;
  
    try {
      // Find the user by email
      const user = await UserModel.findOne({ email: email });
  
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }
  
      // TODO: do hashing on password
      const passwordMatch = (password == user.password);
      if (!passwordMatch) {
        res.status(401).json({ message: "Incorrect password" });
        return;
      }

      res.json({ message: "Sign-in successful", preferences: user.preferences });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  });

// @route POST /search/topics
// @description Gets articles related to the user's topics.
router.post('/search/topics', async (req: Request, res: Response): Promise<void> => {
    try {
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));
        const { topics, search_preferences } = req.body; // topics: [string], search_preferences: 

        // const topics_articles = await axios.post('http://127.0.0.1:5000/search/topics', {
        //     topics,
        //     search_preferences
        // });

        // had to modify because topics was null
        // const { search_preferences } = req.body; // topics: [string], search_preferences: 
        // const topics = "technology";

        // generates the topics articles and uploads to mongo
        const generated = await generateTopics(topics, search_preferences) // generated: Bool (whether the given topics where generated)

        const existingTopicsArticles = await TopicsArticlesModel.find({
            date: { $gte: startOfDay, $lte: endOfDay },
            topic: { $in: topics }
        }).lean();

        const formattedTopicsArticles = existingTopicsArticles.reduce((acc: any, topicArticle: any) => {
            acc[topicArticle.topic] = topicArticle.results;
            return acc;
        }, {});

        res.json(formattedTopicsArticles);
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

router.post('/delete/week', async (req: Request, res: Response): Promise<void> => {
    try {
        deleteOldDocuments(TopicsArticlesModel)
    } catch (error) {
        res.status(500)
        return;
    }

    res.status(200);
    return;
});

export default router;