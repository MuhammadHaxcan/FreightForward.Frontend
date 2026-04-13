import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Mail, CheckCircle2, XCircle } from "lucide-react";
import { useSmtpSettings, useSaveSmtpSettings, useTestSmtpConnection } from "@/hooks/useSettings";
import { SaveSmtpSettingsRequest } from "@/services/api/settings";
import { PermissionGate } from "@/components/auth/PermissionGate";

const DEFAULT_FORM: SaveSmtpSettingsRequest = {
  smtpHost: "",
  smtpPort: 587,
  smtpUsername: "",
  smtpPassword: "",
  fromEmail: "",
  fromName: "",
  enableSsl: true,
};

export function SmtpSettingsTab() {
  const { data: settings, isLoading } = useSmtpSettings();
  const saveSettings = useSaveSmtpSettings();
  const testConnection = useTestSmtpConnection();

  const [form, setForm] = useState<SaveSmtpSettingsRequest>(DEFAULT_FORM);

  useEffect(() => {
    if (settings) {
      setForm({
        smtpHost: settings.smtpHost,
        smtpPort: settings.smtpPort,
        smtpUsername: settings.smtpUsername,
        smtpPassword: "", // always blank — backend keeps existing if empty
        fromEmail: settings.fromEmail,
        fromName: settings.fromName,
        enableSsl: settings.enableSsl,
      });
    }
  }, [settings]);

  const handleReset = () => {
    if (settings) {
      setForm({
        smtpHost: settings.smtpHost,
        smtpPort: settings.smtpPort,
        smtpUsername: settings.smtpUsername,
        smtpPassword: "",
        fromEmail: settings.fromEmail,
        fromName: settings.fromName,
        enableSsl: settings.enableSsl,
      });
    } else {
      setForm(DEFAULT_FORM);
    }
  };

  const handleSave = () => {
    saveSettings.mutate(form);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header + status badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">SMTP / Email Settings</h3>
        </div>
        {settings?.isConfigured ? (
          <span className="flex items-center gap-1 text-sm text-green-600 font-medium">
            <CheckCircle2 className="h-4 w-4" /> Configured
          </span>
        ) : (
          <span className="flex items-center gap-1 text-sm text-amber-600 font-medium">
            <XCircle className="h-4 w-4" /> Not Configured
          </span>
        )}
      </div>

      <div className="border rounded-lg p-6 space-y-6 bg-card">
        {/* Row 1: Host, Port, Username */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1 space-y-2">
            <Label>SMTP Host</Label>
            <Input
              value={form.smtpHost}
              onChange={(e) => setForm({ ...form, smtpHost: e.target.value })}
              placeholder="smtp.gmail.com"
            />
          </div>
          <div className="space-y-2">
            <Label>SMTP Port</Label>
            <Input
              type="number"
              value={form.smtpPort}
              onChange={(e) => setForm({ ...form, smtpPort: parseInt(e.target.value) || 587 })}
              placeholder="587"
            />
          </div>
          <div className="space-y-2">
            <Label>SMTP Username</Label>
            <Input
              value={form.smtpUsername}
              onChange={(e) => setForm({ ...form, smtpUsername: e.target.value })}
              placeholder="user@example.com"
            />
          </div>
        </div>

        {/* Row 2: Password, From Email */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>SMTP Password</Label>
            <Input
              type="password"
              value={form.smtpPassword}
              onChange={(e) => setForm({ ...form, smtpPassword: e.target.value })}
              placeholder={settings?.hasPassword ? "Leave blank to keep existing" : "Enter password"}
            />
            <p className="text-xs text-muted-foreground">
              Password is optional; leave blank to keep the current password.
            </p>
          </div>
          <div className="space-y-2">
            <Label>From Email</Label>
            <Input
              value={form.fromEmail}
              onChange={(e) => setForm({ ...form, fromEmail: e.target.value })}
              placeholder="noreply@yourcompany.com"
            />
          </div>
        </div>

        {/* Row 3: From Name, SSL */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <div className="space-y-2">
            <Label>From Name</Label>
            <Input
              value={form.fromName}
              onChange={(e) => setForm({ ...form, fromName: e.target.value })}
              placeholder="Your Company Name"
            />
          </div>
          <div className="flex items-center gap-3 pb-1">
            <Switch
              checked={form.enableSsl}
              onCheckedChange={(checked) => setForm({ ...form, enableSsl: checked })}
            />
            <Label className="cursor-pointer">Enable SSL</Label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2 border-t">
          <PermissionGate permission="smtp_edit">
            <Button
              variant="outline"
              onClick={() => testConnection.mutate()}
              disabled={testConnection.isPending || !settings?.isConfigured}
            >
              {testConnection.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Testing...</>
              ) : (
                "Test Connection"
              )}
            </Button>
          </PermissionGate>
          <PermissionGate permission="smtp_edit">
            <Button
              onClick={handleSave}
              disabled={saveSettings.isPending}
            >
              {saveSettings.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
              ) : (
                "Save Email Settings"
              )}
            </Button>
          </PermissionGate>
          <Button variant="ghost" onClick={handleReset}>
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
}
