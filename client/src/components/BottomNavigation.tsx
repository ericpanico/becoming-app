import { Home, Book, TrendingUp, Settings } from 'lucide-react';
import { useLocation } from 'wouter';

interface BottomNavigationProps {
  onSettingsClick: () => void;
}

export function BottomNavigation({ onSettingsClick }: BottomNavigationProps) {
  const [location, setLocation] = useLocation();

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/stories', icon: Book, label: 'Stories' },
    { path: '/insights', icon: TrendingUp, label: 'Insights' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-100 z-40">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-around py-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            
            return (
              <button
                key={item.path}
                onClick={() => setLocation(item.path)}
                className={`flex flex-col items-center space-y-1 p-2 transition-colors ${
                  isActive ? 'text-primary' : 'text-neutral-500 hover:text-primary'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{item.label}</span>
              </button>
            );
          })}
          
          <button
            onClick={onSettingsClick}
            className="flex flex-col items-center space-y-1 p-2 text-neutral-500 hover:text-primary transition-colors"
          >
            <Settings className="w-5 h-5" />
            <span className="text-xs">Settings</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
