import { getSiteSettings } from "@/lib/services/site-settings.service";
import { PageTransition } from "./_components/transitions/PageTransition";

// A template (unlike a layout) remounts on every navigation, so wrapping children
// here lets the page-transition animation replay each time the route changes.
export default async function RootTemplate({ children }: { children: React.ReactNode }) {
  const { transitionStyle } = await getSiteSettings();
  return <PageTransition style={transitionStyle}>{children}</PageTransition>;
}
