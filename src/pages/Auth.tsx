import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Navigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Bot } from 'lucide-react';

export function Auth() {
  const { user, loading, signIn } = useAuth();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [signInForm, setSignInForm] = useState({ email: '', password: '' });

  const from = location.state?.from?.pathname || '/';

  // Redirect if already authenticated
  if (user && !loading) {
    return <Navigate to={from} replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { error } = await signIn(signInForm.email, signInForm.password);
    
    if (!error) {
      // Success - user will be redirected automatically by AuthGuard
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo/Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <Bot className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Lead Generation Platform</h1>
          <p className="text-muted-foreground">
            AI-powered lead discovery and enrichment
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Admin Login</CardTitle>
            <CardDescription>
              Sign in to access the lead generation platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signin-email">Email</Label>
                <Input
                  id="signin-email"
                  type="email"
                  placeholder="Enter your email"
                  value={signInForm.email}
                  onChange={(e) => setSignInForm({ ...signInForm, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signin-password">Password</Label>
                <Input
                  id="signin-password"
                  type="password"
                  placeholder="Enter your password"
                  value={signInForm.password}
                  onChange={(e) => setSignInForm({ ...signInForm, password: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-muted-foreground">
          <p>Internal access only. Contact administrator for access.</p>
        </div>
      </div>
    </div>
  );
}