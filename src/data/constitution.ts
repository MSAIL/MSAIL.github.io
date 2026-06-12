import type { Flag } from "./content-status";
import { flag } from "./content-status";

/**
 * The MSAIL constitution, ported VERBATIM from the live site's `/constitution/`
 * page (captured in `../current-site-backup/constitution/`). Text is the
 * governing document — do not edit wording here without a ratification vote
 * (see Article 5); fix only rendering.
 */
export type ConstitutionArticle = { heading: string; paragraphs: string[] };

export const constitutionMeta: { lastUpdated: string; flag: Flag; note: string } = {
  lastUpdated: "2017-10-02",
  flag: flag(
    "stale",
    "Verbatim from the live site; stamped 2017-10-02. Article 7 requires re-ratification " +
      "within any 1024-day window — overdue; flag for the incoming board.",
  ),
  /** User-facing footnote (the flag note stays internal). */
  note: "Last updated October 2, 2017.",
};

export const constitutionTerminology: { term: string; definition: string }[] = [
  { term: "Cosine", definition: "The lead admin." },
  { term: "Sine", definition: "A member of the admin team." },
];

export const constitutionArticles: ConstitutionArticle[] = [
  {
    heading: "Article 0: MSAIL seeks to increase its members' Machine Learning knowledge.",
    paragraphs: [
      "Indeed. MSAIL will maintain a list of Members, defined as participants in at least one major communications channels such as Slack or a mailing list. MSAIL will strive to discuss Machine Learning literature regularly throughout each school year.",
      "Upon joining the organization, all members agree not to undermine the purpose or mission of MSAIL.",
      "It falls to the Cosine to execute this Article.",
    ],
  },
  {
    heading: "Article 1: Legislative powers lie in the Sines.",
    paragraphs: [
      "The body of Sines possesses complete power: a simple majority of Sines will suffice to amend this Constitution, to appoint a Cosine, to override any decision of the Cosine, or to act in place of the Cosine. Sines who are informed of a decision to be made but offer no prompt response are not counted in the denominator of the “simple majority”.",
      "The Sines will not allow the number of Cosines to fall below 1. By default, the Sines lie dormant and all powers and responsibilities lie with the Cosine.",
    ],
  },
  {
    heading: "Article 2: Executive powers lie in the Cosine.",
    paragraphs: [
      "Specifically, the Cosine is responsible for the day-to-day functioning of MSAIL, and to that end may act and delegate arbitrarily within Constitutional bounds. It is traditional for the Cosine to distribute significant short-term tasks among the Sines. The Cosine will report to the Sines, and the Sines will vote promptly on presented issues.",
      "The Cosine may appoint new Sines with the advice and consent of the old Sines. The Cosine will not allow the number of Sines to fall below 3. The Cosine shall break ties among the Sines. The Cosine may be a Sine.",
    ],
  },
  {
    heading: "Article 3: MSAIL may also have Faculty Mentors.",
    paragraphs: [
      "A faculty mentor can help us just by association. MSAIL may mention their names on its official communications. MSAIL shall inform each Faculty Mentor of its activities via brief weekly emails with no reply needed.",
      "Faculty mentors can point us to literature. Faculty mentors are always welcome to share cool papers. MSAIL may also request recommendations within a specific topic.",
      "A Faculty Mentor need not take on additional responsibilities, but may choose to do so if requested.",
      "The Sines and Cosine will endeavor to use Faculty Mentors’ time effectively. Faculty Mentors need not make any administrative decisions. Faculty Mentors are always welcome but never obliged to attend MSAIL meetings.",
    ],
  },
  {
    heading: "Article 4: MSAIL is committed to inclusivity and transparency.",
    paragraphs: [
      "MSAIL will not discriminate based on academic affiliation(s) or lack thereof, age, breastfeeding or lack thereof, career status, color, criminal record, disability or lack thereof, ethnicity, employment status, gender expression, gender identity, HIV status, marital status, national origin, parental status, personal association, physical features such as height and weight, political activity, pregnancy or lack thereof, race, religion or lack thereof, sex, sexual orientation, socioeconomic background, or veteran status.",
      "MSAIL will, moreover, actively include members, no matter the properties listed above. The creation and maintenance of an inclusive environment touches all aspects of our activities, from communications to recruitment and from discussion topics to leadership positions.",
      "MSAIL’s motto will be “the more, the merrier”; a corollary is that information such as planning discussions will be available to all members, so long as it does not conflict with privacy concerns.",
      "To rephrase a subset of the above in a university-required formula: MSAIL is committed to a policy of equal opportunity for all persons and does not discriminate on the basis of race, color, national origin, age, marital status, sex, sexual orientation, gender identity, gender expression, disability, religion, height, weight, or veteran status in its membership or activities unless permitted by university policy for gender specific organizations.",
      "It falls to the Cosine to execute this Article.",
    ],
  },
  {
    heading: "Article 5: This Constitution may be amended by the Sines.",
    paragraphs: [
      "Any Member may propose an amendment’s text. See Article 1 for voting details.",
    ],
  },
  {
    heading: "Article 6: This Constitution will be MSAIL's supreme law.",
    paragraphs: ["(Modulo University Policy.)"],
  },
  {
    heading: "Article 7: This Constitution will be ratified by the Sines.",
    paragraphs: [
      "This Constitution will be re-written and ratified at least once in any 1024-day window. See Article 1 for voting details.",
    ],
  },
];
