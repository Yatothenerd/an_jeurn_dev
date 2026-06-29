import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/services/auth.service";
import { prisma } from "@/lib/db/prisma";
import { EventBuilder } from "@/app/admin/events/[id]/_components/EventBuilder";
import { TemplateHeader } from "../_components/TemplateHeader";

export const metadata = { title: "Edit Template" };

// Edits a Template's design via the same builder used for real events
// (EventBuilder in template mode). Saves persist the design snapshot to the
// template, not to any event.
export default async function TemplateEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/login");

  const { id } = await params;
  const template = await prisma.template.findUnique({
    where: { id },
    include: { packages: { include: { package: true } } },
  });
  if (!template) notFound();

  // Synthetic event/invitation so the builder hydrates from the template's saved
  // design (overlayConfig.builderDraft) and its background/cover assets.
  const eventData = {
    id: template.id,
    title: template.name,
    eventType: "Wedding",
    eventDate: "",
    venueName: null,
    venueMapUrl: null,
    slug: `template-${template.id}`,
  };
  const invData = {
    id: template.id,
    overlayConfig: template.overlayConfig as Record<string, unknown> | null,
    isPublished: false,
    shareLink: null,
    backgroundUrl: template.backgroundUrl,
    backgroundVideoUrl: template.backgroundVideoUrl,
    coverUrl: template.coverUrl,
  };

  const tags = template.packages.map((p) => p.package.name);

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto" }}>
      <TemplateHeader id={template.id} name={template.name} packageNames={tags} />
      <EventBuilder event={eventData} invitation={invData} templateMode={{ templateId: template.id }} />
    </div>
  );
}
