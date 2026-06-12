import type { Flag } from "./content-status";
import { flag, AWAITING_REFRESH } from "./content-status";

/**
 * Projects & Initiatives, carried over from the live site (CONTENT.md §1.3):
 * the four cards on `/projects/` plus the ML Discussion group's Winter 2021
 * lesson archive from `/education/` and `/previous_material/*` — every link
 * preserved verbatim (Google Slides, Colab notebooks, Drive recordings, one
 * Zoom share link).
 *
 * Still a refresh target: org leadership has new initiatives incoming, and the
 * listed leads are from the outgoing roster. The page renders this set as the
 * published program alongside the "new initiatives incoming" notice.
 */
export type InitiativeLink = { label: string; href: string };

export type Initiative = {
  name: string;
  description: string;
  level: string;
  /** Lead as published on the live site (outgoing roster; re-confirm). */
  lead: string;
  links: InitiativeLink[];
};

export const initiativesMeta: { flag: Flag; notice: string } = {
  flag: flag("awaiting", "New initiatives incoming. " + AWAITING_REFRESH),
  /** User-facing copy for the placeholder (the flag note stays internal). */
  notice:
    "We're putting together this term's projects and reading groups. Join " +
    "the Slack to hear about them first.",
};

export const initiatives: { flag: Flag; items: Initiative[] } = {
  flag: flag(
    "verified",
    "Carried over 2026-06-12 from the live /projects/ page (descriptions lightly tightened). " +
      "Leads are from the outgoing roster; re-confirm with the incoming team.",
  ),
  items: [
    {
      name: "Transformer Project",
      description: "Replicate the GPT-2 transformer architecture and build it into a personal project.",
      level: "Advanced",
      lead: "Yuchen Wang",
      links: [],
    },
    {
      name: "CNN Project",
      description: "Replicate a CNN architecture from scratch and build it into a personal project.",
      level: "Beginner",
      lead: "David Smith",
      links: [],
    },
    {
      name: "Education",
      description: "Earn certifications from DeepLearning.AI in a drop-in format.",
      level: "Open, show up any week",
      lead: "Omkar Nayak",
      links: [{ label: "DeepLearning.AI", href: "https://www.deeplearning.ai" }],
    },
    {
      name: "ML News",
      description:
        "Paper and machine learning news discussion, from new models to applications to regulation, with optional presentations.",
      level: "Open, show up any week",
      lead: "Alexander Bowler",
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
