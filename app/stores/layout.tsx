import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Stores",
  description: "View and manage all your stores.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
