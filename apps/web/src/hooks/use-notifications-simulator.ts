'use client';

import { useEffect } from 'react';
import { useNotificationsStore } from '@/stores/notifications-store';
import { useAuthStore } from '@/stores/auth-store';

/**
 * Hook para notificações reais do sistema.
 * 
 * NOTA: Este hook foi refatorado para remover dados mockados.
 * Em produção, as notificações devem vir de:
 * - WebSocket/SSE para alertas em tempo real
 * - Polling da API para novas entradas
 * - Push notifications do backend
 * 
 * Por enquanto, apenas exibe uma notificação de boas-vindas.
 * TODO: Implementar integração com WebSocket para notificações reais.
 */
export function useNotificationsSimulator() {
  const { addNotification } = useNotificationsStore();
  const { user } = useAuthStore();

  useEffect(() => {
    // Só exibe notificações para usuários PRO ou EXPERT
    if (!user || (user.plan !== 'PRO' && user.plan !== 'EXPERT')) return;

    // Notificação de boas-vindas (única notificação, sem dados mockados)
    const welcomeTimeout = setTimeout(() => {
      addNotification({
        type: 'info',
        title: 'Bem-vindo ao Expert Skills!',
        message: 'Acesse o Radar para ver partidas em tempo real.',
      });
    }, 3000);

    return () => {
      clearTimeout(welcomeTimeout);
    };
  }, [user, addNotification]);
}
