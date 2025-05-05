import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="py-6">
      <div className="max-w-3xl mx-auto text-center mb-12 relative">
        {/* Bamboo decorations on left and right sides */}
        <div className="hidden md:block absolute left-0 top-0 h-full opacity-80" style={{ transform: 'translateX(-120%)' }}>
          <svg width="60" height="300" viewBox="0 0 60 300" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Bamboo stalk */}
            <rect x="27" y="0" width="6" height="300" fill="#4CAF50" />
            
            {/* Bamboo nodes */}
            <ellipse cx="30" cy="30" rx="10" ry="4" fill="#388E3C" />
            <ellipse cx="30" cy="80" rx="10" ry="4" fill="#388E3C" />
            <ellipse cx="30" cy="130" rx="10" ry="4" fill="#388E3C" />
            <ellipse cx="30" cy="180" rx="10" ry="4" fill="#388E3C" />
            <ellipse cx="30" cy="230" rx="10" ry="4" fill="#388E3C" />
            <ellipse cx="30" cy="280" rx="10" ry="4" fill="#388E3C" />
            
            {/* Bamboo leaves */}
            <path d="M35 25C50 15 60 20 60 25C60 30 40 35 35 25Z" fill="#66BB6A" />
            <path d="M32 75C50 60 55 70 52 75C45 80 35 80 32 75Z" fill="#66BB6A" />
            <path d="M35 125C55 115 58 125 55 130C50 135 38 135 35 125Z" fill="#66BB6A" />
            <path d="M35 175C50 160 60 170 58 180C55 190 35 185 35 175Z" fill="#66BB6A" />
            <path d="M33 225C45 210 55 215 52 225C48 235 33 235 33 225Z" fill="#66BB6A" />
          </svg>
        </div>
        
        <div className="hidden md:block absolute right-0 top-0 h-full opacity-80" style={{ transform: 'translateX(120%) scaleX(-1)' }}>
          <svg width="60" height="300" viewBox="0 0 60 300" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Bamboo stalk */}
            <rect x="27" y="0" width="6" height="300" fill="#4CAF50" />
            
            {/* Bamboo nodes */}
            <ellipse cx="30" cy="30" rx="10" ry="4" fill="#388E3C" />
            <ellipse cx="30" cy="80" rx="10" ry="4" fill="#388E3C" />
            <ellipse cx="30" cy="130" rx="10" ry="4" fill="#388E3C" />
            <ellipse cx="30" cy="180" rx="10" ry="4" fill="#388E3C" />
            <ellipse cx="30" cy="230" rx="10" ry="4" fill="#388E3C" />
            <ellipse cx="30" cy="280" rx="10" ry="4" fill="#388E3C" />
            
            {/* Bamboo leaves */}
            <path d="M35 25C50 15 60 20 60 25C60 30 40 35 35 25Z" fill="#66BB6A" />
            <path d="M32 75C50 60 55 70 52 75C45 80 35 80 32 75Z" fill="#66BB6A" />
            <path d="M35 125C55 115 58 125 55 130C50 135 38 135 35 125Z" fill="#66BB6A" />
            <path d="M35 175C50 160 60 170 58 180C55 190 35 185 35 175Z" fill="#66BB6A" />
            <path d="M33 225C45 210 55 215 52 225C48 235 33 235 33 225Z" fill="#66BB6A" />
          </svg>
        </div>
        
        {/* Small bamboo decoration on top of the title */}
        <div className="mx-auto w-fit mb-6">
          <svg width="120" height="40" viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Bamboo stalks */}
            <rect x="30" y="0" width="4" height="40" fill="#4CAF50" />
            <rect x="60" y="5" width="4" height="35" fill="#4CAF50" />
            <rect x="90" y="2" width="4" height="38" fill="#4CAF50" />
            
            {/* Bamboo nodes */}
            <ellipse cx="32" cy="10" rx="7" ry="2" fill="#388E3C" />
            <ellipse cx="32" cy="25" rx="7" ry="2" fill="#388E3C" />
            <ellipse cx="62" cy="15" rx="7" ry="2" fill="#388E3C" />
            <ellipse cx="62" cy="30" rx="7" ry="2" fill="#388E3C" />
            <ellipse cx="92" cy="12" rx="7" ry="2" fill="#388E3C" />
            <ellipse cx="92" cy="28" rx="7" ry="2" fill="#388E3C" />
            
            {/* Bamboo leaves */}
            <path d="M36 8C45 3 50 5 50 8C50 11 41 13 36 8Z" fill="#66BB6A" />
            <path d="M66 13C75 8 80 10 80 13C80 16 71 18 66 13Z" fill="#66BB6A" />
            <path d="M96 10C105 5 110 7 110 10C110 13 101 15 96 10Z" fill="#66BB6A" />
            <path d="M28 28C19 23 15 25 15 28C15 31 23 33 28 28Z" fill="#66BB6A" />
            <path d="M58 33C49 28 45 30 45 33C45 36 53 38 58 33Z" fill="#66BB6A" />
            <path d="M88 31C79 26 75 28 75 31C75 34 83 36 88 31Z" fill="#66BB6A" />
          </svg>
        </div>
        
        <h1 className="text-5xl font-extrabold mb-6 text-primary">
          Mandarin Practice
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
          Improve your Mandarin comprehension one sentence at a time
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="bg-primary hover:bg-blue-600">
            <Link href="/practice">
              Start Practicing
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/word-list">
              Manage Word List
            </Link>
          </Button>
        </div>
        
        {/* Bamboo decoration at the bottom */}
        <div className="mt-10 mx-auto w-fit opacity-80">
          <svg width="200" height="30" viewBox="0 0 200 30" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 15 H190" stroke="#388E3C" strokeWidth="1.5" strokeDasharray="8 4" />
            <path d="M20 5 Q100 25 180 5" stroke="#4CAF50" strokeWidth="1.5" strokeDasharray="6 3" />
            <path d="M20 25 Q100 5 180 25" stroke="#4CAF50" strokeWidth="1.5" strokeDasharray="6 3" />
            
            {/* Bamboo leaf decorations */}
            <path d="M15 15C5 10 0 12 0 15C0 18 10 20 15 15Z" fill="#66BB6A" fillOpacity="0.7" />
            <path d="M185 15C195 10 200 12 200 15C200 18 190 20 185 15Z" fill="#66BB6A" fillOpacity="0.7" />
            <path d="M100 20C110 15 115 17 115 20C115 23 105 25 100 20Z" fill="#66BB6A" fillOpacity="0.7" />
            <path d="M100 10C90 5 85 7 85 10C85 13 95 15 100 10Z" fill="#66BB6A" fillOpacity="0.7" />
          </svg>
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
