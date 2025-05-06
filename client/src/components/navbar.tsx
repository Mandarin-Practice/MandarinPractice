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
    { path: "/word-list", label: "Words", icon: "list" },
    { path: "/dictionary", label: "Dictionary", icon: "book" },
    { path: "/settings", label: "Settings", icon: "cog" }
  ];

  return (
    <header className="opaque-header shadow-md sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4 max-w-5xl">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center">
            <h1 className="text-2xl font-bold text-white">
              <span className="hidden sm:inline">Mandarin Practice</span>
              <span className="sm:hidden">Mandarin</span>
            </h1>
          </Link>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-md border border-white text-white"
            onClick={toggleMobileMenu}
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          {/* Desktop navigation */}
          <nav className="hidden md:flex space-x-4 items-center">
            {navItems.map((item) => (
              <Link key={item.path} href={item.path} className={`py-2 px-4 rounded-md text-sm font-medium transition-colors border ${
                location === item.path
                  ? "bg-white text-red-600 border-white font-bold"
                  : "bg-transparent text-white border-white hover:bg-white hover:text-red-600"
              }`}>
                {item.label}
              </Link>
            ))}
            
            <Button
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              className="ml-2 rounded-md border-white text-white hover:bg-white hover:text-red-600"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </Button>
          </nav>
        </div>

        {/* Mobile navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden mt-4 border-t border-white pt-2 bg-transparent">
            {navItems.map((item) => (
              <Link 
                key={item.path} 
                href={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block py-2 px-4 my-2 rounded-md text-sm font-medium transition-colors border ${
                  location === item.path
                    ? "bg-white text-red-600 border-white font-bold"
                    : "bg-transparent text-white border-white hover:bg-white hover:text-red-600"
                }`}
              >
                {item.label}
              </Link>
            ))}
            
            <div className="flex items-center justify-center mt-2 pt-2 border-t border-white pb-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  toggleTheme();
                  setMobileMenuOpen(false);
                }}
                className="rounded-md text-sm font-medium border-white text-white hover:bg-white hover:text-red-600 flex items-center"
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
