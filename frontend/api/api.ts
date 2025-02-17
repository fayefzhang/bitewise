import axios from "axios";
import { defaultSearchIPreferences, IPreference, IUser } from "../app/common/interfaces";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

export const search = async (query: string) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/search`, { query });
    return response.data;
  } catch (error) {
    console.error("error processing search request", error);
    return { error: "Internal server error" };
  }
};

// Fetch user preferences
export const fetchUserPreferences = async (userID: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/user/preferences`, {
      params: { userID },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching user preferences:", error);
    throw error;
  }
};

// Update user preferences
export const updateUser = async (user: IUser) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/user/update`, { user });
    return response.data;
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
};

// Login user
export const loginUser = async (email: string, password: string) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/user/login`, {
      email,
      password,
    });
    return response.data; // Includes token and user info
  } catch (error) {
    console.error("Login failed:", error);
    throw error;
  }
};

// Function to handle user registration
export const registerUser = async (email: string, password: string) => {
  try {
    // Call the updateUser function with user info after registration
    const user = { email, password, preferences: defaultSearchIPreferences }; // Collect user data
    const response = await updateUser(user); // Call the update user function to register/update
    console.log("User registered successfully:", response);
  } catch (error) {
    console.error("Error registering user:", error);
  }
};
