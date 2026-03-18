'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import { 
  LayoutDashboard, 
  Wallet, 
  Radio, 
  Zap, 
  History, 
  LogOut,
  Crown,
  Menu,
  X,
  ChevronDown,
  User,
  BarChart3,
  Activity
} from 'lucide-react';
import { useState } from 'react';
import { NotificationsDropdown } from '@/components/notifications/notifications-dropdown';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  plan?: string;
}

const navigation: NavItem[] = [
  { name: 'Início', href: '/dashboard', icon: LayoutDashboard },
  { name: 'eSoccer', href: '/dashboard/esoccer', icon: Activity },
  { name: 'Banca', href: '/dashboard/banca', icon: Wallet },
  { name: 'Radar', href: '/dashboard/radar', icon: Radio, plan: 'PRO' },
  { name: 'Entradas', href: '/dashboard/entradas', icon: Zap, plan: 'EXPERT' },
  { name: 'Histórico', href: '/dashboard/historico', icon: History },
];

const planColors: Record<string, string> = {
  FREE: 'bg-zinc-600 text-zinc-200',
  BASICO: 'bg-blue-600 text-white',
  PRO: 'bg-purple-600 text-white',
  EXPERT: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white',
};

export function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  const canAccess = (plan?: string) => {
    if (!plan) return true;
    if (user?.plan === 'EXPERT') return true;
    if (user?.plan === 'PRO' && plan === 'PRO') return true;
    return false;
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-900/95 backdrop-blur-md border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
            <span className="text-xl font-bold">
              <span className="text-purple-400">Expert</span>
              <span className="text-white">Skills</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-6 flex-1 justify-center">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const hasAccess = canAccess(item.plan);
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.name}
                  href={hasAccess ? item.href : '/dashboard/planos'}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
                    isActive
                      ? 'bg-purple-600/20 text-purple-400'
                      : 'text-zinc-400 hover:bg-zinc-800 hover:text-white',
                    !hasAccess && 'opacity-60'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                  {item.plan && !hasAccess && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-700 text-zinc-400">
                      {item.plan}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Notifications */}
            <NotificationsDropdown />

            {/* Upgrade Button (for FREE users) */}
            {user?.plan === 'FREE' && (
              <Link
                href="/dashboard/planos"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <Crown className="h-4 w-4" />
                <span>Upgrade</span>
              </Link>
            )}

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                  {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="hidden sm:flex flex-col items-start">
                  <p className="text-sm font-medium text-white truncate max-w-[100px]">
                    {user?.name || user?.email?.split('@')[0]}
                  </p>
                </div>
                <span className={cn('hidden sm:inline-flex text-[10px] px-2 py-0.5 rounded-full font-medium', planColors[user?.plan || 'FREE'])}>
                  {user?.plan || 'FREE'}
                </span>
                <ChevronDown className={cn('h-4 w-4 text-zinc-400 transition-transform', userMenuOpen && 'rotate-180')} />
              </button>

              {/* Dropdown */}
              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-56 rounded-lg bg-zinc-800 border border-zinc-700 shadow-xl z-20">
                    <div className="p-3 border-b border-zinc-700">
                      <p className="text-sm font-medium text-white">{user?.name || 'Usuário'}</p>
                      <p className="text-xs text-zinc-400 truncate">{user?.email}</p>
                    </div>
                    <div className="p-2">
                      <Link
                        href="/dashboard/perfil"
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-zinc-300 hover:bg-zinc-700 transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <User className="h-4 w-4" />
                        <span>Meu Perfil</span>
                      </Link>
                      <Link
                        href="/dashboard/planos"
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-zinc-300 hover:bg-zinc-700 transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Crown className="h-4 w-4" />
                        <span>Planos</span>
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-zinc-700 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Sair</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-zinc-800 transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6 text-zinc-400" />
              ) : (
                <Menu className="h-6 w-6 text-zinc-400" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-800 bg-zinc-900">
          <div className="px-4 py-3 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const hasAccess = canAccess(item.plan);
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.name}
                  href={hasAccess ? item.href : '/dashboard/planos'}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all',
                    isActive
                      ? 'bg-purple-600/20 text-purple-400'
                      : 'text-zinc-400 hover:bg-zinc-800 hover:text-white',
                    !hasAccess && 'opacity-60'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="flex-1">{item.name}</span>
                  {item.plan && !hasAccess && (
                    <span className="text-xs px-2 py-0.5 rounded bg-zinc-700 text-zinc-400">
                      {item.plan}
                    </span>
                  )}
                </Link>
              );
            })}
            
            {user?.plan === 'FREE' && (
              <Link
                href="/dashboard/planos"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 mt-3 px-4 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-medium"
              >
                <Crown className="h-4 w-4" />
                <span>Fazer Upgrade</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
