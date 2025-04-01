"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ProgressSteps from "./progresssteps";

const BASE_URL = "http://localhost:3000";

interface Step1Props {
  nextPage: string;
}

const Step1: React.FC<Step1Props> = ({ nextPage }) => {
  const [name, setName] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    const fetchUserName = async () => {
      const userEmail = localStorage.getItem("userEmail");
      if (!userEmail) return;

      try {
        const response = await fetch(`${BASE_URL}/api/user/name?email=${userEmail}`);
        if (!response.ok) {
          throw new Error("Failed to fetch user name");
        }
        const data = await response.json();
        setName(data);
      } catch (error) {
        console.error("Error fetching user name:", error);
      }
    };

    fetchUserName();
  }, []);

  const handleContinue = () => {
    router.push(nextPage);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-100 to-blue-300 p-8">
      <div className="bg-white w-full max-w-7xl rounded-xl shadow-lg p-16 flex flex-col items-center">
        <div className="flex flex-col items-center mb-6">
            <ProgressSteps currentStep={1} totalSteps={3} />
            <h1 className="text-3xl font-bold text-gray-700">Hello{name ? `, ${name}` : ""}!</h1>
        </div>
        <p className="text-lg text-gray-600">
          Let's set up your Bitewise experience.
        </p>
        <p className="text-lg text-gray-600 mb-8">
          You'll be able to select your favorite topics and sources.
        </p>
        <button
          className="bg-darkBlue hover:bg-mediumBlue text-white font-semibold py-2 px-6 rounded-full focus:outline-none"
          onClick={handleContinue}
        >
          Get Started
        </button>
        <Link href="/profile">
            <button className="mt-4 text-darkBlue underline">Skip</button>
        </Link>
      </div>
    </div>
  );
};

export default Step1;