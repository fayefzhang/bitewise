"use client";

import { AdvancedSearchPreferences } from "../common/interfaces";
import SignInPopUp from "./signinpopup";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { defaultSearchPreferences } from "../common/utils";

const BASE_URL = "http://localhost:3000";

interface HeaderProps {
  onSearch: (term: string) => void;
  setPreferences?: (preferences: AdvancedSearchPreferences) => void;
  placeholder?: string;
  isSearchPage?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  onSearch,
  setPreferences,
  placeholder = "Search for articles...",
  isSearchPage = false,
}) => {
  // SEARCH FUNCTIONAL SETUP
  const [searchTerm, setSearchTerm] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [searchPreferences, setSearchPreferences] =
    useState<AdvancedSearchPreferences>(defaultSearchPreferences);

  const toggleReadTime = (time: string) => {
    setSearchPreferences((prev) => {
      const currentSelection = prev.read_time || []; // Ensure it's an array
      const isAlreadySelected = currentSelection.includes(time);

      return {
        ...prev,
        read_time: isAlreadySelected
          ? currentSelection.filter((t) => t !== time) // Remove if already selected
          : [...currentSelection, time], // Add if not selected
      };
    });
  };

  const toggleBias = (articleBias: string) => {
    setSearchPreferences((prev) => {
      const currentSelection = prev.bias || []; // Ensure it's an array
      const isAlreadySelected = currentSelection.includes(articleBias);

      return {
        ...prev,
        bias: isAlreadySelected
          ? currentSelection.filter((b) => b !== articleBias) // Remove if already selected
          : [...currentSelection, articleBias], // Add if not selected
      };
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchTerm.trim()) {
      onSearch(searchTerm.trim());
      if (setPreferences) setPreferences(searchPreferences);
    }
  };

  // SIGN IN SIGN UP POPUP
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const openPopup = () => setIsPopupOpen(true);
  const closePopup = () => setIsPopupOpen(false);

  const transformReadTime = (read_time: number): string[] => {
    if (!read_time)
      return [];
    switch (read_time) {
      case 1:
        return ["Short"];
      case 2:
        return ["Medium"];
      case 3:
        return ["Long"];
      default:
        return [];
    }
  };

  const transformBias = (bias: number): string[] => {
    if (!bias)
      return [];
    switch (bias) {
      case 1:
        return ["Center"];
      case 2:
        return ["Left"];
      case 3:
        return ["Left", "Center"];
      case 4:
        return ["Right"];
      case 5:
        return ["Right", "Center"];
      default:
        return [];
    }
  };

  const [isSignedIn, setisSignedIn] = useState(false);
  useEffect(() => {
    const userEmail = localStorage.getItem("userEmail"); // Check if user is signed in
    if (userEmail) {
      setisSignedIn(true);

      // Fetch user preferences from backend
      const fetchUserPreferences = async () => {
        try {
          const response = await fetch(
            `${BASE_URL}/api/user/preferences?email=${userEmail}`
          );
          if (!response.ok) {
            throw new Error("Failed to fetch user preferences");
          }

          const userPreferences = await response.json();
          // Transform the fetched user preferences into the search preferences format
          const transformedPreferences = {
            from_date: userPreferences.from_date || "",
            to_date: "", // NOT IN DATABASE
            read_time: transformReadTime(userPreferences.read_time),
            bias: transformBias(userPreferences.bias),
            clustering: userPreferences.clustering || false,
          };

          // Update the search preferences state
          setSearchPreferences(transformedPreferences);
        } catch (error) {
          console.error("Error fetching user preferences:", error);
        }
      };

      fetchUserPreferences();
    }
  }, []); // Empty dependency array to run this effect once when the component mounts

  return (
    <header className="sticky top-0 z-50 bg-white shadow-md bg-gradient-to-r from-blue-500 to-indigo-600 p-4 flex justify-center items-center">
      <div className="flex space-x-4 absolute left-4">
        <Link href="/dashboard">
          <div className="bg-white p-2 rounded-full cursor-pointer">
            <Image
              src="/bitewise_logo.png"
              alt="logo"
              width={40}
              height={30}
              className="rounded-lg"
            />
          </div>
        </Link>
      </div>
      <div className="flex items-center space-x-2 bg-white p-2 rounded-md">
        <span className="text-xl">🔍</span>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="p-2 w-full md:w-80 text-black focus:outline-none"
        />
        {isSearchPage && (
          <button
            className="text-xl text-gray-600 hover:text-black"
            onClick={() => setShowSettings(!showSettings)}
          >
            ⚙️
          </button>
        )}
      </div>
      <div className="flex space-x-4 absolute right-4">
        {isSignedIn && ( // only show profile if user is signed in
          <div className="flex space-x-4">
            <Link href="/profile">
              <button className="p-3 rounded-full bg-white text-2xl text-black">
                ☰
              </button>
            </Link>
          </div>
        )}
        {!isSignedIn && ( // only show sign in if user is not signed in
          <button
            className="p-3 rounded-full bg-white text-2xl"
            onClick={openPopup}
          >
            👤
          </button>
        )}
      </div>

      {/* Sign In Sign Up Pop Up */}
      {isPopupOpen && <SignInPopUp isOpen={isPopupOpen} onClose={closePopup} />}

      {/* Advanced Search */}
      {showSettings && (
        <div
          className="absolute bg-white shadow-lg rounded-lg p-6 w-96 top-20 mx-auto left-1/2 transform -translate-x-1/2 text-black"
          style={{ zIndex: 50 }}
        >
          <h3 className="text-lg font-bold mb-4">Advanced Settings</h3>
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2">
              Read Time
            </label>
            <div className="flex space-x-2">
              {["Short", "Medium", "Long"].map((time) => {
                const isSelected = searchPreferences.read_time?.includes(time);
                return (
                  <button
                    key={time}
                    className={`px-4 py-2 rounded-md ${
                      isSelected ? "bg-blue-500 text-white" : "bg-gray-200"
                    } hover:bg-gray-300`}
                    onClick={() => toggleReadTime(time)}
                  >
                    {time}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2 flex items-center space-x-1">
              <span>Bias</span>
              <div className="relative group">
                <svg
                  className="w-4 h-4 text-blue-500 hover:text-gray-700 cursor-pointer"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M12 18h0"
                  />
                </svg>
                <div className="absolute left-6 top-1/2 transform -translate-y-1/2 w-56 bg-gray-800 text-white text-xs rounded-md p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg">
                  Bias is determined by the source's rating in our bias
                  database.
                </div>
              </div>
            </label>
            <div className="flex space-x-2">
              {["Left", "Center", "Right"].map((bias) => {
                const isSelected = searchPreferences.bias?.includes(bias);
                return (
                  <button
                    key={bias}
                    className={`px-4 py-2 rounded-md ${
                      isSelected ? "bg-blue-500 text-white" : "bg-gray-200"
                    } hover:bg-gray-300`}
                    onClick={() => toggleBias(bias)}
                  >
                    {bias}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2">
              Date Published From
            </label>
            <div className="flex space-x-2">
              <input
                type="date"
                value={searchPreferences.from_date}
                onChange={(e) =>
                  setSearchPreferences((prev) => ({
                    ...prev,
                    from_date: e.target.value,
                  }))
                }
                className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2">
              Clustering
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="clustering"
                className="w-4 h-4"
                checked={searchPreferences.clustering}
                onChange={(e) =>
                  setSearchPreferences((prev) => ({
                    ...prev,
                    clustering: e.target.checked,
                  }))
                }
              />
              <label htmlFor="clustering" className="text-sm">
                Enable Clustering
              </label>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
