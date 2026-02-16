'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { authApi } from '@/lib/api';
import { ArrowLeft, CheckCircle, Lock } from 'lucide-react';

function ResetarSenhaForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });

  if (!token) {
    return (
      <div className="space-y-4">
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
          Link de recuperação inválido. Solicite um novo link.
        </div>
        <Link href="/esqueci-senha">
          <Button variant="outline" className="w-full">
            Solicitar Novo Link
          </Button>
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (formData.password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    setIsLoading(true);

    try {
      await authApi.resetPassword({ token, password: formData.password });
      setSuccess(true);
      setTimeout(() => router.push('/login'), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao redefinir senha');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col items-center gap-3 p-6 rounded-lg bg-green-500/10 border border-green-500/20">
          <CheckCircle className="h-12 w-12 text-green-400" />
          <p className="text-green-400 text-sm text-center font-medium">
            Senha redefinida com sucesso!
          </p>
          <p className="text-zinc-500 text-xs text-center">
            Redirecionando para o login...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}
        
        <Input
          label="Nova Senha"
          type="password"
          placeholder="••••••••"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
        />
        
        <Input
          label="Confirmar Nova Senha"
          type="password"
          placeholder="••••••••"
          value={formData.confirmPassword}
          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
          required
        />
        
        <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
          <Lock className="h-4 w-4 mr-2" />
          Redefinir Senha
        </Button>
      </form>
      
      <div className="mt-6 text-center text-sm text-zinc-400">
        <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium inline-flex items-center gap-1">
          <ArrowLeft className="h-3 w-3" />
          Voltar ao Login
        </Link>
      </div>
    </>
  );
}

export default function ResetarSenhaPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0D0D0F] px-4">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-transparent" />
      
      <Card className="w-full max-w-md relative z-10">
        <CardHeader className="text-center">
          <Link href="/" className="inline-block mb-4">
            <h1 className="text-2xl font-bold">
              <span className="text-purple-500">Expert</span> Skills
            </h1>
          </Link>
          <CardTitle>Nova Senha</CardTitle>
          <CardDescription>Digite sua nova senha</CardDescription>
        </CardHeader>
        
        <CardContent>
          <Suspense fallback={<div className="text-center text-zinc-400">Carregando...</div>}>
            <ResetarSenhaForm />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
