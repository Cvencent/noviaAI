import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PenLine } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/store/auth';

export const Register = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await authApi.register(formData);
      const token = response.token || (response as any).accessToken;
      setAuth(response.user, token);
      navigate('/projects');
    } catch (err: any) {
      setError(err.response?.data?.message || '注册失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-amber-50">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-200/30 rounded-full blur-3xl" />
      </div>
      
      <Card className="w-full max-w-md mx-4 relative z-10 shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-indigo-600 to-indigo-400 rounded-2xl flex items-center justify-center mb-4">
            <PenLine className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl">创建账号</CardTitle>
          <CardDescription>开始您的小说创作之旅</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}
            <Input
              label="昵称（可选）"
              type="text"
              placeholder="您的名字"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <Input
              label="邮箱"
              type="email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            <Input
              label="密码"
              type="password"
              placeholder="••••••••（至少6位）"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={6}
            />
            <Button type="submit" className="w-full" isLoading={isLoading}>
              注册
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-gray-600">
            已有账号？{' '}
            <Link to="/login" className="text-indigo-600 font-medium hover:text-indigo-700">
              立即登录
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
