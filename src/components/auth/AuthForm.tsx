import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Mail } from "lucide-react";

type AuthMode = "login" | "register";

interface AuthFormProps {
  defaultMode?: AuthMode;
}

const validatePassword = (password: string): string[] => {
  const errors: string[] = [];
  if (password.length < 8) errors.push("Password must be at least 8 characters long");
  if (!/[A-Z]/.test(password)) errors.push("Password must contain at least one uppercase letter");
  if (!/[a-z]/.test(password)) errors.push("Password must contain at least one lowercase letter");
  if (!/[0-9]/.test(password)) errors.push("Password must contain at least one number");
  if (!/[!@#$%^&*]/.test(password)) errors.push("Password must contain at least one special character (!@#$%^&*)");
  return errors;
};

export const AuthForm = ({ defaultMode = "login" }: AuthFormProps) => {
  const [mode] = useState<AuthMode>(defaultMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [role, setRole] = useState("customer");
  const [loading, setLoading] = useState(false);
  const [signupCooldown, setSignupCooldown] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const startCooldown = () => {
    setSignupCooldown(true);
    setTimeout(() => {
      setSignupCooldown(false);
    }, 45000);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    if (mode === "register") {
      setPasswordErrors(validatePassword(newPassword));
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === "register") {
      const errors = validatePassword(password);
      if (errors.length > 0) {
        toast({
          variant: "destructive",
          title: "Invalid password",
          description: "Please fix the password requirements below.",
        });
        return;
      }
    }

    if (mode === "register" && signupCooldown) {
      toast({
        variant: "destructive",
        title: "Please wait",
        description: "You can try signing up again after 45 seconds.",
      });
      return;
    }

    setLoading(true);
    
    try {
      if (mode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.includes("Email not confirmed")) {
            throw new Error(
              "Please verify your email before signing in. Check your inbox for the verification link."
            );
          }
          if (error.message.includes("Invalid login credentials")) {
            throw new Error("Invalid email or password. Please try again.");
          }
          throw error;
        }

        toast({
          title: "Logged in successfully",
          description: `Welcome back!`,
        });
        navigate("/");
      } else {
        if (signupCooldown) {
          throw new Error("Please wait 45 seconds before trying to sign up again.");
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              role: role,
            },
            emailRedirectTo: `${window.location.origin}/signin`,
          },
        });

        if (error) {
          if (error.message.includes("over_email_send_rate_limit")) {
            startCooldown();
            throw new Error("Please wait 45 seconds before trying again.");
          }
          throw error;
        }

        startCooldown();
        toast({
          title: "Registration successful",
          description: "Please check your email to verify your account.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: 'facebook' | 'google') => {
    try {
      console.log(`Attempting to sign in with ${provider}`);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: mode === 'register' ? {
            default_role: role
          } : undefined
        }
      });
      
      console.log('OAuth response:', { data, error });

      if (error) throw error;
    } catch (error) {
      console.error('OAuth error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
      });
    }
  };

  return (
    <div className="space-y-6 w-full max-w-md">
      <div className="grid grid-cols-2 gap-4">
        <Button
          variant="outline"
          onClick={() => handleOAuthSignIn('facebook')}
          className="w-full"
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="#1877F2"
              d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
            />
          </svg>
          Facebook
        </Button>
        <Button
          variant="outline"
          onClick={() => handleOAuthSignIn('google')}
          className="w-full"
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Google
        </Button>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator className="w-full" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with email
          </span>
        </div>
      </div>

      <form onSubmit={handleEmailSignIn} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={handlePasswordChange}
            required
          />
          {mode === "register" && passwordErrors.length > 0 && (
            <ul className="text-sm text-red-500 list-disc pl-4 mt-2">
              {passwordErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          )}
        </div>

        {mode === "register" && (
          <div className="space-y-2">
            <Label>Role</Label>
            <RadioGroup value={role} onValueChange={setRole} className="flex gap-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="customer" id="customer" />
                <Label htmlFor="customer">Customer</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="retailer" id="retailer" />
                <Label htmlFor="retailer">Retailer</Label>
              </div>
            </RadioGroup>
          </div>
        )}

        <Button 
          type="submit" 
          className="w-full" 
          disabled={loading || (mode === "register" && signupCooldown)}
        >
          <Mail className="mr-2 h-4 w-4" />
          {loading ? "Loading..." : mode === "login" ? "Sign In with Email" : "Sign Up with Email"}
        </Button>

        {mode === "register" && signupCooldown && (
          <p className="text-sm text-yellow-600 text-center">
            Please wait 45 seconds before trying to sign up again
          </p>
        )}

        <p className="text-center text-sm">
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <Link
            to={mode === "login" ? "/signup" : "/signin"}
            className="text-primary hover:underline"
          >
            {mode === "login" ? "Sign Up" : "Sign In"}
          </Link>
        </p>
      </form>
    </div>
  );
};