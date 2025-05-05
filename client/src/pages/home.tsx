import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import bambooSimple from "@/assets/bamboo-simple.svg";
import panda from "@/assets/panda.svg";

export default function Home() {
  return (
    <div className="py-6">
      <div 
        className="max-w-3xl mx-auto text-center mb-12 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
          borderRadius: '1rem',
          padding: '2rem',
          boxShadow: '0 10px 25px rgba(0,0,0,0.08)'
        }}
      >
        {/* Background patterns */}
        <div className="absolute inset-0 z-0 opacity-5">
          <div className="absolute top-0 left-0 w-full h-full" 
               style={{
                 backgroundImage: "radial-gradient(circle, #4CAF50 1px, transparent 1px)",
                 backgroundSize: "20px 20px"
               }} />
        </div>
        
        {/* Bamboo decorations on left and right sides */}
        <div className="hidden md:block absolute left-0 top-0 h-full z-10 opacity-70" style={{ transform: 'translateX(-40%)' }}>
          <img src={bambooSimple} alt="Bamboo decoration" className="h-full" style={{ maxWidth: '100px' }} />
        </div>
        
        <div className="hidden md:block absolute right-0 top-0 h-full z-10 opacity-70" style={{ transform: 'translateX(40%)' }}>
          <img src={bambooSimple} alt="Bamboo decoration" className="h-full" style={{ maxWidth: '100px' }} />
        </div>
        
        {/* Main content */}
        <div className="relative z-20 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
          {/* Panda at the top */}
          <div className="mx-auto w-fit mb-6">
            <img src={panda} alt="Panda" className="h-32 transform -translate-y-16 mb-[-3rem]" />
          </div>
          
          <h1 className="text-5xl font-extrabold mb-6 text-primary relative">
            Mandarin Practice
            <span className="absolute -top-3 -right-3 text-xs bg-red-500 text-white px-2 py-1 rounded-full transform rotate-12">中文</span>
          </h1>
          
          <p className="text-xl text-gray-700 dark:text-gray-300 mb-8 font-medium">
            Improve your Mandarin comprehension one sentence at a time
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-4">
            <Button asChild size="lg" className="bg-primary hover:bg-blue-600 text-white font-bold shadow-md">
              <Link href="/practice">
                Start Practicing
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-primary hover:bg-primary/10 font-bold">
              <Link href="/word-list">
                Manage Word List
              </Link>
            </Button>
          </div>
          
          {/* Chinese characters for decoration */}
          <div className="flex justify-center space-x-4 mt-6 text-2xl text-gray-400 dark:text-gray-600 font-bold">
            <span>学习</span>
            <span>练习</span>
            <span>掌握</span>
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
