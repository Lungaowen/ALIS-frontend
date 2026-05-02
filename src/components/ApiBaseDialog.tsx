import { useEffect, useState } from "react";
import { Server } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getApiBaseUrl, setApiBaseUrl } from "@/lib/api";
import { toast } from "sonner";

export function ApiBaseDialog() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  useEffect(() => {
    if (open) setValue(getApiBaseUrl());
  }, [open]);

  function save() {
    try {
      const url = value.trim();
      if (!/^https?:\/\//i.test(url)) {
        toast.error("URL must start with http:// or https://");
        return;
      }
      // validate
      new URL(url);
      setApiBaseUrl(url);
      toast.success("API base updated");
      setOpen(false);
    } catch {
      toast.error("Invalid URL");
    }
  }

  function reset() {
    setApiBaseUrl(null);
    toast.success("Reverted to default");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground">
          <Server className="h-3.5 w-3.5" />
          API
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-display text-2xl">API server</DialogTitle>
          <DialogDescription>
            Point the client at a different ALIS backend. Use an HTTPS tunnel
            (cloudflared, ngrok) when running this preview against a local
            backend — browsers block <code className="text-mono">http://localhost</code> from HTTPS pages.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="api-base">Base URL</Label>
          <Input
            id="api-base"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="https://your-tunnel.trycloudflare.com"
            spellCheck={false}
          />
          <p className="text-xs text-muted-foreground">
            Stored locally in your browser. No rebuild needed.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="ghost" onClick={reset}>
            Reset to default
          </Button>
          <Button variant="hero" onClick={save}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
