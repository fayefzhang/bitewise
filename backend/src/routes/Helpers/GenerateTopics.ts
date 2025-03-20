import axios from 'axios';
import TopicsArticlesModel from '../../models/TopicsArticles';

async function generateTopics(topics: string[], searchPreferences: any): Promise<boolean> {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    try {
        // Check if topics already exist in the database
        const existingTopics = await Promise.all(
            topics.map(async (topic: string) => {
                const existingTopicArticle = await TopicsArticlesModel.findOne({
                    date: { $gte: startOfDay, $lte: endOfDay },
                    topic,
                });
                return existingTopicArticle ? null : topic;
            })
        );

        const nonExistentTopics = existingTopics.filter(topic => topic !== null);
        if (nonExistentTopics.length === 0) {
            return false; // No new topics to generate
        }

        // Fetch articles for topics
        const topicsArticlesResponse = await axios.post("http://127.0.0.1:5000/search/topics", {
            topics: nonExistentTopics,
            search_preferences: searchPreferences,
        });

        // Format data for MongoDB schema
        const formattedTopicsArticles = topicsArticlesResponse.data.map((topicArticle: { topic: string; results: any[] }) => ({
            date: new Date(), // Use current date
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
        await TopicsArticlesModel.insertMany(formattedTopicsArticles);
        return true; // Successfully inserted new topics
    } catch (error) {
        console.error("Error in generateTopics:", error);
        return false; // Handle errors gracefully
    }
}

export default generateTopics;