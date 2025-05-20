import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ThemeProvider";
import { Sun, Moon } from "lucide-react";
import { useLocation } from "wouter";

export function Header() {
  const { theme, setTheme } = useTheme();
  const [location] = useLocation();
  
  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };
  
  return (
    <header className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 py-4 px-4 sm:px-6 lg:px-8 sticky top-0 z-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Link href="/">
              <h1 className="text-2xl font-heading font-bold text-neutral-800 dark:text-neutral-100 cursor-pointer">
                Chat<span className="text-primary-500">Boot</span>
              </h1>
            </Link>
          </div>
          <nav className="hidden md:ml-8 md:flex md:space-x-6">
            <Link href="/">
              <a className={`${location === '/' ? 'text-primary-600 dark:text-primary-400' : 'text-neutral-600 dark:text-neutral-400'} hover:text-neutral-900 dark:hover:text-neutral-100 font-medium`}>
                Dashboard
              </a>
            </Link>
            <Link href="/#clients">
              <a className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 font-medium">
                Clientes
              </a>
            </Link>
            <Link href="/#settings">
              <a className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 font-medium">
                Configurações
              </a>
            </Link>
            <Link href="/#help">
              <a className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 font-medium">
                Ajuda
              </a>
            </Link>
          </nav>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
          >
            {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>
          <button type="button" className="hidden md:flex text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100">
            <i className="ri-notification-3-line text-xl"></i>
          </button>
          <div className="relative">
            <button type="button" className="flex items-center space-x-2 text-sm focus:outline-none">
              <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center text-white">
                <span className="font-medium">A</span>
              </div>
              <span className="hidden md:block font-medium text-neutral-700 dark:text-neutral-300">Admin</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
