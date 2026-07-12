import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { resolveStoreForSession, getStoresByOwner, getAllStores } from "@/lib/db/stores";
import StoreSidebar from "@/components/StoreSidebar";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return {};
  const store = await resolveStoreForSession(id, session);
  if (!store) return {};
  return {
    title: {
      template: `%s — ${store.name}`,
      default: store.name,
    },
  };
}

export default async function StoreLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) notFound();

  const store = await resolveStoreForSession(id, session);
  if (!store) notFound();

  const allStores = session.user.role === "admin"
    ? await getAllStores()
    : await getStoresByOwner(session.user.id);

  return (
    <div className="flex h-screen overflow-hidden bg-[#EBEBEB]">
      <StoreSidebar store={store} allStores={allStores} />
      <div className="flex-1 min-w-0 flex flex-col overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
