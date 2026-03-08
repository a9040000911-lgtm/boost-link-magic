import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import GuestContactForm from "@/components/GuestContactForm";

export default function Contact() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="font-semibold text-lg">Связаться с нами</h1>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-12">
        <GuestContactForm />
      </main>
    </div>
  );
}
