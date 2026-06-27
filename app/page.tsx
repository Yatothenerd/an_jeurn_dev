import { LandingPage } from "./_components/landing/LandingPage";
import { getSiteSettings } from "@/lib/services/site-settings.service";

// Public company front site (bilingual KH/EN). Admins/clients reach their
// dashboards via the "Log in" CTA → /login. The entrance animation is
// admin-configurable via /admin/settings.
export default async function Home() {
  const { entranceStyle } = await getSiteSettings();
  return <LandingPage entranceStyle={entranceStyle} />;
}
