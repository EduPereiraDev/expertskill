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
  LucideIcon
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  plan?: string;
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Controle de Banca', href: '/dashboard/banca', icon: Wallet },
  { name: 'Radar', href: '/dashboard/radar', icon: Radio, plan: 'PRO' },
  { name: 'Entradas Expert', href: '/dashboard/entradas', icon: Zap, plan: 'EXPERT' },
  { name: 'Histórico', href: '/dashboard/historico', icon: History },
];

const planBadge: Record<string, string> = {
  FREE: 'bg-zinc-700 text-zinc-300',
  BASICO: 'bg-blue-600 text-white',
  PRO: 'bg-purple-600 text-white',
  EXPERT: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white',
};

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-zinc-800 bg-zinc-900/95 backdrop-blur-sm">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center border-b border-zinc-800 px-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-xl font-bold">
              <span className="text-purple-500">Expert</span> Skills
            </span>
          </Link>
        </div>

        {/* User Info */}
        <div className="border-b border-zinc-800 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-600 text-white font-semibold">
              {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.name || user?.email}
              </p>
              <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium', planBadge[user?.plan || 'FREE'])}>
                {user?.plan || 'FREE'}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const isLocked = item.plan && user?.plan === 'FREE';
            
            return (
              <Link
                key={item.name}
                href={isLocked ? '/dashboard/planos' : item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-purple-600/20 text-purple-400'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-white',
                  isLocked && 'opacity-50'
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="flex-1">{item.name}</span>
                {item.plan && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500">
                    {item.plan}+
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Upgrade CTA */}
        {user?.plan === 'FREE' && (
          <div className="p-4">
            <Link
              href="/dashboard/planos"
              className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-3 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
            >
              <Crown className="h-4 w-4" />
              Seja PRO
            </Link>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-zinc-800 p-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all"
          >
            <LogOut className="h-5 w-5" />
            <span>Sair</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
