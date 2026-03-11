import { Helmet } from "react-helmet-async";
import { SEO_CONFIG } from "@/lib/seo";

interface SEOProps {
  title?: string;
  description?: string;
  ogImage?: string;
  ogType?: "website" | "article";
}

const SEO = ({ 
  title, 
  description = SEO_CONFIG.defaultDescription, 
  ogImage = "/og-image.png", 
  ogType = "website" 
}: SEOProps) => {
  const siteTitle = title ? title : SEO_CONFIG.defaultTitle;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{siteTitle}</title>
      <meta name="description" content={description} />

      {/* OpenGraph Meta Tags */}
      <meta property="og:title" content={siteTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:type" content={ogType} />

      {/* Twitter Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={siteTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
};

export default SEO;
