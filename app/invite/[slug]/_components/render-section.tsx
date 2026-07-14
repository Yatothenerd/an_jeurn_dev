// Shared section dispatcher — used by the server-rendered invite page AND by
// InviteLiveSections (a client component, for the editor's live preview). Kept
// in its own module with NO server-only imports (no prisma/next-headers) so it
// can be safely bundled into client JS.

import type { InviteData } from "@/lib/utils/invite-cache";
import type { SectionComponents, SectionType, ThemeTokens } from "@/lib/themes/types";
import { CoverSection } from "./sections/CoverSection";
import { CountdownSection } from "./sections/CountdownSection";
import { AgendaSection } from "./sections/AgendaSection";
import { DetailsSection } from "./sections/DetailsSection";
import { GallerySection } from "./sections/GallerySection";
import { VideoSection } from "./sections/VideoSection";
import { KhqrSection } from "./sections/KhqrSection";
import { WishingSection } from "./sections/WishingSection";
import { ImageSection } from "./sections/ImageSection";
import { GuestlistSection } from "./sections/GuestlistSection";

export const STANDARD_SECTIONS: SectionComponents = {
  cover: CoverSection,
  countdown: CountdownSection,
  agenda: AgendaSection,
  details: DetailsSection,
  gallery: GallerySection,
  video: VideoSection,
  khqr: KhqrSection,
  wishing: WishingSection,
  image: ImageSection,
  guestlist: GuestlistSection,
};

export function renderSection(
  sec: InviteData["sections"][number],
  data: InviteData,
  tokens: ThemeTokens,
  components: SectionComponents,
  assets: Record<string, string> | undefined,
  guestName: string | null,
  guests: Array<{ name: string; rsvpStatus: string | null }>,
  showGuestNames: boolean
): React.ReactNode {
  const c = sec.content as Record<string, unknown>;

  if (c.mode === "image" && c.imageUrl && components.image) {
    const C = components.image;
    return <C content={c as never} theme={tokens} />;
  }

  switch (sec.type as SectionType) {
    case "cover": {
      const C = components.cover;
      return C ? (
        <C
          content={c as { heading?: string; subheading?: string; guestLabel?: string }}
          eventTitle={data.event.title}
          eventDate={data.event.eventDate}
          venueName={data.event.venueName}
          guestName={guestName}
          theme={tokens}
          assets={assets}
        />
      ) : null;
    }
    case "wording": {
      const C = components.wording;
      return C ? <C content={c as { text?: string; imageUrl?: string; title?: string; hideTitle?: boolean }} theme={tokens} /> : null;
    }
    case "countdown": {
      const C = components.countdown;
      return C ? (
        <C
          targetDate={(c.targetDate as string) ?? ""}
          label={c.label as string | undefined}
          eventDate={data.event.eventDate}
          theme={tokens}
          hideTitle={c.hideTitle as boolean | undefined}
          content={c}
        />
      ) : null;
    }
    case "agenda": {
      const C = components.agenda;
      return C ? (
        <C content={c as never} venueName={data.event.venueName} venueMapUrl={data.event.venueMapUrl} theme={tokens} />
      ) : null;
    }
    case "details": {
      const C = components.details;
      return C ? (
        <C content={c as never} venueName={data.event.venueName} venueMapUrl={data.event.venueMapUrl} theme={tokens} />
      ) : null;
    }
    case "gallery": {
      const C = components.gallery;
      return C ? <C content={c as never} photos={data.photos} theme={tokens} /> : null;
    }
    case "video": {
      const C = components.video;
      return C ? <C content={c as never} theme={tokens} /> : null;
    }
    case "khqr": {
      const C = components.khqr;
      return C ? <C content={c as never} theme={tokens} /> : null;
    }
    case "wishing": {
      const C = components.wishing;
      return data.pkg?.hasWishing && C ? (
        <C invitationId={data.invitation.id} initialWishes={data.wishes} content={c as never} theme={tokens} />
      ) : null;
    }
    case "image": {
      const C = components.image;
      return C ? <C content={c as never} theme={tokens} /> : null;
    }
    case "guestlist": {
      const C = components.guestlist;
      return C ? <C content={c as never} guests={guests} showNames={showGuestNames} theme={tokens} /> : null;
    }
    default:
      return null;
  }
}

/** Anchor ids must be unique: the first section of each type keeps the plain
 *  `inv-sec-<type>` id (what PreviewFocus / the gift button look up); repeats
 *  of the same type get a numbered suffix so the DOM has no duplicate ids. */
export function makeAnchorId() {
  const typeSeen = new Map<string, number>();
  return (type: string) => {
    const n = typeSeen.get(type) ?? 0;
    typeSeen.set(type, n + 1);
    return n === 0 ? `inv-sec-${type}` : `inv-sec-${type}-${n}`;
  };
}
