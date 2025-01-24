import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Link, useNavigate } from "react-router-dom";
import { Mail } from "lucide-react";
import { OAuthButtons } from "./OAuthButtons";
import { RegisterFields } from "./RegisterFields";
import { validatePassword } from "@/utils/passwordValidation";
import { signInWithEmail, signUpWithEmail, signInWithOAuth } from "@/services/authService";

type AuthMode = "login" | "register";

interface AuthFormProps {
  defaultMode?: AuthMode;
}

export const AuthForm = ({ defaultMode = "login" }: AuthFormProps) => {
  const [mode] = useState<AuthMode>(defaultMode);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
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

      if (!name.trim() || !username.trim()) {
        toast({
          variant: "destructive",
          title: "Required fields",
          description: `Please enter your name and ${role === 'customer' ? 'username' : 'store name'}.`,
        });
        return;
      }

      if (!dateOfBirth) {
        toast({
          variant: "destructive",
          title: "Date of birth required",
          description: "Please enter your date of birth.",
        });
        return;
      }

      const birthDate = new Date(dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (age < 13 || (age === 13 && monthDiff < 0)) {
        toast({
          variant: "destructive",
          title: "Age restriction",
          description: "You must be at least 13 years old to register.",
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
        await signInWithEmail(email, password);
        toast({
          title: "Logged in successfully",
          description: `Welcome back!`,
        });
        navigate("/");
      } else {
        if (signupCooldown) {
          throw new Error("Please wait 45 seconds before trying to sign up again.");
        }

        await signUpWithEmail(email, password, {
          role,
          name,
          username,
          date_of_birth: dateOfBirth,
        });

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
      await signInWithOAuth(provider, mode, role);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
      });
    }
  };

  return (
    <div className="space-y-6 w-full max-w-md">
      <OAuthButtons onOAuthSignIn={handleOAuthSignIn} />

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
        {mode === "register" && (
          <RegisterFields
            name={name}
            setName={setName}
            username={username}
            setUsername={setUsername}
            dateOfBirth={dateOfBirth}
            setDateOfBirth={setDateOfBirth}
            role={role}
            setRole={setRole}
          />
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Email or Username/Store Name</Label>
          <Input
            id="email"
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Enter your email or username/store name"
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

        <Button 
          type="submit" 
          className="w-full" 
          disabled={loading || (mode === "register" && signupCooldown)}
        >
          <Mail className="mr-2 h-4 w-4" />
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
    </div>
  );
};