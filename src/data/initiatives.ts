import type { Flag } from "./content-status";
import { flag, AWAITING_REFRESH } from "./content-status";

/**
 * Projects & Initiatives. The current program comes from Matthew McClure's
 * "Fall 2026 MSAIL Initiatives" doc in the org Drive; the ML Discussion
 * group's Winter 2021 lesson archive below it is carried over from the old
 * site's `/education/` and `/previous_material/*` with every link verbatim
 * (Google Slides, Colab notebooks, Drive recordings, one Zoom share link).
 */
export type InitiativeLink = { label: string; href: string };

export type Initiative = {
  name: string;
  description: string;
  level: string;
  lead: string;
  /** Meeting cadence + room, where the lead has settled one. */
  meets?: string;
  links: InitiativeLink[];
};

export const initiativesMeta: { flag: Flag; notice: string } = {
  flag: flag("awaiting", "Santosh Desai's project initiative is unscoped in the doc. " + AWAITING_REFRESH),
  /** User-facing copy for the placeholder (the flag note stays internal). */
  notice:
    "One more project initiative is being scoped for this term. Join the " +
    "Slack to hear about it first.",
};

export const initiatives: { flag: Flag; items: Initiative[] } = {
  flag: flag(
    "verified",
    "Fall 2026 program per Matthew's initiatives doc (re-read 2026-08-16; Competitive Build " +
      "days changed to Friday OR Tuesday). Sofiya's two entries (ML in the News, the CNN " +
      "course) come from her own message of 2026-09-01, which supersedes the doc for those. " +
      "Santosh Desai's entry is still empty and held back.",
  ),
  items: [
    {
      name: "Competitive Build Initiative",
      description:
        "Team up with other MSAIL members for AI competitions and long-term hackathons.",
      level: "Open",
      lead: "Matthew McClure",
      meets: "Fridays or Tuesdays 6 to 8pm, EECS 4440",
      links: [],
    },
    {
      name: "AI Research Project Team",
      description:
        "Join a small team of student researchers working directly with a lab PI, contributing " +
        "to a real research project from planning to completion. Projects run at least a " +
        "semester, with two teams planned per term; this fall's tentative partner is the AIMS " +
        "lab in Nuclear Engineering and Radiological Sciences. Python experience required, " +
        "research experience not.",
      level: "Python required",
      lead: "Shamanth Shastry",
      meets: "Tuesdays and Thursdays 6 to 8pm, EECS GBL 1761",
      links: [],
    },
    {
      name: "Model Mining: Alignment & Interp",
      description:
        "Hands-on work with language models: extracting the behaviors you want, then using " +
        "evals and mechanistic interpretability to check alignment and understand what is " +
        "going on inside. Tentative topics include SFT, DPO, RL, causal steering, evals, and " +
        "patching. Neural network experience required; LLM or math background helps.",
      level: "Neural network experience required",
      lead: "Dmitriy Ivkov",
      meets: "Tuesdays and Thursdays (tentative)",
      links: [],
    },
    {
      name: "Building a Convolutional Neural Network",
      description:
        "Learn how to build a convolutional neural network from the ground up over the course " +
        "of the semester. This initiative is designed for everyone from beginners with no " +
        "programming experience to students who already code but have never applied their " +
        "skills to AI. We'll work through the fundamentals of Python, neural networks, image " +
        "classification, model training, and evaluation, with each session building toward a " +
        "final CNN of your own.",
      level: "Open, no coding experience needed",
      lead: "Sofiya Goncharova",
      meets: "Mondays 6 to 7pm, EECS 1008",
      links: [],
    },
    {
      name: "ML in the News",
      description:
        "Come sit in as we break down AI and machine learning concepts through research paper " +
        "summaries and deep dives of major news stories. Learn more about the technology you " +
        "either can't get rid of or can't get enough of. Each week, we'll work to better " +
        "understand the methods, claims, and real-world implications behind new developments " +
        "in AI.",
      level: "Open, show up any week",
      lead: "Sofiya Goncharova",
      meets: "Mondays 7 to 8pm, EECS 1008",
      links: [],
    },
  ],
};

/** One lesson from the discussion group's archive, links verbatim. */
export type Lesson = { title: string; links: InitiativeLink[] };

export const mlDiscussionArchive: {
  term: string;
  intro: string;
  flag: Flag;
  lessons: Lesson[];
} = {
  term: "Winter 2021",
  intro:
    "Material from the discussion group's Winter 2021 lesson series: slides, " +
    "notebooks, and recordings, as the group posted them.",
  flag: flag(
    "verified",
    "Carried over 2026-06-12 from /previous_material/* with every link verbatim. " +
      "Drive/Zoom recordings may require U-M or org-account access; not independently playable-checked.",
  ),
  // Chronological (the live index listed newest first).
  lessons: [
    {
      title: "Classification with Logistic Regression",
      links: [
        { label: "Slides", href: "https://docs.google.com/presentation/d/1YVw4T0E_f6m0NovhS3YbwAMLns0tQfFE/edit#slide=id.p1" },
        { label: "Colab notebook", href: "https://colab.research.google.com/drive/1Cein0r-J9N2vX1xh24cRLEHgBkJx3p7w?authuser=1#scrollTo=ubgi9PVZDDgU" },
        { label: "Linear algebra primer", href: "https://builtin.com/data-science/basic-linear-algebra-deep-learning" },
        { label: "Python basics (Kaggle)", href: "https://www.kaggle.com/learn/python" },
      ],
    },
    {
      title: "Regression, Part 1 (Theory and Implementation)",
      links: [
        { label: "Slides", href: "https://docs.google.com/presentation/d/1VHWuE_lqbKnDKZ8HKbVcLArbe8cMWKsd_61FY4FTn-E/edit?usp=sharing" },
        { label: "Colab notebook", href: "https://colab.research.google.com/drive/18MoSHNwUnEKwvokZAZA1AcLc6AJ3Bs81?usp=sharing" },
        { label: "Recording (Zoom)", href: "https://umich.zoom.us/rec/share/94fSO_w_AT68Td2e0Qr_kckIVBepdNLecMn5mTvFOH994JWIkKSZLl3u9xpFr6J6.oj49dWOJeBFBzPA2" },
      ],
    },
    {
      title: "Regression, Part 2 (Application)",
      links: [
        { label: "Colab notebook", href: "https://colab.research.google.com/drive/12nmYKp5IcUdUiZmrHaUK7YsUu1vIOXkj?usp=sharing" },
      ],
    },
    {
      title: "Convolutional Neural Networks",
      links: [
        { label: "Slides (CNNs)", href: "https://docs.google.com/presentation/d/1522OsXalZScvuUxXrOTbUZuISZUY-HqO" },
        { label: "Slides (neural networks)", href: "https://docs.google.com/presentation/d/16TMR2sM9T75qALw3CCigUF_JxMQ5gceM" },
      ],
    },
    {
      title: "Introduction and Basics of Deep Learning",
      links: [
        { label: "Slides", href: "https://docs.google.com/presentation/d/1SkI0i1Y_Dp1lZTCJjJD91f0DVf_CXfB4FMBy8jLweeg/edit?usp=sharing" },
        { label: "Recording", href: "https://drive.google.com/file/d/1lNhpuuxNhW5nHDLavDLqlLOKv-DYfMhO/view?usp=sharing" },
      ],
    },
    {
      title: "Computer Vision",
      links: [
        { label: "Slides", href: "https://docs.google.com/presentation/d/1MaC9d25kJybNv_pOYQHFv9oNOM1J-65zMkQX2PMlCqg/edit?usp=sharing" },
        { label: "Recording", href: "https://drive.google.com/file/d/15WxV2hC40Bz4YhcyPVeYqb1gvIViq2Ka/view?usp=sharing" },
      ],
    },
    {
      title: "Natural Language Processing",
      links: [
        { label: "Slides", href: "https://docs.google.com/presentation/d/178FNnk3x8euXO3NHBqQT9VT6-d9FigUVOt56Ru-Lvpo/edit?usp=sharing" },
        { label: "Recording", href: "https://drive.google.com/file/d/1DjwaY3p7vb4N4V7DwvZEBQB2qxjs5okS/view?usp=sharing" },
      ],
    },
    {
      title: "Unsupervised Learning",
      links: [
        { label: "Slides", href: "https://docs.google.com/presentation/d/1H77BDYebNusyelevFe5-AHZzYCaOB1tid-Vqtmm13oI/edit?usp=sharing" },
        { label: "Recording", href: "https://drive.google.com/file/d/1WXBrrbNDryufUYkzQS1aLwrEcJRbo-xS/view?usp=sharing" },
      ],
    },
    {
      title: "Ethics",
      links: [
        { label: "Slides", href: "https://docs.google.com/presentation/d/1KUUqzdz-Te1oNS4AMnxxPqO_mFUpmkDNokr0As9rCHQ/edit?usp=sharing" },
        { label: "Recording", href: "https://drive.google.com/file/d/1C-bWWrhh_hK6ZwNmLEYK95uLJ6eiCbi1/view?usp=sharing" },
      ],
    },
    {
      title: "Lightning Round: Assorted AI Topics",
      links: [
        { label: "Slides", href: "https://docs.google.com/presentation/d/1uQzkFpr4LyslagkloUHs5lnCQ3wNmVLfuaa7UsbTaGA/edit?usp=sharing" },
        { label: "Recording", href: "https://drive.google.com/file/d/169IpCxkST0Fjp7LjQgpdfiDz-Ccs1K-v/view?usp=sharing" },
      ],
    },
  ],
};
