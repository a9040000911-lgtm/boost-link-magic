import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft } from "lucide-react";
import Footer from "@/components/Footer";
import NotFound from "./NotFound";

interface PageData {
  title: string;
  content: string | null;
  meta_title: string | null;
  meta_description: string | null;
  custom_css: string | null;
}

const DynamicPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchPage = async () => {
      if (!slug) { setNotFound(true); setLoading(false); return; }
      const { data, error } = await supabase
        .from("pages")
        .select("title, content, meta_title, meta_description, custom_css")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();

      if (error || !data) {
        setNotFound(true);
      } else {
        setPage(data);
        // Update document title
        document.title = data.meta_title || data.title || "CoolLike";
        // Update meta description
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc && data.meta_description) {
          metaDesc.setAttribute("content", data.meta_description);
        }
      }
      setLoading(false);
    };
    fetchPage();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Загрузка...</div>
      </div>
    );
  }

  if (notFound || !page) return <NotFound />;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> На главную
        </Link>

        <h1 className="text-3xl font-bold text-foreground mb-8">{page.title}</h1>

        {page.custom_css && <style>{page.custom_css}</style>}

        <div
          className="prose prose-sm max-w-none text-foreground
            [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-8 [&_h2]:mb-4
            [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-3
            [&_p]:text-muted-foreground [&_p]:leading-relaxed [&_p]:mb-4
            [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:text-muted-foreground [&_ul]:mb-4
            [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:text-muted-foreground [&_ol]:mb-4
            [&_li]:mb-1
            [&_a]:text-primary [&_a]:underline
            [&_strong]:text-foreground [&_strong]:font-semibold
            [&_blockquote]:border-l-4 [&_blockquote]:border-primary/30 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground"
          dangerouslySetInnerHTML={{ __html: page.content || "" }}
        />
      </div>
      <Footer />
    </div>
  );
};

export default DynamicPage;
