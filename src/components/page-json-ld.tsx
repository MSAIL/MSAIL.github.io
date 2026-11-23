import type { PageKey } from "@/data/pages";
import { jsonLdHtml, pageGraph } from "@/lib/agent-index";

/**
 * The page's own schema.org graph (WebPage type, breadcrumbs, page entities).
 * It links by @id to the Organization and WebSite graph the root layout
 * renders on every page.
 */
export function PageJsonLd({ page }: { page: PageKey }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonLdHtml(pageGraph(page)) }}
    />
  );
}
