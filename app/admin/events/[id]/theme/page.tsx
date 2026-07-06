import { redirect } from "next/navigation";

// The theme editor moved into the event workflow as the Content step.
export default async function LegacyThemeEditorRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/admin/events/${id}/content`);
}
