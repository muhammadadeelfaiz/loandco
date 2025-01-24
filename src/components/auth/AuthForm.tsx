import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

type AuthMode = "login" | "register";

interface AuthFormProps {
  defaultMode?: AuthMode;
}

export const AuthForm = ({ defaultMode = "login" }: AuthFormProps) => {
  const [mode] = useState<AuthMode>(defaultMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("customer");
  const [loading, setLoading] = useState(false);
  const [signupCooldown, setSignupCooldown] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const startCooldown = () => {
    setSignupCooldown(true);
    setTimeout(() => {
      setSignupCooldown(false);
    }, 45000); // 45 seconds cooldown
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-md">
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
          onChange={(e) => setPassword(e.target.value)}
          required
        />
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
        {loading ? "Loading..." : mode === "login" ? "Sign In" : "Sign Up"}
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
  );
};