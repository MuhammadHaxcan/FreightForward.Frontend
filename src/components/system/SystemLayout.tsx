import { ReactNode, useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Button } from '../ui/button';
import { Loader2, Shield, Building2, Users, LogOut, FileText, ChevronDown, KeyRound } from 'lucide-react';
import { systemAdminAuthApi } from '../../services/api/systemAdmin';
import { getAccessToken, clearTokens } from '../../services/api/base';
import type { SystemAdminUser } from '../../types/auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

interface SystemLayoutProps {
  children: ReactNode;
}

export default function SystemLayout({ children }: SystemLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [admin, setAdmin] = useState<SystemAdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAdmin = async () => {
      const token = getAccessToken();
      if (!token) {
        navigate('/system/login', { replace: true });
        return;
      }

      const result = await systemAdminAuthApi.getCurrentAdmin();
      if (result.data) {
        setAdmin(result.data);
      } else {
        clearTokens();
        navigate('/system/login', { replace: true });
      }
      setIsLoading(false);
    };

    loadAdmin();
  }, [navigate]);

  const handleLogout = async () => {
    await systemAdminAuthApi.logout();
    navigate('/system/login', { replace: true });
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  const navItems = [
    { path: '/system/offices', label: 'Offices', icon: Building2 },
    { path: '/system/admins', label: 'Admins', icon: Users },
    { path: '/system/audit-logs', label: 'Audit Logs', icon: FileText },
    { path: '/system/reset-password', label: 'Reset Password', icon: KeyRound },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <header className="bg-purple-700 text-white shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <Link to="/system/offices" className="flex items-center gap-2 font-bold text-lg">
                <Shield className="h-6 w-6" />
                System Admin
              </Link>
              <nav className="hidden md:flex items-center gap-1">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path ||
                    (item.path !== '/system/offices' && location.pathname.startsWith(item.path));
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                        isActive
                          ? 'bg-purple-800 text-white'
                          : 'text-purple-100 hover:bg-purple-600'
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-white hover:bg-purple-600">
                    <span className="hidden sm:inline mr-2">{admin?.fullName}</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5 text-sm font-medium">{admin?.email}</div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <nav className="md:hidden bg-purple-600 px-4 py-2 flex gap-2 overflow-x-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== '/system/offices' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm whitespace-nowrap ${
                isActive
                  ? 'bg-purple-800 text-white'
                  : 'text-purple-100 hover:bg-purple-500'
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
