'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/stores/auth-store';
import { authApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { User, Mail, Lock, Shield, Calendar, Crown, Check, Loader2, Eye, EyeOff } from 'lucide-react';

const planConfig = {
  FREE: { label: 'Free', color: 'bg-zinc-600', description: 'Plano gratuito' },
  BASICO: { label: 'Básico', color: 'bg-blue-600', description: 'Recursos básicos' },
  PRO: { label: 'Pro', color: 'bg-purple-600', description: 'Recursos avançados' },
  EXPERT: { label: 'Expert', color: 'bg-gradient-to-r from-purple-600 to-pink-600', description: 'Acesso completo' },
};

export default function PerfilPage() {
  const { user, setUser } = useAuthStore();
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isLoadingPassword, setIsLoadingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingProfile(true);
    setMessage(null);

    try {
      const { data } = await authApi.updateProfile({ name: profileForm.name });
      setUser(data.user);
      setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Erro ao atualizar perfil' });
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingPassword(true);
    setMessage(null);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'As senhas não coincidem' });
      setIsLoadingPassword(false);
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'A nova senha deve ter pelo menos 6 caracteres' });
      setIsLoadingPassword(false);
      return;
    }

    try {
      await authApi.updatePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setMessage({ type: 'success', text: 'Senha alterada com sucesso!' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Erro ao alterar senha' });
    } finally {
      setIsLoadingPassword(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const plan = planConfig[user?.plan || 'FREE'];

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <User className="h-8 w-8 text-purple-400" />
          Meu Perfil
        </h1>
        <p className="mt-2 text-zinc-400">Gerencie suas informações pessoais e segurança</p>
      </div>

      {/* Mensagem de feedback */}
      {message && (
        <div className={cn(
          'p-4 rounded-lg text-center',
          message.type === 'success' 
            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
            : 'bg-red-500/20 text-red-400 border border-red-500/30'
        )}>
          {message.text}
        </div>
      )}

      {/* Informações da Conta */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-purple-400" />
            Informações da Conta
          </CardTitle>
          <CardDescription>Detalhes da sua conta e plano atual</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-zinc-400 text-xs">Email</Label>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-zinc-800/50">
                <Mail className="h-4 w-4 text-zinc-500" />
                <span className="text-white">{user?.email}</span>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-zinc-400 text-xs">Membro desde</Label>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-zinc-800/50">
                <Calendar className="h-4 w-4 text-zinc-500" />
                <span className="text-white">{user?.createdAt ? formatDate(user.createdAt) : '-'}</span>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-zinc-400 text-xs">Plano Atual</Label>
            <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/50">
              <div className="flex items-center gap-3">
                <div className={cn('p-2 rounded-lg', plan.color)}>
                  <Crown className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-white">{plan.label}</p>
                  <p className="text-xs text-zinc-400">{plan.description}</p>
                </div>
              </div>
              {user?.plan !== 'EXPERT' && (
                <a href="/dashboard/planos">
                  <Button variant="outline" size="sm">
                    Fazer Upgrade
                  </Button>
                </a>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Editar Perfil */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-purple-400" />
            Editar Perfil
          </CardTitle>
          <CardDescription>Atualize suas informações pessoais</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                placeholder="Seu nome"
                className="bg-zinc-800/50"
              />
            </div>
            <Button type="submit" disabled={isLoadingProfile}>
              {isLoadingProfile ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  Salvar Alterações
                </span>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Alterar Senha */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-purple-400" />
            Alterar Senha
          </CardTitle>
          <CardDescription>Mantenha sua conta segura com uma senha forte</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Senha Atual</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  placeholder="Digite sua senha atual"
                  className="bg-zinc-800/50 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova Senha</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  placeholder="Digite a nova senha"
                  className="bg-zinc-800/50 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                placeholder="Confirme a nova senha"
                className="bg-zinc-800/50"
              />
            </div>

            <Button type="submit" disabled={isLoadingPassword}>
              {isLoadingPassword ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Alterando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Alterar Senha
                </span>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
