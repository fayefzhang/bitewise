"use client";

import Image from "next/image";
import { useState } from "react";

interface HeaderProps {
  onSearch: (term: string) => void;
  placeholder?: string;
}

const Header: React.FC<HeaderProps> = ({ onSearch, placeholder = "Search for articles..." }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchTerm.trim()) {
      onSearch(searchTerm.trim());
    }
  };

  return (
    <header className="bg-blue-600 p-4 rounded-t-lg flex justify-between items-center">
      <div className="flex items-center space-x-4">
        <div className="bg-white p-2 rounded-full">
          <Image
            src="/bitewise_logo.png" // Replace with actual image path
            alt="logo"
            width={40}
            height={30}
            className="rounded-lg"
          />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="p-2 rounded-md w-full md:w-80"
        />
      </div>
      <div className="flex space-x-4">
        <button className="p-2 rounded-full bg-white">
          <span role="img" aria-label="settings">
            ⚙️
          </span>
        </button>
        <button className="p-2 rounded-full bg-white">
          <span role="img" aria-label="user">
            👤
          </span>
        </button>
      </div>
    </header>
  );
};

export default Header;
