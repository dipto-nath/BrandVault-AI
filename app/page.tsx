import { Suspense } from "react";
import { getSession } from "@/lib/auth";
import { PrismaHero } from "@/components/ui/prisma-hero";

export default async function EntryPage() {
  const session = await getSession();

  return (
    <main className="min-h-screen w-full bg-[#0F141A] text-[#EDEAE1]">
      <Suspense fallback={<div className="h-screen w-full bg-[#141210]" />}>
        <PrismaHero
          initialUser={
            session
              ? {
                  name: session.userName || 'Member',
                  email: session.userEmail || undefined,
                  role: session.role,
                  workspace: session.workspaceSlug,
                }
              : null
          }
        />
      </Suspense>
    </main>
  );
}
