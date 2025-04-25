import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Menu, X } from "lucide-react";
import { useState } from "react";
import { Theme } from "@/lib/utils";

interface NavbarProps {
  theme: Theme;
  toggleTheme: () => void;
}

export default function Navbar({ theme, toggleTheme }: NavbarProps) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const navItems = [
    { path: "/practice", label: "Practice", icon: "headphones" },
    { path: "/word-list", label: "Word List", icon: "list" },
    { path: "/settings", label: "Settings", icon: "cog" }
  ];

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4 max-w-4xl">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center">
            <h1 className="text-2xl font-bold text-primary dark:text-blue-400">
              <span className="hidden sm:inline">Mandarin Listening Practice</span>
              <span className="sm:hidden">MLP</span>
            </h1>
          </Link>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
            onClick={toggleMobileMenu}
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          {/* Desktop navigation */}
          <nav className="hidden md:flex space-x-4 items-center">
            {navItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <a className={`py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  location === item.path
                    ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-blue-400"
                    : "text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-blue-400"
                }`}>
                  <i className={`fas fa-${item.icon} mr-2`}></i>
                  {item.label}
                </a>
              </Link>
            ))}
            
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="ml-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </Button>
          </nav>
        </div>

        {/* Mobile navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden mt-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 pt-2">
            {navItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <a
                  className={`block py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    location === item.path
                      ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-blue-400"
                      : "text-gray-600 dark:text-gray-300"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <i className={`fas fa-${item.icon} mr-2`}></i>
                  {item.label}
                </a>
              </Link>
            ))}
            
            <div className="flex items-center mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  toggleTheme();
                  setMobileMenuOpen(false);
                }}
                className="rounded-md text-sm font-medium text-gray-600 dark:text-gray-300 flex items-center"
              >
                {theme === "dark" ? <Sun size={16} className="mr-2" /> : <Moon size={16} className="mr-2" />}
                {theme === "dark" ? "Light Mode" : "Dark Mode"}
              </Button>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
