'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { authApi } from '@/lib/api';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';

export default function EsqueciSenhaPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await authApi.forgotPassword({ email });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao enviar email de recuperação');
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
          <CardTitle>Recuperar Senha</CardTitle>
          <CardDescription>
            {success 
              ? 'Verifique sua caixa de entrada' 
              : 'Digite seu email para receber o link de recuperação'}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {success ? (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-3 p-6 rounded-lg bg-green-500/10 border border-green-500/20">
                <CheckCircle className="h-12 w-12 text-green-400" />
                <p className="text-green-400 text-sm text-center">
                  Se o email <strong>{email}</strong> estiver cadastrado, você receberá um link de recuperação em instantes.
                </p>
                <p className="text-zinc-500 text-xs text-center">
                  Verifique também a pasta de spam.
                </p>
              </div>
              
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar ao Login
                </Button>
              </Link>
            </div>
          ) : (
            <>
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                
                <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
                  <Mail className="h-4 w-4 mr-2" />
                  Enviar Link de Recuperação
                </Button>
              </form>
              
              <div className="mt-6 text-center text-sm text-zinc-400">
                <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium inline-flex items-center gap-1">
                  <ArrowLeft className="h-3 w-3" />
                  Voltar ao Login
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
