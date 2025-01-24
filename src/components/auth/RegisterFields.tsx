import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { format } from "date-fns";
import { User, Store, Calendar } from "lucide-react";

interface RegisterFieldsProps {
  name: string;
  setName: (name: string) => void;
  username: string;
  setUsername: (username: string) => void;
  dateOfBirth: string;
  setDateOfBirth: (date: string) => void;
  role: string;
  setRole: (role: string) => void;
}

export const RegisterFields = ({
  name,
  setName,
  username,
  setUsername,
  dateOfBirth,
  setDateOfBirth,
  role,
  setRole,
}: RegisterFieldsProps) => {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <div className="relative">
          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="pl-10"
            placeholder="John Doe"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="username">
          {role === 'customer' ? 'Username' : 'Store Name'}
        </Label>
        <div className="relative">
          {role === 'customer' ? (
            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          ) : (
            <Store className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          )}
          <Input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="pl-10"
            placeholder={role === 'customer' ? '@johndoe' : 'My Awesome Store'}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="dateOfBirth">Date of Birth</Label>
        <div className="relative">
          <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="dateOfBirth"
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            required
            className="pl-10"
            max={format(new Date(), 'yyyy-MM-dd')}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>I am a</Label>
        <RadioGroup 
          value={role} 
          onValueChange={setRole} 
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="customer" id="customer" />
            <Label htmlFor="customer" className="cursor-pointer">Customer</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="retailer" id="retailer" />
            <Label htmlFor="retailer" className="cursor-pointer">Retailer</Label>
          </div>
        </RadioGroup>
      </div>
    </>
  );
};