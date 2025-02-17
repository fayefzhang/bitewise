"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loginUser, registerUser } from "@/api/api";

interface SignInSignUpPopupProps {
  onClose: () => void;
  isOpen: boolean;
}

const SignInSignUpPopup: React.FC<SignInSignUpPopupProps> = ({
  onClose,
  isOpen,
}) => {
  const [isSignIn, setIsSignIn] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [animationClass, setAnimationClass] = useState("hidden");
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

    try {
      const response = isSignIn
        ? await loginUser(email, password)
        : await registerUser(email, password);

      if (response.token) {
        localStorage.setItem("token", response.token); // Store token for authentication
        router.push("/profile"); // Redirect after successful login/signup
      }
    } catch (error) {
      console.error("Authentication failed:", error);
      alert("Invalid credentials or error occurred. Please try again.");
    }
  };

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40"></div>}
      <div
        className={`fixed top-0 text-black/80 left-0 w-full h-full flex items-center justify-center z-50 ${animationClass}`}
        style={{ opacity: isOpen ? 1 : 0, transition: "opacity 0.3s ease" }}
      >
        <div className="bg-white rounded-lg shadow-lg p-6 w-96 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-2xl text-gray-500 hover:text-blue-700"
          >
            ×
          </button>
          <h2 className="text-xl font-bold mb-4 text-center">
            {isSignIn ? "Sign In" : "Sign Up"}
          </h2>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
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
                    className="text-blue-500 hover:underline"
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
                    className="text-blue-500 hover:underline"
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
