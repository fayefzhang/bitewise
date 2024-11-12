/* eslint-disable @next/next/no-img-element */
// app/dashboard/page.tsx

"use client"; // Allows use of React hooks

import Link from "next/link";

export default function Dashboard() {
  return (
    <div className="p-4 bg-gray-100 min-h-screen text-black">
      <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-md">
        {/* Header */}
        <header className="bg-blue-600 p-4 rounded-t-lg flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="bg-white p-2 rounded-full">
              {/* Icon Placeholder */}
              <span
                role="img"
                aria-label="radio"
                className="text-blue-600 text-lg"
              >
                📻
              </span>
            </div>
            <input
              type="text"
              placeholder="BiteWise"
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

        {/* Main Content */}
        <main className="p-4 md:p-8 flex flex-col md:flex-row space-y-6 md:space-y-0 md:space-x-6">
          <div className="flex-col">
            <h1 className="text-2xl font-bold">Good evening, USER.</h1>
            <p className="text-lg mb-4">
              We're covering Trump's victory, a Republican Senate and America's
              rightward shift.
            </p>

            <audio controls className="mt-2 w-full">
              <source src="/audio-summary.mp3" type="audio/mpeg" />{" "}
              {/* Replace with actual audio file */}
              Your browser does not support the audio element.
            </audio>
            <button className="flex items-center hover:underline mb-8">
              <svg
                className="w-6 h-6 mr-2"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 3v10.55a4 4 0 1 0 2 0V3h-2zm-7 6.5v2h2V9.5a7 7 0 1 1 10 0v2h2v-2a9 9 0 1 0-14 0z" />
              </svg>
              Listen to your daily bites: 11:14 min
            </button>

            <section className="mb-8">
              <h2 className="text-xl font-bold">President Trump, again</h2>
              <p className="mb-4">
                Donald Trump has completed a stunning political comeback, and
                the United States has entered an uncertain new era...
              </p>
              <div className="flex space-x-4">
                {[...Array(3)].map((_, index) => (
                  <div
                    key={index}
                    className="bg-white p-4 rounded-md shadow w-1/3"
                  >
                    <img
                      src="/placeholder.png"
                      alt="Harris concedes"
                      className="w-full h-32 object-cover rounded-md mb-2"
                    />
                    <p className="text-sm font-bold">Harris concedes</p>
                    <p className="text-xs">AP News</p>
                    <p className="text-sm mt-1">NEUTRAL</p>
                    <p className="text-xs mt-1">5 MIN READ</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold">Nvidia Surpasses Apple</h2>
              <p>
                Nvidia, whose chips power AI systems and Bitcoin mining,
                surpassed Apple to become the world's most valuable company...
              </p>
            </section>
          </div>

          {/* Your + Local Topics */}
          <aside className="w-full md:w-64 bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-bold mb-4">Your Topics</h3>
            <div className="bg-white p-4 rounded-md shadow mb-4">
              <h4 className="font-semibold">Climate Change</h4>
              <p className="text-sm">
                Trump's victory promises to shake up U.S. energy and climate
                policy, analysts say.
              </p>
            </div>
            <div className="bg-white p-4 rounded-md shadow">
              <h4 className="font-semibold">NFL</h4>
              <p className="text-sm">
                Niners RB Christian McCaffrey back at practice after missing
                first eight games of season.
              </p>
              <Link href="/" className="text-sm mt-2 block hover:underline">
                MORE
              </Link>
            </div>

            <h3 className="text-lg font-bold mb-4">Local News</h3>
            <div className="bg-white p-4 rounded-md shadow">
              <h4 className="font-semibold">
                Philadelphia, PA <span>73°</span>
              </h4>
              <p className="text-sm">
                Voter turnout throughout Philly area mostly lower than 2020
              </p>
              <Link href="/" className="text-sm mt-2 block hover:underline">
                MORE
              </Link>
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}
