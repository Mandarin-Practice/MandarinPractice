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
          backgroundImage: `url(${chineseBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}
      >
        {/* Semi-transparent overlay to improve text readability */}
        <div className="absolute inset-0 bg-white/30 dark:bg-black/30 backdrop-blur-[2px] z-10"></div>
        
        {/* Bamboo decorations */}
        <div className="absolute left-6 top-1/2 transform -translate-y-1/2 hidden md:block z-20">
          <img src="/images/bamboo.png" alt="Bamboo decoration" className="h-80 opacity-60" />
        </div>
        
        <div className="absolute right-6 top-1/2 transform -translate-y-1/2 scale-x-[-1] hidden md:block z-20">
          <img src="/images/bamboo.png" alt="Bamboo decoration" className="h-80 opacity-60" />
        </div>
        
        {/* Content Container */}
        <div className="relative z-20 py-12 px-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-10 max-w-2xl mx-auto transform translate-y-4 border border-gray-100 dark:border-gray-700">
            {/* Panda image at top */}
            <div className="mx-auto w-fit -mt-24 mb-6">
              <img 
                src="/images/cute-panda.png" 
                alt="Cute Panda Logo" 
                className="h-32 w-32 drop-shadow-xl object-contain"
                style={{ filter: 'drop-shadow(0px 10px 8px rgba(0, 0, 0, 0.2))' }}
              />
            </div>
            
            {/* Title with Chinese Label */}
            <div className="relative inline-block">
              <h1 className="text-5xl font-extrabold mb-8 text-primary">
                Mandarin Practice
              </h1>
              <span className="absolute -top-3 -right-6 text-sm bg-red-600 text-white px-3 py-1 rounded-full transform rotate-12 font-bold shadow-md">
                中文
              </span>
            </div>
            
            <p className="text-xl text-gray-700 dark:text-gray-300 mb-10 font-medium max-w-xl mx-auto">
              Improve your Mandarin Chinese comprehension and vocabulary one sentence at a time
            </p>
            
            {/* Buttons with improved styling */}
            <div className="flex flex-col sm:flex-row gap-5 justify-center mb-8">
              <Button asChild size="lg" className="bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg rounded-full px-8 py-6 text-lg">
                <Link href="/practice">
                  Start Practicing
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 font-bold rounded-full px-8 py-6 text-lg">
                <Link href="/word-list">
                  Manage Word List
                </Link>
              </Button>
            </div>
            
            {/* Chinese characters for decoration */}
            <div className="flex justify-center space-x-8 mt-4 text-2xl text-red-400 dark:text-red-300 font-bold">
              <span className="transform hover:scale-110 transition-transform cursor-default" title="Study">学习</span>
              <span className="transform hover:scale-110 transition-transform cursor-default" title="Practice">练习</span>
              <span className="transform hover:scale-110 transition-transform cursor-default" title="Master">掌握</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">Step 1: Add Words</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400">
              Input your Mandarin vocabulary words that you want to practice with.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">Step 2: Generate Sentences</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400">
              The app uses AI to create natural Mandarin sentences using only your vocabulary.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">Step 3: Practice Listening</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400">
              Listen to sentences spoken aloud and test your comprehension by translating.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-16 bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left mt-6">
          <div>
            <h3 className="text-lg font-bold mb-2 text-primary">Smart Sentence Generation</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Our app uses AI to create grammatically correct Mandarin sentences that use
              only the vocabulary words you've provided, helping you practice with relevant content.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-bold mb-2 text-primary">Real-time Feedback</h3>
            <p className="text-gray-600 dark:text-gray-400">
              As you type translations, the app provides instant color-coded feedback,
              showing you what's correct, partially correct, or incorrect.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-bold mb-2 text-primary">Progress Tracking</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Track your progress with detailed statistics on accuracy, response time,
              and vocabulary mastery to see your improvement over time.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-bold mb-2 text-primary">Customizable Settings</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Adjust difficulty levels, speech rate, and scoring parameters to create
              a personalized learning experience that matches your proficiency level.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
