"use client";

import Header from "../components/header";
import TopicsArticles from './components/topicsarticles';
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

const DashboardPage: React.FC = () => {
  const router = useRouter();

  const handleSearch = (term: string) => {
    if (term) {
      router.push(`/search?query=${encodeURIComponent(term)}`);
    }
  };

  return (
    <div className="w-full min-h-screen mx-auto bg-white text-black">
      <Header onSearch={handleSearch} placeholder="Search topic..." />

      {/* Main Content */}
      <main className="p-4 md:p-8 flex flex-col md:flex-row space-y-6 md:space-y-0 md:space-x-6">
        {/* Main Section */}
        <div className="flex-1 flex-col">
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
              Donald Trump has completed a stunning political comeback, and the
              United States has entered an uncertain new era...
            </p>
            <div className="flex space-x-4">
              {[...Array(3)].map((_, index) => (
                <div
                  key={index}
                  className="bg-white p-4 rounded-md shadow w-1/3"
                >
                  <Image
                    src="/bitewise_logo.png"
                    alt="Harris concedes"
                    width={160}
                    height={50}
                    className="object-cover rounded-lg mb-2"
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
              Nvidia, whose chips power AI systems and Bitcoin mining, surpassed
              Apple to become the world's most valuable company...
            </p>
          </section>
        </div>

        {/* Your + Local Topics */}
        <TopicsArticles />
      </main>
    </div>
  );
};

export default DashboardPage;
