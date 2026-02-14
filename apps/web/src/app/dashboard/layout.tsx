'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { ParticlesBackground } from '@/components/ui/particles-background';
import { useAuthStore } from '@/stores/auth-store';
import { useNotificationsSimulator } from '@/hooks/use-notifications-simulator';
import { ConfirmProvider } from '@/components/ui/confirm-dialog';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();

  // Ativar simulador de notificações para usuários PRO/EXPERT
  useNotificationsSimulator();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0D0D0F]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
          <p className="text-zinc-400">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <ConfirmProvider>
      <div className="min-h-screen bg-[#0D0D0F] relative">
        <ParticlesBackground />
        <Navbar />
        <main className="pt-16 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </ConfirmProvider>
  );
}
