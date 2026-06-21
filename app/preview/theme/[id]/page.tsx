import { redirect } from "next/navigation";

// Theme model removed. Admin previews are now built into the EventWizard phone preview.
export default function ThemePreviewPage() {
  redirect("/admin/events");
}
