"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const BASE_URL = "http://localhost:3000";

interface SignInSignUpPopupProps {
  onClose: () => void;
  isOpen: boolean;
}

const SignInSignUpPopup: React.FC<SignInSignUpPopupProps> = ({
  onClose,
  isOpen,
}) => {
  const [isSignIn, setIsSignIn] = useState(true);
  const [animationClass, setAnimationClass] = useState("hidden");
  const [name, setName] = useState<string>(""); // Add state for name
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      setAnimationClass("popup-animation");
    } else {
      setAnimationClass("hidden");
    }
  }, [isOpen]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const email = (document.getElementById("email") as HTMLInputElement).value;
    const password = (document.getElementById("password") as HTMLInputElement).value;

    if (!email || !password || (!isSignIn && !name)) {
      alert("Please fill in all fields");
      return;
    }

    if (isSignIn) {
      // handle sign in
      const response = await fetch(`${BASE_URL}/api/user/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.message);
        return;
      }

      const data = await response.json();
      console.log("Sign-in successful", data);

      // Store user email
      localStorage.setItem("userEmail", email);
      localStorage.setItem("userName", data.name);
      router.push("/profile");
    } else {
      // handle sign up
      try {
        const response = await fetch(`${BASE_URL}/api/user/update`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user: { name, email, password, preferences: {} } }),
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Signup failed");
        }

        const data = await response.json();
        console.log("User created/updated:", data);
        localStorage.setItem("userEmail", email);
        router.push("/sign-up"); // Redirect to interests page
      } catch (error) {
        console.error("Error signing up:", error);
        alert("An error occurred. Please try again.");
      }
    }
  };

  return (
    <>
      {isOpen && (
        <div className="fixed top-0 left-0 w-full h-full bg-black/50 z-40"></div>
      )}
      <div
        className={`fixed top-0 text-black/80 left-0 w-full h-full flex items-center justify-center z-50 ${animationClass}`}
        style={{ opacity: isOpen ? 1 : 0, transition: "opacity 0.3s ease" }}
      >
        <div className="bg-white rounded-lg shadow-lg p-6 w-96 relative">
          <button
            onClick={onClose}
            className="text-5xl absolute top-4 right-4 text-gray-500 hover:text-mediumBlue"
          >
            ×
          </button>
          <h2 className="text-xl font-bold mb-4 text-center">
            {isSignIn ? "Sign In" : "Sign Up"}
          </h2>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            {!isSignIn && (
              <div>
                <label htmlFor="name">Name</label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-darkBlue"
                  required
                />
              </div>
            )}
            <div>
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-darkBlue"
                required
              />
            </div>
            <div>
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-darkBlue"
                required
              />
            </div>
            <button
              type="submit"
              className="bg-darkBlue hover:bg-mediumBlue text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              {isSignIn ? "Sign In" : "Sign Up"}
            </button>
          </form>
          <div className="mt-4 text-center">
            <p>
              {isSignIn ? (
                <span>
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setIsSignIn(false)}
                    className="text-darkBlue hover:underline"
                  >
                    Sign Up
                  </button>
                </span>
              ) : (
                <span>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setIsSignIn(true)}
                    className="text-darkBlue hover:underline"
                  >
                    Sign In
                  </button>
                </span>
              )}
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default SignInSignUpPopup;