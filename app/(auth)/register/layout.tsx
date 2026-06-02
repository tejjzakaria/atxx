import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create your ATXX account and start managing your stores.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
