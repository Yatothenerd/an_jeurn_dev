import { redirect } from "next/navigation";

// Theme model has been removed. Admin now manages events directly via EventWizard.
export default function ThemesPage() {
  redirect("/admin/events");
}
