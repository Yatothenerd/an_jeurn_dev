import { prisma } from "@/lib/db/prisma";
import { PackageEditor } from "./_components/PackageEditor";

export const metadata = { title: "Admin — Packages" };

export default async function PackagesPage() {
  const packages = await prisma.package.findMany({ orderBy: { priceUsd: "asc" } }) as unknown as Array<Record<string, unknown> & { id: string; name: string; slug: string; priceUsd: number | string }>;

  return (
    <div>
      <h1 style={s.heading}>Packages</h1>
      <p style={s.sub}>Edit feature flags and limits for each package. Changes take effect immediately.</p>
      <div style={s.list}>
        {packages.map((pkg) => (
          <PackageEditor key={pkg.id} pkg={pkg} />
        ))}
      </div>
    </div>
  );
}

const s = {
  heading: { margin: "0 0 0.25rem", fontSize: "1.5rem", fontWeight: 700, color: "var(--c-text)" },
  sub: { margin: "0 0 1.5rem", color: "var(--c-muted)", fontSize: "0.875rem" },
  list: { display: "flex", flexDirection: "column" as const, gap: "1rem" },
} as const;
