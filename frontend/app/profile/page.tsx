"use client";

import Header from "../components/header";
import { useRouter } from "next/navigation";
import React, { useEffect, useState, useRef } from "react";
import { useLoadScript, Autocomplete } from "@react-google-maps/api";
import config from "../../config";

import {
  interests,
  sources,
  biasRatingLabels,
  readTimeLabels,
} from "../common/utils";

const BASE_URL = "http://localhost:3000";

const ProfilePage: React.FC = () => {
  const router = useRouter();
  const handleSearch = (term: string) => {
    if (term) {
      router.push(`/search?query=${encodeURIComponent(term)}`);
    }
  };

  const [userPreferences, setUserPreferences] = useState({
    topics: [] as string[],
    sources: [] as string[],
    exclude_domains: [] as string[],
    read_time: [] as string[],
    bias: [] as string[],
    from_date: "",
    clustering: false,
    location: "Philadelphia",
  });
  const [name, setName] = useState<string>("");
  const [customTopic, setCustomTopic] = useState<string>("");
  const [isLocationEdited, setIsLocationEdited] = useState<boolean>(false);
  const [includedSources, setIncludedSources] = useState<string[]>([]);
  const [excludedSources, setExcludedSources] = useState<string[]>([]);

  const libraries: ["places"] = ["places"];

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: config.googleMapsApiKey,
    libraries,
  });

  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isLoaded && inputRef.current) {
      autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
        types: ["(cities)"]
      });

      autocompleteRef.current.addListener("place_changed", handlePlaceSelect);
    }
  }, [isLoaded]);

  const handlePlaceSelect = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place?.name) {
        setUserPreferences({ ...userPreferences, location: place.name });
        setIsLocationEdited(true);
      }
    }
  };

  // Fetch user preferences on page load
  useEffect(() => {
    const userEmail = localStorage.getItem("userEmail");
    const fetchUserPreferences = async () => {
      try {
        const userPrefResponse = await fetch(
          `${BASE_URL}/api/user/preferences?email=${userEmail}`
        );
        if (!userPrefResponse.ok) {
          throw new Error("Failed to get existing user preferences");
        }
        const userPreferences = await userPrefResponse.json();

        // Set the initial state based on fetched preferences
        setUserPreferences({
          topics: userPreferences.topics || [],
          sources: userPreferences.sources || [],
          exclude_domains: userPreferences.exclude_domains || [],
          read_time: userPreferences.read_time || [],
          bias: userPreferences.bias || [],
          from_date: userPreferences.from_date,
          clustering: userPreferences.clustering,
          location: userPreferences.location || "Philadelphia",
        });
        setIncludedSources(userPreferences.sources || []);
        setExcludedSources(userPreferences.exclude_domains || []);
      } catch (error) {
        console.error("Error fetching user preferences:", error);
      }
    };
    fetchUserPreferences();

    const fetchUserName = async () => {
      try {
        const userNameResponse = await fetch(
          `${BASE_URL}/api/user/name?email=${userEmail}`
        );
        if (!userNameResponse) {
          throw new Error("Failed to get existing user name");
        }
        const userName = await userNameResponse.json();
        setName(userName);
      } catch (error) {
        console.error("Error fetching user name:", error);
      }
    };
    fetchUserName();
  }, []);

  const updateUserProfile = async (updatedPreferences: typeof userPreferences) => {
    try {
      const userEmail = localStorage.getItem("userEmail");
      const response = await fetch(`${BASE_URL}/api/user/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: {
            email: userEmail, // make sure to pass the current user's email
            preferences: updatedPreferences,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update user preferences");
      }

      const updatedPreferencesResponse = await response.json();
      console.log("Updated preferences:", updatedPreferencesResponse);
    } catch (error) {
      console.error("Error updating preferences:", error);
    }
  };

  const handleLogOut = async () => {
    localStorage.clear();
    router.push("/dashboard");
  };

  const handleOptionClick = (interest: string, isTopics: boolean) => {
    if (isTopics) {
      // topics
      const updatedTopics = userPreferences.topics.includes(interest)
        ? userPreferences.topics.filter((i) => i !== interest)
        : [...userPreferences.topics, interest];
      setUserPreferences({ ...userPreferences, topics: updatedTopics });
      updateUserProfile({ ...userPreferences, topics: updatedTopics });
    }
  };

  const handleSourceToggle = (source: string) => {
    let updatedSources;
    let updatedExcludedDomains;

    if (includedSources.includes(source)) {
      updatedSources = includedSources.filter((s) => s !== source);
      updatedExcludedDomains = [...excludedSources, source];
    } else if (excludedSources.includes(source)) {
      updatedExcludedDomains = excludedSources.filter((s) => s !== source);
    } else {
      updatedSources = [...includedSources, source];
    }

    setIncludedSources(updatedSources || includedSources);
    setExcludedSources(updatedExcludedDomains || excludedSources);

    setUserPreferences({
      ...userPreferences,
      sources: updatedSources || includedSources,
      exclude_domains: updatedExcludedDomains || excludedSources,
    });

    updateUserProfile({
      ...userPreferences,
      sources: updatedSources || includedSources,
      exclude_domains: updatedExcludedDomains || excludedSources,
    });
  };

  const handleReadTimeToggle = (label: string) => {
    const updatedReadTime = userPreferences.read_time.includes(label)
      ? userPreferences.read_time.filter((b) => b !== label)
      : [...userPreferences.read_time, label];
    setUserPreferences({ ...userPreferences, read_time: updatedReadTime });
    updateUserProfile({ ...userPreferences, read_time: updatedReadTime });
  };

  const handleBiasToggle = (label: string) => {
    const updatedBias = userPreferences.bias.includes(label)
      ? userPreferences.bias.filter((b) => b !== label)
      : [...userPreferences.bias, label];
    setUserPreferences({ ...userPreferences, bias: updatedBias });
    updateUserProfile({ ...userPreferences, bias: updatedBias });
  };

  const handleLocationChange = (newLocation: string) => {
    setUserPreferences({ ...userPreferences, location: newLocation });
    setIsLocationEdited(true); // Mark as edited
  };

  const handleLocationSet = () => {
    updateUserProfile(userPreferences);
    setIsLocationEdited(false); // Reset the edited state
  };

  // handle searching for topics
  const [searchInterestsQuery, setSearchInterestsQuery] = useState<string>("");
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInterestsQuery(event.target.value);
  };
  const filteredInterests = interests.filter((interest) =>
    interest.toLowerCase().includes(searchInterestsQuery.toLowerCase())
  );
  const combinedInterests = Array.from(new Set([...filteredInterests, ...userPreferences.topics]));

  useEffect(() => {
    // if user is not signed in, push back to dashboard
    const userEmail = localStorage.getItem("userEmail"); // check against localstorage (this is the scuffed way)
    if (userEmail == null) router.push("/dashboard");
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header onSearch={handleSearch} placeholder="Search topic..." />
      <div className="w-[80%] min-h-screen mx-auto text-black">
      <div className="flex-grow flex flex-col items-start bg-white p-8">
        {/* Topics Section */}
        <div className="flex flex-col items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-600">
            Persistent User Preferences
          </h1>
        </div>

        {/* Advanced Search Section */}
        <div className="flex flex-col items-center mb-4">
          <h1 className="text-xl font-bold">
            Advanced Search Defaults
          </h1>
        </div>
        {/* Read Time */}
        <div className="flex flex-row items-center gap-4">
          <label>Read Time</label>
          <div className="flex flex-wrap gap-2">
            {readTimeLabels.map((label, index) => (
              <button
                key={index}
                className={`border-2 rounded-full px-4 py-2 text-darkBlue font-medium ${
                  userPreferences.read_time.includes(label) ? "bg-darkBlue text-white" : "bg-white"
                }`}
                onClick={() => handleReadTimeToggle(label)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Bias */}
        <div className="flex flex-row items-center gap-4">
          <label>Bias</label>
          <div className="flex flex-wrap gap-2">
            {biasRatingLabels.map(
              (label, index) =>
                label && (
                  <button
                    key={index}
                    className={`border-2 rounded-full px-4 py-2 text-darkBlue font-medium ${
                      userPreferences.bias.includes(label)
                        ? "bg-darkBlue text-white"
                        : "bg-white"
                    }`}
                    onClick={() => handleBiasToggle(label)}
                  >
                    {label}
                  </button>
                )
            )}
          </div>
          <div className="relative group">
            <svg
              className="transform translate-y-3 w-4 h-4 text-darkBlue hover:text-gray-700 cursor-pointer"
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
            <div className="w-56 bg-gray-800 text-white text-xs rounded-md p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg">
              Bias is determined by the source's rating in our bias database.
            </div>
          </div>
        </div>

        <div className="border-b-2 border-veryLightBlue mb-4 w-full"/>

        {/* Topics Section */}
        <div className="flex-col items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-600">
            Dashboard Preferences
          </h1>
        </div>
        <div className="flex-col items-center mb-4">
          <h1 className="text-xl font-bold">Followed Topics</h1>
        </div>
        <div className="flex flex-row items-center gap-4 mb-4">
          <input
            type="text"
            placeholder="Search Topics..."
            value={searchInterestsQuery}
            onChange={handleSearchChange}
            className="w-full border-2 rounded-full px-4 py-2 text-darkBlue font-medium focus:outline-none focus:ring-2 focus:ring-darkBlue"
          />
          <input
            type="text"
            placeholder="Add custom topic..."
            value={customTopic}
            onChange={(e) => setCustomTopic(e.target.value)}
            className="border-2 rounded-full px-4 py-2 text-darkBlue font-medium focus:outline-none focus:ring-2 focus:ring-darkBlue"
          />
          <button
            className="bg-darkBlue hover:bg-mediumBlue text-white font-semibold py-2 px-4 rounded-full focus:outline-none"
            onClick={() => {
              if (customTopic && !userPreferences.topics.includes(customTopic)) {
                const updatedTopics = [...userPreferences.topics, customTopic];
                setUserPreferences({ ...userPreferences, topics: updatedTopics });
                setCustomTopic("");
                updateUserProfile({ ...userPreferences, topics: updatedTopics });
              }
            }}
          >
            Add
          </button>
        </div>
        <div className="w-full flex flex-wrap gap-4 mb-4">
          {combinedInterests.map((interest) => (
            <button
              key={interest}
              className={`border-2 rounded-full px-4 py-2 text-darkBlue font-medium hover:bg-darkBlue hover:text-white focus:outline-none ${
                userPreferences.topics.includes(interest)
                  ? (interests.includes(interest) ? "bg-darkBlue text-white" : "bg-darkBlue text-blue-100")
                  : "bg-white"
              }`}
              onClick={() => handleOptionClick(interest, true)}
            >
              {interest}
            </button>
          ))}
        </div>

        {/* Location */}
      <div className="flex flex-col items-center mb-4">
        <h1 className="text-xl font-bold">Local News Location</h1>
      </div>
      <div className="flex flex-row items-center gap-4 mb-4">
        <label>
          Location {isLocationEdited && <span className="text-red-500">*</span>}
        </label>

        {/* Autocomplete Input Field */}
        <input
          type="text"
          ref={(el) => {
            if (el && isLoaded && !autocompleteRef.current) {
              autocompleteRef.current = new window.google.maps.places.Autocomplete(el);
              autocompleteRef.current.addListener("place_changed", handlePlaceSelect);
            }
          }}
          value={userPreferences.location}
          onChange={(e) => handleLocationChange(e.target.value)}
          className="border-2 rounded-full px-4 py-2 text-darkBlue font-medium"
          placeholder="Enter your location"
        />

        {/* Set Button */}
        <button
          className="bg-darkBlue hover:bg-mediumBlue text-white font-semibold py-2 px-6 rounded-full focus:outline-none"
          onClick={handleLocationSet}
        >
          Set
        </button>
      </div>

        {/* Sources Section */}
        <div className="flex flex-col items-center mb-4">
          <h1 className="text-xl font-bold">Your Sources</h1>
        </div>
        <div className="w-full flex flex-wrap gap-4 mb-4">
          {sources.map((source) => (
            <button
              key={source}
              className={`border-2 rounded-full px-4 py-2 font-medium focus:outline-none ${
                includedSources.includes(source)
                  ? "bg-darkBlue text-white"
                  : excludedSources.includes(source)
                  ? "bg-red-400 text-white"
                  : "bg-white text-darkBlue"
              }`}
              onClick={() => handleSourceToggle(source)}
            >
              {source}
            </button>
          ))}
        </div>

        <div className="border-b-2 border-veryLightBlue mb-4 w-full"/>
        <div className="flex flex-row justify-end mb-1">
          <h1 className="text-s font-bold text-gray-600">
            Current user: {localStorage.getItem("userEmail")}
          </h1>
        </div>
        <div className="flex flex-row justify-end mb-6">
          <button
            className="bg-darkBlue hover:bg-mediumBlue text-white font-semibold py-2 px-6 rounded-full focus:outline-none"
            onClick={() => handleLogOut()}
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
    </div>
  );
};

export default ProfilePage;