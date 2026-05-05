import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, User, Lock, Briefcase, Scale } from "lucide-react"; // added icons
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { PortalLayout } from "@/components/app/PortalLayout";
import { useAuth } from "@/context/AuthContext";
import {
  getClientProfile,
  updateClientProfile,
  type ClientProfile,
} from "@/lib/alis";
import { toast } from "sonner";

export default function ProfilePage() {
  const { session } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session) {
      navigate("/login", { replace: true });
      return;
    }
    getClientProfile()
      .then((data) => {
        setProfile(data);
        setFullName(data.fullName);
        setUsername(data.username ?? "");
      })
      .catch((err) => toast.error(err?.message ?? "Could not load profile"));
  }, [session, navigate]);

  const saveProfile = async () => {
    setLoading(true);
    try {
      const updated = await updateClientProfile({
        fullName: fullName || undefined,
        username: username || undefined,
      });
      setProfile({ ...profile!, ...updated });
      toast.success("Profile updated");
    } catch (err) {
      toast.error((err as Error).message ?? "Update failed");
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("All password fields are required");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await updateClientProfile({
        currentPassword,
        newPassword,
      });
      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error((err as Error).message ?? "Password change failed");
    } finally {
      setLoading(false);
    }
  };

  if (!profile) return null;

  // Determine role-specific display
  const isLegalPractitioner = profile.role === "LEGAL_PRACTITIONER";
  const isDealMaker = profile.role === "DEAL_MAKER";

  return (
    <PortalLayout
      title="My Profile"
      eyebrow="Settings"
      description="Manage your personal information and password."
    >
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Personal Info Card */}
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-muted p-2">
              <User className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">{profile.fullName}</h2>
              <p className="text-xs text-muted-foreground">
                {profile.email} · {profile.role?.replace(/_/g, " ")}
              </p>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="grid gap-5">
            <div>
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button onClick={saveProfile} disabled={loading} className="w-fit">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save changes
            </Button>
          </div>
        </div>

        {/* Role-Specific Details Card */}
        {(isLegalPractitioner || isDealMaker) && (
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-muted p-2">
                {isLegalPractitioner ? (
                  <Scale className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <Briefcase className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <h2 className="text-lg font-semibold">
                {isLegalPractitioner ? "Legal Practitioner Details" : "Deal Maker Details"}
              </h2>
            </div>
            <Separator className="my-6" />

            <div className="grid gap-5">
              {isLegalPractitioner && (
                <>
                  <div>
                    <Label>Bar Number</Label>
                    <p className="mt-1 text-sm font-medium">
                      {profile.barNumber || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <Label>Law Firm</Label>
                    <p className="mt-1 text-sm font-medium">
                      {profile.lawFirm || "Not provided"}
                    </p>
                  </div>
                </>
              )}

              {isDealMaker && (
                <>
                  <div>
                    <Label>Company Name</Label>
                    <p className="mt-1 text-sm font-medium">
                      {profile.companyName || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <Label>Deal Specialty</Label>
                    <p className="mt-1 text-sm font-medium">
                      {profile.dealSpecialty || "Not provided"}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Password Card (unchanged) */}
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-muted p-2">
              <Lock className="h-5 w-5 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold">Change Password</h2>
          </div>

          <Separator className="my-6" />

          <div className="grid gap-5">
            <div>
              <Label htmlFor="currentPassword">Current password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="newPassword">New password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button onClick={updatePassword} disabled={loading} className="w-fit">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Change password
            </Button>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}