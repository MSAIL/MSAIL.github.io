import type { Flag } from "./content-status";
import { flag } from "./content-status";

/**
 * Resource library — the most substantive content on the live site
 * (CONTENT.md §1.5), captured from `../current-site-backup/resources/`.
 *
 * The "Learning Concepts" links below are VERIFIED from the backup and largely
 * evergreen, so they're carried forward in full. The remaining live sections
 * (Campus Involvement, Conferences, Medium articles, Meta-skills) are real but
 * visibly aging — course tables stamped "Last updated 9/23/21", conference links
 * pinned to 2021, a "Medium/Blog Articles" block still "under construction." They
 * are represented as flagged section stubs rather than re-published stale links.
 */
export type Resource = { label: string; href: string };
export type ResourceGroup = { title: string; items: Resource[] };

/** VERIFIED, evergreen — carried forward in full from the live page. */
export const learningConcepts: ResourceGroup[] = [
  {
    title: "Intro to Deep Learning",
    items: [
      { label: "fast.ai — Practical Deep Learning", href: "https://course.fast.ai/" },
      { label: "EECS 498/598 — Deep Learning for Computer Vision (U-M)", href: "https://web.eecs.umich.edu/~justincj/teaching/eecs498/FA2020/" },
      { label: "CS231n — Convolutional Neural Networks (Stanford)", href: "https://cs231n.stanford.edu/" },
    ],
  },
  {
    title: "Computer Vision",
    items: [
      { label: "EECS 442 — Computer Vision (U-M)", href: "https://web.eecs.umich.edu/~justincj/teaching/eecs442/WI2020/schedule.html" },
      { label: "Awesome Computer Vision", href: "https://github.com/jbhuang0604/awesome-computer-vision#readme" },
    ],
  },
  {
    title: "Natural Language Processing",
    items: [
      { label: "CS224n — NLP with Deep Learning (Stanford)", href: "https://web.stanford.edu/class/cs224n/index.html#schedule" },
      { label: "EECS 598 — NLP with Deep Learning (U-M)", href: "https://web.eecs.umich.edu/~wangluxy/courses/eecs598_fa2020/eecs598_fa2020.html" },
      { label: "Awesome NLP", href: "https://github.com/keon/awesome-nlp" },
      { label: "NLP Notes — Jacob Eisenstein", href: "https://github.com/jacobeisenstein/gt-nlp-class/blob/master/notes/eisenstein-nlp-notes.pdf" },
      { label: "Jay Alammar's Blog", href: "http://jalammar.github.io/" },
      { label: "The Annotated Transformer", href: "https://nlp.seas.harvard.edu/2018/04/03/attention.html" },
      { label: "Attention Is All You Need", href: "https://arxiv.org/abs/1706.03762" },
    ],
  },
  {
    title: "Reinforcement Learning",
    items: [
      { label: "CS 285 — Deep RL (UC Berkeley)", href: "http://rail.eecs.berkeley.edu/deeprlcourse/" },
      { label: "CS 234 — Reinforcement Learning (Stanford)", href: "https://www.youtube.com/watch?v=FgzM3zpZ55o" },
      { label: "Spinning Up in Deep RL (OpenAI)", href: "https://spinningup.openai.com/en/latest/" },
      { label: "Awesome RL", href: "https://github.com/aikorea/awesome-rl" },
      { label: "Sutton & Barto — Reinforcement Learning (2nd ed.)", href: "https://web.stanford.edu/class/psych209/Readings/SuttonBartoIPRLBook2ndEd.pdf" },
      { label: "Lilian Weng — Lil'Log (RL)", href: "https://lilianweng.github.io/lil-log/tag/reinforcement-learning" },
    ],
  },
];

/** Real live sections that exist but need a refresh before re-publishing. */
export type SectionStub = { title: string; summary: string; flag: Flag };

export const agingSections: SectionStub[] = [
  {
    title: "Campus Involvement",
    summary: "U-M AI/ML course tables (undergrad, grad, special-topics), research labs, and campus reading groups (CV / NLP / RL).",
    flag: flag("stale", 'Live course tables stamped "Last updated 9/23/21" — re-verify courses/terms before publishing.'),
  },
  {
    title: "Conferences",
    summary: "ICML, ICLR, NeurIPS, CVPR, ICCV, EMNLP, ACL, NAACL.",
    flag: flag("stale", "Several live links pinned to 2021 editions — switch to canonical hosts (icml.cc, etc.)."),
  },
  {
    title: "Medium / Blog Articles",
    summary: "Curated intro, CV, and NLP article picks.",
    flag: flag("stale", 'Live section marked "under construction" — finish or drop before publishing.'),
  },
  {
    title: "Meta-skills & Mindset",
    summary: "Advice on conducting research, reading papers, giving talks, and grad school.",
    flag: flag("verified", "Evergreen advice; light review only."),
  },
];

export const resourcesMeta: { intro: string; flag: Flag } = {
  intro: "A curated library for MSAIL members — foundational courses, campus involvement, conferences, and the meta-skills of doing research.",
  flag: flag(
    "verified",
    "Learning Concepts links verified from the live page; later sections need a date/link refresh.",
  ),
};
