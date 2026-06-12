import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { SectionHeading } from "@/components/content-blocks";
import {
  constitutionArticles,
  constitutionMeta,
  constitutionTerminology,
} from "@/data/constitution";

export const metadata: Metadata = {
  title: "Constitution",
  description:
    "MSAIL governance: the constitution of the Michigan Student Artificial Intelligence Lab.",
};

export default function ConstitutionPage() {
  return (
    <PageShell
      title="MSAIL Governance: A Brief Constitution"
      lead="The governing document of the Michigan Student Artificial Intelligence Lab."
      note={constitutionMeta.note}
    >
      <div className="mt-12 flex max-w-prose flex-col gap-10">
        <section className="flex flex-col gap-4">
          <SectionHeading>Terminology</SectionHeading>
          <dl className="flex flex-col gap-1 border-t border-border pt-4">
            {constitutionTerminology.map((t) => (
              <div key={t.term} className="flex gap-3">
                <dt className="font-semibold text-ink">{t.term}:</dt>
                <dd className="text-body text-muted">{t.definition}</dd>
              </div>
            ))}
          </dl>
        </section>

        {constitutionArticles.map((article) => (
          <section key={article.heading} className="flex flex-col gap-4">
            <SectionHeading>{article.heading}</SectionHeading>
            <div className="flex flex-col gap-4 border-t border-border pt-4">
              {article.paragraphs.map((p) => (
                <p key={p.slice(0, 40)} className="text-body text-muted">
                  {p}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </PageShell>
  );
}
