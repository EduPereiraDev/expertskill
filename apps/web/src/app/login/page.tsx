'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/stores/auth-store';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(formData.email, formData.password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao fazer login');
    } finally {
      setIsLoading(false);
    }
  };

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
          <CardTitle>Bem-vindo de volta</CardTitle>
          <CardDescription>Entre com sua conta para continuar</CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}
            
            <Input
              label="Email"
              type="email"
              placeholder="seu@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            
            <Input
              label="Senha"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
            
            <div className="flex justify-end">
              <Link href="/esqueci-senha" className="text-sm text-purple-400 hover:text-purple-300">
                Esqueceu a senha?
              </Link>
            </div>

            <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
              Entrar
            </Button>
          </form>
          
          <div className="mt-6 text-center text-sm text-zinc-400">
            Não tem uma conta?{' '}
            <Link href="/registro" className="text-purple-400 hover:text-purple-300 font-medium">
              Criar conta
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
