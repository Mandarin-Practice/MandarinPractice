import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import chineseBg from "@/assets/chinese-bg.svg";

export default function Home() {
  return (
    <div className="py-6">
      <div 
        className="max-w-4xl mx-auto text-center mb-12 relative overflow-hidden rounded-xl"
        style={{
          background: 'linear-gradient(135deg, #FFF5E4 0%, #FFE3E1 100%)',
          backgroundImage: 'radial-gradient(circle at 25px 25px, rgba(255, 0, 0, 0.1) 2%, transparent 0%), linear-gradient(135deg, #FFF5E4 0%, #FFE3E1 100%)',
          backgroundSize: '50px 50px, 100% 100%',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}
      >
        {/* Bamboo decorations */}
        <div className="absolute -left-6 md:-left-12 top-1/2 transform -translate-y-1/2 z-30">
          <img 
            src="/images/bamboo-new.png" 
            alt="Bamboo decoration" 
            className="h-96 md:h-[28rem]"
            style={{ filter: 'drop-shadow(2px 4px 6px rgba(0, 0, 0, 0.3))' }}
          />
        </div>
        
        <div className="absolute -right-6 md:-right-12 top-1/2 transform -translate-y-1/2 scale-x-[-1] z-30">
          <img 
            src="/images/bamboo-new2.png" 
            alt="Bamboo decoration" 
            className="h-96 md:h-[28rem]"
            style={{ filter: 'drop-shadow(-2px 4px 6px rgba(0, 0, 0, 0.3))' }}
          />
        </div>
        
        {/* Content Container */}
        <div className="relative z-20 py-12 px-8">
          <div className="max-w-2xl mx-auto bg-white/95 dark:bg-gray-800/95 p-8 md:p-12 rounded-lg shadow-xl backdrop-blur-sm border border-red-200 dark:border-red-900">
            {/* Panda image at top */}
            <div className="mx-auto w-fit mt-2 mb-6">
              <div className="bg-white dark:bg-gray-800 p-3 rounded-full shadow-lg border-2 border-red-500">
                <img 
                  src="/images/cute-panda.png" 
                  alt="Cute Panda Logo" 
                  className="h-32 w-32 drop-shadow-xl object-contain"
                  style={{ filter: 'drop-shadow(0px 10px 8px rgba(0, 0, 0, 0.2))' }}
                />
              </div>
            </div>
            
            {/* Title */}
            <div className="relative inline-block">
              <h1 className="text-5xl font-extrabold mb-8 text-primary">
                Mandarin Practice
              </h1>
            </div>
            
            <p className="text-xl text-gray-900 dark:text-gray-100 mb-10 font-semibold max-w-xl mx-auto">
              Improve your Mandarin Chinese comprehension and vocabulary one sentence at a time
            </p>
            
            {/* Buttons with our new styles */}
            <div className="flex flex-col sm:flex-row gap-5 justify-center mb-8">
              <Link href="/practice">
                <button className="btn-red px-8 py-4 text-lg shadow-lg">
                  Start Practicing
                </button>
              </Link>
              <Link href="/word-list">
                <button className="btn-red-outline px-8 py-4 text-lg">
                  Manage Word List
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        <div className="card-custom p-6">
          <div className="border-b border-red-200 dark:border-red-800 pb-3 mb-3">
            <h3 className="text-xl font-bold text-primary">Step 1: Add Words</h3>
          </div>
          <p className="text-gray-900 dark:text-gray-200 font-medium">
            Input your Mandarin vocabulary words that you want to practice with.
          </p>
        </div>

        <div className="card-custom p-6">
          <div className="border-b border-red-200 dark:border-red-800 pb-3 mb-3">
            <h3 className="text-xl font-bold text-primary">Step 2: Generate Sentences</h3>
          </div>
          <p className="text-gray-900 dark:text-gray-200 font-medium">
            The app uses AI to create natural Mandarin sentences using only your vocabulary.
          </p>
        </div>

        <div className="card-custom p-6">
          <div className="border-b border-red-200 dark:border-red-800 pb-3 mb-3">
            <h3 className="text-xl font-bold text-primary">Step 3: Practice Listening</h3>
          </div>
          <p className="text-gray-900 dark:text-gray-200 font-medium">
            Listen to sentences spoken aloud and test your comprehension by translating.
          </p>
        </div>
      </div>

      <div className="mt-16 card-custom p-8 text-center">
        <h2 className="text-2xl font-bold mb-6 text-primary">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left mt-6">
          <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-lg border border-red-200 dark:border-red-900">
            <h3 className="text-lg font-bold mb-2 text-primary">Smart Sentence Generation</h3>
            <p className="text-gray-900 dark:text-gray-200 font-medium">
              Our app uses AI to create grammatically correct Mandarin sentences that use
              only the vocabulary words you've provided, helping you practice with relevant content.
            </p>
          </div>
          <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-lg border border-red-200 dark:border-red-900">
            <h3 className="text-lg font-bold mb-2 text-primary">Real-time Feedback</h3>
            <p className="text-gray-900 dark:text-gray-200 font-medium">
              As you type translations, the app provides instant color-coded feedback,
              showing you what's correct, partially correct, or incorrect.
            </p>
          </div>
          <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-lg border border-red-200 dark:border-red-900">
            <h3 className="text-lg font-bold mb-2 text-primary">Progress Tracking</h3>
            <p className="text-gray-900 dark:text-gray-200 font-medium">
              Track your progress with detailed statistics on accuracy, response time,
              and vocabulary mastery to see your improvement over time.
            </p>
          </div>
          <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-lg border border-red-200 dark:border-red-900">
            <h3 className="text-lg font-bold mb-2 text-primary">Customizable Settings</h3>
            <p className="text-gray-900 dark:text-gray-200 font-medium">
              Adjust difficulty levels, speech rate, and scoring parameters to create
              a personalized learning experience that matches your proficiency level.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
