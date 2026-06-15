import { ThemeService } from "@/lib/services/theme.service";
import { ThemesPageClient } from "./_components/ThemesPageClient";

export const metadata = { title: "Admin — Themes" };

export default async function ThemesPage() {
  const themes = await ThemeService.getAllThemes();
  return <ThemesPageClient themes={themes} />;
}
