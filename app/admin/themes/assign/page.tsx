import { redirect } from "next/navigation";

// Theme/PackageTheme models removed. Events are now managed directly.
export default function AssignThemesPage() {
  redirect("/admin/events");
}
