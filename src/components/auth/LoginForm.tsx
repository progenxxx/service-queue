'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import logoImage from '@/assets/images/logo.png';

function LoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [loginType, setLoginType] = useState('credentials');
  const [imageError, setImageError] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const data = loginType === 'code' 
      ? { loginCode: formData.get('loginCode') }
      : { 
          email: formData.get('email'),
          password: formData.get('password')
        };

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Login failed');
      }

      const userRole = result.user.role;
      if (userRole === 'super_admin') {
        router.push('/admin');
      } else if (userRole === 'agent') {
        router.push('/agent');
      } else {
        router.push('/customer');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      <div className="bg-[#087055] text-white py-8 w-full">
        <h1 className="text-center text-2xl font-bold">Service Queue</h1>
      </div>
      
      <div className="w-full min-h-[calc(100vh-80px)] flex flex-col items-center justify-start pt-16">
        <div className="mb-8">
          {!imageError ? (
            <img
              src={typeof logoImage === 'string' ? logoImage : logoImage.src}
              alt="Community Insurance Center"
              width={200}
              height={100}
              className="h-auto"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-[200px] h-[100px] bg-gray-200 flex items-center justify-center rounded-lg">
              <span className="text-gray-500 text-sm">Community Insurance Center</span>
            </div>
          )}
        </div>

        <div className="w-full max-w-md px-4 py-3">
          <div className="flex justify-center mb-4">
            <button
                type="button"
                onClick={() => setLoginType('code')}
                className={`flex-1 py-4 text-center text-sm font-medium transition-colors relative ${
                  loginType === 'code'
                    ? 'text-gray-900 bg-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                User
                {loginType === 'code' && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-36 h-2 rounded-t-lg bg-[#087055]"></div>
                )}
              </button>
              <button
                type="button"
                onClick={() => setLoginType('credentials')}
                className={`flex-1 py-4 text-center text-sm font-medium transition-colors relative ${
                  loginType === 'credentials'
                    ? 'text-gray-900 bg-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Admin
                {loginType === 'credentials' && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-36 h-2 rounded-t-lg bg-[#087055]"></div>
                )}
              </button>
          </div>

          <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {loginType === 'code' ? (
                  <div>
                    <Label htmlFor="loginCode" className="block text-sm font-medium text-gray-700 mb-2">
                      Login Code
                    </Label>
                    <Input
                      id="loginCode"
                      name="loginCode"
                      type="text"
                      placeholder="••••••••••"
                      required
                      disabled={isLoading}
                      className="w-full h-12 px-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#087055] focus:border-[#087055]"
                    />
                  </div>
                ) : (
                  <>
                    <div>
                      <Label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="name@communityinscenter.net"
                        required
                        disabled={isLoading}
                        className="w-full h-12 px-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#087055] focus:border-[#087055]"
                      />
                    </div>
                    <div>
                      <Label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                        Code
                      </Label>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="••••••••••"
                        required
                        disabled={isLoading}
                        className="w-full h-12 px-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#087055] focus:border-[#087055]"
                      />
                    </div>
                  </>
                )}

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button 
                  type="submit" 
                  className="w-full h-12 bg-[#087055] hover:bg-[#065946] text-white font-medium rounded-md" 
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign In
                </Button>

                <div className="text-left">
                  <a href="#" className="text-sm text-gray-600 hover:text-[#087055] underline">
                    Forgot password?
                  </a>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginForm;