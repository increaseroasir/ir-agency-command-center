import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, BarChart3 } from "lucide-react";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [, navigate] = useLocation();

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => {
      navigate("/");
    },
    onError: (err) => {
      toast.error(err.message || "Invalid username or password");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    loginMutation.mutate({ username: username.trim(), password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm px-4">
        {/* Brand header */}
        <div className="flex flex-col items-center mb-8 gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-semibold text-foreground tracking-tight">
              IR Agency Command Center
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Sign in to access the dashboard
            </p>
          </div>
        </div>

        {/* Login form */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-sm font-medium">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                autoComplete="username"
                autoFocus
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loginMutation.isPending}
                className="bg-background"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loginMutation.isPending}
                className="bg-background"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loginMutation.isPending || !username.trim() || !password}
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
