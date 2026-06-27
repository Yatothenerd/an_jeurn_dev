import { redirect } from "next/navigation";
import { getSession } from "@/lib/services/auth.service";
import { getSiteSettings } from "@/lib/services/site-settings.service";
import { AppearanceSettings } from "./_components/AppearanceSettings";

export const metadata = { title: "Admin — Settings" };

export default async function AdminSettingsPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/login");

  const settings = await getSiteSettings();

  return (
    <div style={{ maxWidth: 820 }}>
      <div className="brand-panel-head">
        <span className="brand-eyebrow">Appearance</span>
        <h1 className="brand-h1">Site Settings</h1>
        <p className="brand-lead">
          Control the motion of the public company site — how content reveals when a page
          first loads, and how pages animate when guests navigate between them. Changes save
          instantly and apply to everyone.
        </p>
      </div>
      <AppearanceSettings initial={settings} />
    </div>
  );
}
