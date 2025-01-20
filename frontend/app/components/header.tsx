"use client";

import { Preferences } from "../common/interfaces";
import SignInPopUp from "./signinpopup";
import { search } from "@/api/api";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

interface HeaderProps {
  onSearch: (term: string) => void;
  setPreferences: (preferences: Preferences) => void;
  placeholder?: string;
}

const Header: React.FC<HeaderProps> = ({
  onSearch,
  setPreferences,
  placeholder = "Search for articles...",
}) => {
  // SEARCH FUNCTIONAL SETUP
  const [searchTerm, setSearchTerm] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [searchPreferences, setSearchPreferences] = useState<Preferences>({
    sources: [],
    domains: [],
    exclude_domains: [],
    from_date: "",
    read_time: "",
    bias: "",
    clustering: false,
  });

  const toggleReadTime = (time: string) => {
    if (searchPreferences.read_time == time) {
      setSearchPreferences((prev) => ({
        ...prev,
        read_time: "",
      }));
    } else {
      setSearchPreferences((prev) => ({
        ...prev,
        read_time: time,
      }));
    }
  };

  const toggleBias = (articleBias: string) => {
    if (searchPreferences.bias == articleBias) {
      setSearchPreferences((prev) => ({
        ...prev,
        bias: "",
      }));
    } else {
      setSearchPreferences((prev) => ({
        ...prev,
        bias: articleBias,
      }));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchTerm.trim()) {
      onSearch(searchTerm.trim());
      setPreferences(searchPreferences);
    }
  };

  const updatePreference = (key: string, value: unknown) => {
    setSearchPreferences((prev) => ({ ...prev, [key]: value }));
  };

  // SIGN IN SIGN UP POPUP
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const openPopup = () => setIsPopupOpen(true);
  const closePopup = () => setIsPopupOpen(false);

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
        <button
          className="text-xl text-gray-600 hover:text-black"
          onClick={() => setShowSettings(!showSettings)}
        >
          ⚙️
        </button>
      </div>
      <div className="flex space-x-4 absolute right-4">
        <Link href="/profile">
          <button className="p-3 rounded-full bg-white text-2xl">☰</button>
        </Link>
        <button
          className="p-3 rounded-full bg-white text-2xl"
          onClick={openPopup}
        >
          👤
        </button>
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
              {["Short", "Medium", "Long"].map((time: string) => {
                const isSelected = searchPreferences.read_time == time;
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
            <label className="block text-sm font-semibold mb-2">Bias</label>
            <div className="flex space-x-2">
              {["Left", "Center", "Right"].map((bias: string) => {
                const isSelected = searchPreferences.bias == bias;
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
