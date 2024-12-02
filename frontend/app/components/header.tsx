"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

interface HeaderProps {
  onSearch: (term: string) => void;
  placeholder?: string;
}

const Header: React.FC<HeaderProps> = ({
  onSearch,
  placeholder = "Search for articles...",
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showSettings, setShowSettings] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchTerm.trim()) {
      onSearch(searchTerm.trim());
    }
  };

  return (
    <header className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4 flex justify-center items-center">
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
        <button className="p-3 rounded-full bg-white text-2xl">☰</button>
        <button className="p-3 rounded-full bg-white text-2xl">👤</button>
      </div>

      {/* Advanced Search */}
      {showSettings && (
        <div
          className="absolute bg-white shadow-lg rounded-lg p-6 w-96 top-20 mx-auto left-1/2 transform -translate-x-1/2 text-black"
          style={{ zIndex: 50 }}
        >
          <h3 className="text-lg font-bold mb-4">Advanced Settings</h3>
          {/* Date: Slider */}
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2">Date</label>
            <input type="range" className="w-full" />
          </div>
          {/* Read Time: Buttons */}
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2">
              Read Time
            </label>
            <div className="flex space-x-2">
              <button className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300">
                Short
              </button>
              <button className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300">
                Medium
              </button>
              <button className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300">
                Long
              </button>
            </div>
          </div>
          {/* Topic: Tags */}
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2">Topic</label>
            <div className="flex space-x-2 flex-wrap">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
                Technology
              </span>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
                Health
              </span>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
                Business
              </span>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
                Entertainment
              </span>
            </div>
          </div>
          {/* Bias: Slider */}
          <div>
            <label className="block text-sm font-semibold mb-2">Bias</label>
            <input type="range" className="w-full" />
          </div>
          {/* Clustering: Checkmark */}
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2">
              Clustering
            </label>
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="clustering" className="w-4 h-4" />
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
