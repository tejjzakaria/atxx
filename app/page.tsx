import SignInForm from "@/components/SignInForm";
import MarketingPanel from "@/components/MarketingPanel";

export default function SignInPage() {
  return (
    <main className="min-h-screen bg-[#EBEBEB] flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-5xl min-h-[580px] rounded-2xl overflow-hidden flex flex-row">
        <SignInForm />
        <MarketingPanel />
      </div>
    </main>
  );
}
