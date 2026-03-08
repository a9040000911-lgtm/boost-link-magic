import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import GuestContactForm from "@/components/GuestContactForm";

const SETTINGS_KEYS = ["contact_email", "contact_work_hours", "contact_work_days"];
const DEFAULTS: Record<string, string> = {
  contact_email: "support@smmpanel.ru",
  contact_work_hours: "9:00 — 21:00 МСК",
  contact_work_days: "Пн — Вс",
};

export default function Contact() {
  const [settings, setSettings] = useState(DEFAULTS);

  useEffect(() => {
    supabase
      .from("app_settings")
      .select("key, value")
      .in("key", SETTINGS_KEYS)
      .then(({ data }) => {
        if (data) {
          const map = { ...DEFAULTS };
          data.forEach((r) => { if (r.value) map[r.key] = r.value; });
          setSettings(map);
        }
      });
  }, []);

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
        {/* Contact info */}
        <div className="flex flex-wrap gap-6 mb-8 text-sm text-muted-foreground">
          <a
            href={`mailto:${settings.contact_email}`}
            className="inline-flex items-center gap-2 hover:text-foreground transition-colors"
          >
            <Mail className="h-4 w-4 text-primary" />
            {settings.contact_email}
          </a>
          <span className="inline-flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            {settings.contact_work_days}, {settings.contact_work_hours}
          </span>
        </div>

        <GuestContactForm workHours={`${settings.contact_work_days}, ${settings.contact_work_hours}`} />
      </main>
    </div>
  );
}
