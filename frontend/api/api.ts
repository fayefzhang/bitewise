import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';


export const search = async (query: string) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/search`, { query });
        return response.data;
    } catch (error) {
        console.error("error processing search request", error);
        return { error: 'Internal server error' };
    }
};