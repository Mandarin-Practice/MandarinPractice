import { Route, Switch } from "wouter";
import Home from "@/pages/home";
import Practice from "@/pages/practice"; 
import WordList from "@/pages/word-list";
import WordDetail from "@/pages/word-detail";
import Settings from "@/pages/settings";
import CharacterDictionary from "@/pages/character-dictionary";
import DictionaryAdmin from "@/pages/dictionary-admin";
import Profile from "@/pages/profile";
import LeaderboardPage from "@/pages/leaderboard-page";
import AuthPage from "@/pages/auth-page";
import Navbar from "@/components/navbar";
import NotFound from "@/pages/not-found";
import { useEffect, useState } from "react";
import { Theme } from "@/lib/utils";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/components/protected-route";

function App() {
  const [theme, setTheme] = useState<Theme>(() => {
    // Check localStorage or default to light mode
    const savedTheme = localStorage.getItem("theme") as Theme | null;
    if (savedTheme) return savedTheme;
    
    // Always default to light mode
    return "light";
  });

  useEffect(() => {
    // Update the DOM based on the current theme
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    
    // Save to localStorage
    localStorage.setItem("theme", theme);
  }, [theme]);
  
  // Initialize light mode on first load
  useEffect(() => {
    // Set initial light mode
    const root = window.document.documentElement;
    root.classList.remove("dark");
    root.classList.add("light");
    
    // Clear any previous theme in localStorage if app is being loaded fresh
    if (!localStorage.getItem("theme")) {
      localStorage.setItem("theme", "light");
    }
  }, []);

  const toggleTheme = () => {
    setTheme((prev: Theme) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100 overflow-visible">
        <Navbar theme={theme} toggleTheme={toggleTheme} />
        <main className="container mx-auto px-4 py-8 max-w-4xl overflow-visible">
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/auth" component={AuthPage} />
            <ProtectedRoute path="/practice" component={Practice} />
            <ProtectedRoute path="/word-list" component={WordList} />
            <ProtectedRoute path="/word/:id" component={WordDetail} />
            <ProtectedRoute path="/dictionary" component={CharacterDictionary} />
            <ProtectedRoute path="/dictionary/admin" component={DictionaryAdmin} />
            <ProtectedRoute path="/leaderboard" component={LeaderboardPage} />
            <ProtectedRoute path="/settings" component={Settings} />
            <ProtectedRoute path="/profile" component={Profile} />
            <Route component={NotFound} />
          </Switch>
        </main>
        <footer className="mt-12 text-center text-gray-500 dark:text-gray-400 text-sm pb-8">
          <p>Mandarin Listening Practice &copy; {new Date().getFullYear()}</p>
          <p className="mt-1">Built to help you improve your Mandarin comprehension skills</p>
        </footer>
      </div>
    </AuthProvider>
  );
}

export default App;
