import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { register } from "@/lib/auth";
import { useAuth } from "@/context/AuthContext";
import { ROLE_HOME } from "@/lib/nav";
import { toast } from "sonner";
import type { Role } from "@/lib/auth";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("USER");
  const [companyName, setCompanyName] = useState("");
  const [dealSpecialty, setDealSpecialty] = useState("");
  const [barNumber, setBarNumber] = useState("");
  const [lawFirm, setLawFirm] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);

    const payload: Parameters<typeof register>[0] = {
      fullName,
      email,
      password,
      role,
    };

    if (role === "DEAL_MAKER") {
      payload.companyName = companyName;
      payload.dealSpecialty = dealSpecialty;
    } else if (role === "LEGAL_PRACTITIONER") {
      payload.barNumber = barNumber;
      payload.lawFirm = lawFirm;
    }

    try {
      await register(payload);
      toast.success("Account created");

      // Automatically log in and redirect to role‑specific dashboard
      const session = await login(email, password);
      const home = ROLE_HOME[session.role] ?? "/user/dashboard";
      navigate(home, { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Registration failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Create your workspace"
      subtitle="All roles get instant access. Practitioner and Deal Maker accounts unlock advanced tools."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full name</Label>
          <Input
            id="fullName"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Thandi Nkosi"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Work email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@firm.co.za"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
          />
        </div>
        <div className="space-y-2">
          <Label>Role</Label>
          <Select value={role} onValueChange={(v) => setRole(v as Role)}>
            <SelectTrigger>
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DEAL_MAKER">Deal Maker</SelectItem>
              <SelectItem value="LEGAL_PRACTITIONER">Legal Practitioner</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {role === "USER" && "Basic access — upload documents and receive compliance reports."}
            {role === "DEAL_MAKER" && "For investors & dealmakers — access deal readiness scores."}
            {role === "LEGAL_PRACTITIONER" && "For lawyers — rule workspace and deeper analysis."}
          </p>
        </div>

        {role === "DEAL_MAKER" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="companyName">Company name</Label>
              <Input
                id="companyName"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Acme Corp"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dealSpecialty">Deal specialty</Label>
              <Input
                id="dealSpecialty"
                required
                value={dealSpecialty}
                onChange={(e) => setDealSpecialty(e.target.value)}
                placeholder="Mergers & Acquisitions"
              />
            </div>
          </>
        )}

        {role === "LEGAL_PRACTITIONER" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="barNumber">Bar number</Label>
              <Input
                id="barNumber"
                required
                value={barNumber}
                onChange={(e) => setBarNumber(e.target.value)}
                placeholder="12345"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lawFirm">Law firm</Label>
              <Input
                id="lawFirm"
                required
                value={lawFirm}
                onChange={(e) => setLawFirm(e.target.value)}
                placeholder="Legal Eagles"
              />
            </div>
          </>
        )}

        <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Creating account…
            </>
          ) : (
            "Create account"
          )}
        </Button>
      </form>
    </AuthShell>
  );
}