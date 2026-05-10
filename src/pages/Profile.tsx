import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, User, Lock, Briefcase, Scale, Power, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PortalLayout } from "@/components/app/PortalLayout";
import { useAuth } from "@/context/AuthContext";
import {
  deactivateClientProfile,
  deleteClientProfile,
  getClientProfile,
  updateClientProfile,
  type ClientProfile,
} from "@/lib/alis";
import { toast } from "sonner";

export default function ProfilePage() {
  const { session, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [barNumber, setBarNumber] = useState("");
  const [lawFirm, setLawFirm] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [dealSpecialty, setDealSpecialty] = useState("");
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loading, setLoading] = useState(false);
  const isLegalPractitioner = profile?.role === "LEGAL_PRACTITIONER";
  const isDealMaker = profile?.role === "DEAL_MAKER";

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
        setBarNumber(data.barNumber ?? "");
        setLawFirm(data.lawFirm ?? "");
        setCompanyName(data.companyName ?? "");
        setDealSpecialty(data.dealSpecialty ?? "");
      })
      .catch((err) => toast.error(err?.message ?? "Could not load profile"));
  }, [session, navigate]);

  const saveProfile = async () => {
    setLoading(true);
    try {
      const updated = await updateClientProfile({
        fullName: fullName || undefined,
        username: username || undefined,
        barNumber: isLegalPractitioner ? barNumber || null : undefined,
        lawFirm: isLegalPractitioner ? lawFirm || null : undefined,
        companyName: isDealMaker ? companyName || null : undefined,
        dealSpecialty: isDealMaker ? dealSpecialty || null : undefined,
      });
      setProfile({ ...profile!, ...updated });
      toast.success("Profile updated");
    } catch (err) {
      toast.error((err as Error).message ?? "Update failed");
    } finally {
      setLoading(false);
    }
  };

  const deactivateAccount = async () => {
    setLoading(true);
    try {
      await deactivateClientProfile();
      toast.success("Account deactivated");
      logout();
      navigate("/login", { replace: true });
    } catch (err) {
      toast.error((err as Error).message ?? "Deactivate failed");
    } finally {
      setLoading(false);
      setConfirmDeactivate(false);
    }
  };

  const deleteAccount = async () => {
    setLoading(true);
    try {
      await deleteClientProfile();
      toast.success("Account deleted");
      logout();
      navigate("/", { replace: true });
    } catch (err) {
      toast.error((err as Error).message ?? "Delete failed");
    } finally {
      setLoading(false);
      setConfirmDelete(false);
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
                    <Input
                      value={barNumber}
                      onChange={(e) => setBarNumber(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Law Firm</Label>
                    <Input
                      value={lawFirm}
                      onChange={(e) => setLawFirm(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </>
              )}

              {isDealMaker && (
                <>
                  <div>
                    <Label>Company Name</Label>
                    <Input
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Deal Specialty</Label>
                    <Input
                      value={dealSpecialty}
                      onChange={(e) => setDealSpecialty(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </>
              )}
              <Button onClick={saveProfile} disabled={loading} className="w-fit">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save role details
              </Button>
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

        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-destructive/10 p-2">
              <Power className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Account access</h2>
              <p className="text-xs text-muted-foreground">
                Deactivate or permanently delete your workspace.
              </p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setConfirmDeactivate(true)}>
              <Power className="mr-1.5 h-3.5 w-3.5" /> Deactivate
            </Button>
            <Button variant="destructive" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete account
            </Button>
          </div>
        </div>
      </div>

      <AlertDialog open={confirmDeactivate} onOpenChange={setConfirmDeactivate}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate account?</AlertDialogTitle>
            <AlertDialogDescription>
              You will be signed out and this account will no longer be able to log in until it is restored.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deactivateAccount}>Deactivate</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete account permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes your account and related workspace records. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={deleteAccount}
            >
              Delete account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PortalLayout>
  );
}
