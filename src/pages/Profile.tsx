import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/AuthContext";
import { httpGet, httpPut, httpPatch } from "@/lib/http";
import { toast } from "sonner";

interface Profile {
  clientId: number;
  fullName: string;
  email: string;
  username: string;
  role: string;
  active: boolean;
}

export default function ProfilePage() {
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session) { navigate("/login"); return; }
    httpGet<Profile>("/api/client/profile").then(setProfile);
  }, [session, navigate]);

  if (!profile) return null;

  async function saveProfile() {
    setLoading(true);
    try {
      const payload: Record<string, string> = {};
      if (fullName) payload.fullName = fullName;
      if (username) payload.username = username;
      await httpPut("/api/client/profile", payload);
      toast.success("Profile updated");
      setFullName("");
      setUsername("");
    } catch (e) {
      toast.error((e as Error).message);
    } finally { setLoading(false); }
  }

  async function changePassword() {
    if (!currentPassword || !newPassword) {
      toast.error("Both current and new password are required");
      return;
    }
    setLoading(true);
    try {
      await httpPut("/api/client/profile", { currentPassword, newPassword });
      toast.success("Password changed");
      setCurrentPassword("");
      setNewPassword("");
    } catch (e) {
      toast.error((e as Error).message);
    } finally { setLoading(false); }
  }

  async function deactivate() {
    if (!confirm("Are you sure you want to deactivate your account?")) return;
    try {
      await httpPatch("/api/client/profile/deactivate");
      toast.success("Account deactivated");
      logout();
      navigate("/login");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div className="container py-10 max-w-xl">
      <h1 className="text-3xl font-semibold mb-6">Profile</h1>

      {/* Read‑only info */}
      <div className="grid gap-4 mb-8">
        <div><Label>Email</Label><p className="text-sm text-muted-foreground">{profile.email}</p></div>
        <div><Label>Role</Label><p className="text-sm text-muted-foreground">{profile.role}</p></div>
        <div><Label>Active</Label><p className="text-sm text-muted-foreground">{profile.active ? "Yes" : "No"}</p></div>
      </div>

      <Separator className="mb-8" />

      {/* Update details */}
      <div className="space-y-4 mb-8">
        <h2 className="text-xl font-semibold">Update details</h2>
        <div>
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" placeholder={profile.fullName} value={fullName} onChange={e => setFullName(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="username">Username</Label>
          <Input id="username" placeholder={profile.username} value={username} onChange={e => setUsername(e.target.value)} />
        </div>
        <Button onClick={saveProfile} disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Save
        </Button>
      </div>

      <Separator className="mb-8" />

      {/* Change password */}
      <div className="space-y-4 mb-8">
        <h2 className="text-xl font-semibold">Change password</h2>
        <div>
          <Label htmlFor="currentPassword">Current password</Label>
          <Input id="currentPassword" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="newPassword">New password</Label>
          <Input id="newPassword" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
        </div>
        <Button onClick={changePassword} disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Change password
        </Button>
      </div>

      <Separator className="mb-8" />

      {/* Danger zone */}
      <div>
        <h2 className="text-xl font-semibold text-destructive mb-2">Danger zone</h2>
        <p className="text-sm text-muted-foreground mb-4">Deactivating your account will disable all access.</p>
        <Button variant="destructive" onClick={deactivate}>Deactivate account</Button>
      </div>
    </div>
  );
}