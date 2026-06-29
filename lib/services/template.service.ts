import { prisma } from "@/lib/db/prisma";

// ── Template (reusable design preset) service ────────────────────────────────
//
// A Template captures the same design bundle an Invitation holds — overlayConfig,
// section layout, and background/cover assets — with no event-specific content.
// Admins build these in the Theme Builder and tag them to packages; applying a
// template copies its design onto a real event's invitation.

/** The design fields a template stores (mirrors the invitation design bundle). */
export interface TemplateDesign {
  contentType?: string | null;
  defaultSections?: unknown;
  overlayConfig?: unknown;
  backgroundUrl?: string | null;
  backgroundVideoUrl?: string | null;
  coverUrl?: string | null;
  thumbnailUrl?: string | null;
  previewUrl?: string | null;
  musicUrl?: string | null;
  isAnimated?: boolean;
}

export interface TemplateInput extends TemplateDesign {
  name: string;
  isActive?: boolean;
  sortOrder?: number;
  /** Package ids this template is allowed for (replaces existing tags when provided). */
  packageIds?: string[];
}

const DESIGN_KEYS: (keyof TemplateDesign)[] = [
  "contentType",
  "defaultSections",
  "overlayConfig",
  "backgroundUrl",
  "backgroundVideoUrl",
  "coverUrl",
  "thumbnailUrl",
  "previewUrl",
  "musicUrl",
  "isAnimated",
];

function pickDesign(input: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of DESIGN_KEYS) {
    if (k in input) out[k] = input[k];
  }
  return out;
}

export const TemplateService = {
  /** All templates (newest design first within sort order), with package tags. */
  async list() {
    return prisma.template.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      include: { packages: { include: { package: true } } },
    });
  },

  /** Only active templates a given package may use (for client/event apply pickers). */
  async listForPackage(packageId: string) {
    return prisma.template.findMany({
      where: { isActive: true, packages: { some: { packageId } } },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
  },

  async get(id: string) {
    return prisma.template.findUnique({
      where: { id },
      include: { packages: { include: { package: true } } },
    });
  },

  async create(input: TemplateInput) {
    const { name, isActive, sortOrder, packageIds } = input;
    const template = await prisma.template.create({
      data: {
        name: name.trim(),
        isActive: isActive ?? true,
        sortOrder: sortOrder ?? 0,
        ...pickDesign(input as Record<string, unknown>),
        ...(packageIds && packageIds.length > 0
          ? { packages: { create: packageIds.map((packageId) => ({ packageId })) } }
          : {}),
      },
    });
    return template;
  },

  async update(id: string, input: Partial<TemplateInput>) {
    const data: Record<string, unknown> = { ...pickDesign(input as Record<string, unknown>) };
    if (typeof input.name === "string") data.name = input.name.trim();
    if (typeof input.isActive === "boolean") data.isActive = input.isActive;
    if (typeof input.sortOrder === "number") data.sortOrder = input.sortOrder;

    const template = await prisma.template.update({ where: { id }, data });

    if (input.packageIds) {
      await TemplateService.setPackages(id, input.packageIds);
    }
    return template;
  },

  async remove(id: string) {
    return prisma.template.delete({ where: { id } });
  },

  /** Replace the set of packages a template is tagged to. */
  async setPackages(templateId: string, packageIds: string[]) {
    const unique = [...new Set(packageIds)];
    await prisma.$transaction([
      prisma.packageTemplate.deleteMany({ where: { templateId } }),
      ...(unique.length > 0
        ? [
            prisma.packageTemplate.createMany({
              data: unique.map((packageId) => ({ templateId, packageId })),
              skipDuplicates: true,
            }),
          ]
        : []),
    ]);
    return TemplateService.get(templateId);
  },

  /**
   * Copy a template's design onto an event's invitation. The live invite renders
   * from invitation.overlayConfig.builderDraft, so we transplant the template's
   * builderDraft but keep the target event's identity (name / type / date) so an
   * existing event is restyled, not renamed.
   */
  async applyToEvent(templateId: string, eventId: string) {
    const template = await prisma.template.findUnique({ where: { id: templateId } });
    if (!template) throw new Error("Template not found");

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { invitation: true },
    });
    if (!event) throw new Error("Event not found");

    const tplOverlay = (template.overlayConfig as Record<string, unknown> | null) ?? {};
    const tplDraft = (tplOverlay.builderDraft as Record<string, unknown> | undefined) ?? undefined;

    const existingOverlay = (event.invitation?.overlayConfig as Record<string, unknown> | null) ?? {};
    const existingDraft = (existingOverlay.builderDraft as Record<string, unknown> | undefined) ?? undefined;

    // Preserve the event's real identity inside the transplanted draft.
    const identity = {
      eventName: existingDraft?.eventName ?? event.title,
      eventType: existingDraft?.eventType ?? event.eventType,
      dateTime:
        existingDraft?.dateTime ??
        (event.eventDate ? new Date(event.eventDate).toISOString().slice(0, 16) : ""),
    };

    const mergedOverlay: Record<string, unknown> = {
      ...existingOverlay,
      ...tplOverlay,
      ...(tplDraft ? { builderDraft: { ...tplDraft, ...identity } } : {}),
    };

    const design = {
      contentType: template.contentType ?? "photo",
      overlayConfig: mergedOverlay,
      backgroundUrl: template.backgroundUrl,
      backgroundVideoUrl: template.backgroundVideoUrl,
      coverUrl: template.coverUrl,
      thumbnailUrl: template.thumbnailUrl,
      musicUrl: template.musicUrl,
      isAnimated: template.isAnimated,
    };

    return prisma.invitation.upsert({
      where: { eventId },
      update: design,
      create: {
        eventId,
        shareLink: `${process.env.NEXT_PUBLIC_APP_URL}/invite/${event.slug}`,
        ...design,
      },
    });
  },
};
