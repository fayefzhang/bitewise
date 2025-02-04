import express, { Router, Request, Response, RequestHandler } from "express";
import axios from "axios";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

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

    // read cache
    // const cache = readCache();
    // if (query === EXAMPLE_SEARCH_QUERY) {
    //     if (cache[query]) {
    //         console.log("search: using cached response for example query");
    //         res.json(cache[query]);
    //         return;
    //     }
    // }

    // Step 1: fetch articles
    const articlesResponse = await axios.post(`${BASE_URL}/search`, {
      query,
      search_preferences,
      cluster,
    });

    const filteredResults = articlesResponse.data.results
      .filter((entry: any) => entry.title !== "[Removed]")
      .map((entry: any) => ({
        id: entry.id,
        url: entry.url,
        imageUrl: entry.urlToImage,
        title: entry.title,
        source: entry.source.name,
        content: entry.content,
        date: entry.publishedAt,
        bias: entry.biasRating,
        readTime: entry.readTime,
        relatedSources: [], // TODO
        details: [], // TODO: summary
        // ^^ @karen unsure what this means? -jared
        cluster: entry.cluster,
        fullContent: null,
      }));

    const { clusters } = articlesResponse.data;
    const articlesData = filteredResults;

    console.log("search step 1, found articles:", articlesData);

    // Step 2: Generate summaries for the top 5 relevant articles (in future will use clustering results)
    const summaryRequestBody = {
      articles: Object.fromEntries(
        articlesData
          .slice(0, 5)
          .map((article: any) => [
            article.url,
            { title: article.title, fullContent: article.fullContent },
          ])
      ),
      ai_preferences,
    };

    const summaryResponse = await axios.post(
      `${BASE_URL}/summarize-articles`,
      summaryRequestBody
    );
    const { title, summary, enriched_articles } = summaryResponse.data;

    console.log("Summary:", summary);
    console.log("Enriched Articles:", enriched_articles);

    // step 4: update articles with content (for caching)
    const enrichedArticlesData = articlesData.map((article: any) => {
      const enrichedArticle = enriched_articles.find(
        (ea: any) => ea.url === article.url
      );
      return {
        ...article,
        fullContent: enrichedArticle?.content || null,
      };
    });

    // Step 4: Combine articles and summaries into a single response
    const result: {
      articles: any;
      summary: { title: any; summary: any };
      clusters?: any;
    } = {
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
router.post(
  "/daily-news",
  async (req: Request, res: Response): Promise<void> => {
    try {
      // const { search_preferences, ai_preferences } = req.body;
      const { local } = req.body;

      // if (!search_preferences) {
      //     res.status(400).json({ message: 'User preferences are required' });
      // }

      const ai_preferences = {
        length: "short", // options: {"short", "medium", "long"}
        tone: "formal", // options: {"formal", "conversational", "technical", "analytical"}
        format: "highlights", // options: {"highlights", "bullets", "analysis", "quotes"}
        jargon_allowed: true, // options: {True, False}
      };

      const route = req.body && local ? "local-news" : "daily-news";

      const response = await axios.post(`${BASE_URL}/${route}`);
      console.log("DATA", response.data);
      const { clusters, overall_summary } = response.data;
      console.log("clust", clusters);

      // summarizing each cluster
      const clusterSummaries = await Promise.all(
        clusters.map(async (cluster: { cluster_id: any; articles: any }) => {
          // data formatted for summary endpoint

          const clusterId = cluster.cluster_id;
          const articles = cluster.articles;

          const formattedArticles = (articles as any[]).reduce(
            (acc, article) => {
              acc[article.url] = {
                title: article.title,
                fullContent: article.content,
                imageUrl: article.img,
                readTime: article.readTime,
                biasRating: article.biasRating,
                source: article.source,
              };
              return acc;
            },
            {}
          );
          try {
            console.log("HERERERE", formattedArticles);
            const summaryResponse = await axios.post(
              `${BASE_URL}/summarize-articles`,
              {
                articles: formattedArticles,
                ai_preferences: ai_preferences,
              }
            );

            const summaryData = summaryResponse.data;

            return {
              cluster: clusterId,
              articles: summaryData.enriched_articles,
              title: summaryData.title,
              summary: summaryData.summary,
            };
          } catch (error) {
            console.error(`Error summarizing cluster ${clusterId}:`, error);
            return {
              cluster: Number(clusterId),
              articles: formattedArticles,
              title: "Title generation failed.",
              summary: "Summary generation failed.",
            };
          }
        })
      );

      res.json({ overall_summary, clusterSummaries });
    } catch (error) {
      console.error("error processing search request", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// // @route POST /dailynews
// // @description refreshes daily news
// // @returns list of articles
// router.post('/dailynews', async (req: Request, res: Response): Promise<void> => {
//     try {
//         const { search_preferences } = req.body;

//         if (!search_preferences) {
//             res.status(400).json({ message: 'User preferences are required' });
//         }

//         const response = await axios.post('http://127.0.0.1:5000/daily-news', { search_preferences });
//         res.json(response.data);
//     } catch (error) {
//         console.error("error processing search request", error);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// });

// @route POST summarize/article
// @description Summarizes a single article based on user preferences using OpenAI
router.post(
  "/summarize/article",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { article, ai_preferences } = req.body;
      if (!article) {
        res.status(400).json({ message: "Article is required" });
      }
      if (!ai_preferences) {
        res.status(400).json({ message: "AI preferences are required" });
      }

      // send article and user prefs to the Python backend
      const response = await axios.post(`${BASE_URL}/summarize-article`, {
        article,
        ai_preferences,
      });

      res.json(response.data);
    } catch (error) {
      console.error("Error processing summarize article request", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// @route POST summarize/articles
// @description Summarizes multiple articles and provides an overview based on user preferences using OpenAI
// this would only be called by frontend for REFRESHING summary such as updating params
router.post(
  "/summarize/articles",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { articles, ai_preferences } = req.body;
      if (!articles) {
        res.status(400).json({ message: "Articles are required" });
      }
      if (!ai_preferences) {
        res.status(400).json({ message: "AI preferences are required" });
      }

      // send articles and user prefs to the Python backend
      const response = await axios.post(`${BASE_URL}/summarize-articles`, {
        articles,
        ai_preferences,
      });

      res.json(response.data);
    } catch (error) {
      console.error("Error processing summarize articles request", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// @route POST generate/audio
// @description Generates an audio file from an article text using TTS
// should only be used on article SUMMARY to avoid rate limits
router.post(
  "/generate/audio",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { article, summary } = req.body; // should be an article title and its content
      if (!article) {
        res.status(400).json({ message: "Article title is required" });
      }
      if (!summary) {
        res.status(400).json({ message: "Article summary is required" });
      }

      const response = await axios.post(`${BASE_URL}/generate-audio`, {
        article,
        summary,
      });

      res.json(response.data);
    } catch (error) {
      console.error("Error processing generate audio request", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// @route POST generate/podcast
// @description Generates a podcast based on multiple articles
router.post(
  "/generate/podcast",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { articles } = req.body; // should be a list of article URLs
      if (!articles) {
        res.status(400).json({ message: "Articles are required" });
      }

      const response = await axios.post(`${BASE_URL}/generate-podcast`, {
        articles,
      });

      res.json(response.data);
    } catch (error) {
      console.error("Error processing generate podcast request", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// @route GET audio/filename
// @description Gets audio clip from Python server
router.get("/audio", async (req: Request, res: Response): Promise<void> => {
  try {
    const { filename } = req.query;
    if (!filename) {
      res.status(400).json({ message: "Audio filename is required" });
    }
    const response = await axios({
      method: "get",
      url: `${BASE_URL}/audio/${filename}`,
      responseType: "stream", // <- IMPORTANT: Enables streaming of the file
    });

    res.setHeader("Content-Type", "audio/mpeg");
    response.data.pipe(res);
  } catch (error) {
    console.error("Error fetching audio", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// @route GET user/topics
// @description Gets the user's preferences.
router.get(
  "/user/preferences",
  async (req: Request, res: Response): Promise<void> => {
    console.log("APIRoutes, /user/preferences");
    try {
      const userID = req.query.userID as string; // Explicitly cast to string if using TypeScript
      if (!userID) {
        res.status(400).json({ message: "No user is logged in" });
      }

      const preferencesResponse = await axios.get(
        "http://127.0.0.1:5000/user/preferences",
        {
          params: { userID }, // Pass query parameters to Flask
        }
      );

      res.json(preferencesResponse.data);
    } catch (error) {
      console.error("Error retrieving user preferences:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// @route POST /search/topics
// @description Gets articles related to the user's topics.
router.post(
  "/search/topics",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { topics, search_preferences } = req.body;

      const topics_articles = await axios.post(
        "http://127.0.0.1:5000/search/topics",
        {
          topics,
          search_preferences,
        }
      );

      res.json(topics_articles.data);
    } catch (error) {
      console.error("Error retrieving user topics", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

router.post(
  "/crawl/all",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const response = await axios.post("http://127.0.0.1:5000/crawl/all");

      res.status(response.status).json(response.data);
    } catch (error) {
      console.error("Error occurred during crawling:", error);

      if (axios.isAxiosError(error) && error.response) {
        res.status(error.response.status).json(error.response.data);
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  }
);

router.post(
  "/crawl/local",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const response = await axios.post("http://127.0.0.1:5000/crawl/local");

      res.status(response.status).json(response.data);
    } catch (error) {
      console.error("Error occurred during crawling:", error);

      if (axios.isAxiosError(error) && error.response) {
        res.status(error.response.status).json(error.response.data);
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  }
);

interface User {
  username: string;
  email: string;
  password: string;
}

let users: User[] = []; // Simple in-memory store

// Register Route
router.post("/register", async (req: Request, res: Response): Promise<void> => {
  const { username, email, password } = req.body;
  if (!username || !email || !password)
    res.status(400).json({ message: "Missing fields" });

  const hashedPassword = await bcrypt.hash(password, 10);
  users.push({ username, email, password: hashedPassword });

  res.json({ message: "User registered successfully" });
});

// Sign-in Route
router.post("/signin", async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  const user = users.find((user) => user.email === email);

  if (!user || !(await bcrypt.compare(password, user.password))) {
    res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign({ email }, process.env.JWT_SECRET || "secret", {
    expiresIn: "1h",
  });
  res.json({ token });
});

export default router;
