import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { format } from "date-fns";

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
        <Input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="John Doe"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="username">
          {role === 'customer' ? 'Username' : 'Store Name'}
        </Label>
        <Input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          placeholder={role === 'customer' ? 'johndoe123' : 'My Awesome Store'}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="dateOfBirth">Date of Birth</Label>
        <Input
          id="dateOfBirth"
          type="date"
          value={dateOfBirth}
          onChange={(e) => setDateOfBirth(e.target.value)}
          required
          max={format(new Date(), 'yyyy-MM-dd')}
        />
      </div>

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
    </>
  );
};