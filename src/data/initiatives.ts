import type { Flag } from "./content-status";
import { flag } from "./content-status";

/**
 * Projects & Initiatives.
 *
 * SOURCE OF TRUTH: this file, plus whatever the leads say directly. The
 * "Fall 2026 MSAIL Initiatives" Drive doc that the descriptions originally came
 * from was RETIRED by Matthew on 2026-09-06 ("I don't think there is any point
 * in maintaining it"). It was a planning scratchpad, and it still contains the
 * superseded times and rooms, so do not re-read it into this file. Anything new
 * comes from the lead or the president directly.
 *
 * The ML Discussion group's Winter 2021 lesson archive below is carried over
 * from the old site's `/education/` and `/previous_material/*` with every link
 * verbatim (Google Slides, Colab notebooks, Drive recordings, one Zoom share).
 */
export type InitiativeLink = { label: string; href: string };

/**
 * A room students have to physically find. `code` is what appears on the U-M
 * schedule and on our posters; `building` is the full name from the Registrar's
 * own location-abbreviation list (ro.umich.edu/calendars/schedule-of-classes/
 * locations), checked 2026-09-03. The full name is what the map is asked for,
 * because a bare code like "ALH 2012" geocodes to nothing. Note the campus
 * split: EECS, GGBL and CSRB are North Campus, Alice Lloyd is on the Hill.
 */
export type Room = { code: string; building: string };

export type Initiative = {
  name: string;
  description: string;
  level: string;
  lead: string;
  /** Meeting cadence, where the lead has settled one, e.g. "Fridays 6 to 8pm". */
  when?: string;
  room?: Room;
  links: InitiativeLink[];
};

/** Google Maps directions to a room's building. Works as an app hand-off on phones. */
export function directionsUrl(room: Room): string {
  const destination = `${room.building}, University of Michigan, Ann Arbor, MI`;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}

const EECS: Room = {
  code: "EECS 1008",
  building: "Electrical Engineering and Computer Science Building",
};

export const initiatives: { flag: Flag; items: Initiative[] } = {
  flag: flag(
    "verified",
    "Fall 2026 program, all five slots CONFIRMED by Matthew on 2026-09-06 after a written " +
      "query, so do not re-open them without a newer instruction. Descriptions are the leads' " +
      "own words (Shamanth's KPIT rewrite 2026-09-02; Sofiya's two entries 2026-09-01). Times " +
      "and rooms are Matthew's list of 2026-09-03 with one correction: he had swapped Sofiya's " +
      "Monday pair arbitrarily, and on 2026-09-06 deferred to her, so the CNN course is back at " +
      "6 and ML News at 7 as she originally asked. He separately confirmed the Industry Project " +
      "is Tuesday only (Shamanth's doc had asked for Thursday too) and Model Mining is Thursday " +
      "only in ALH 2012, which is on the Hill rather than North Campus. Santosh Desai's entry " +
      "and the 'one more incoming' notice are gone; see the note in about.ts, where his roster " +
      "status is still an open question.",
  ),
  items: [
    {
      name: "Competitive Build Initiative",
      description:
        "Team up with other MSAIL members for AI competitions and long-term hackathons.",
      level: "Open",
      lead: "Matthew McClure",
      when: "Fridays 6 to 8pm",
      room: { code: "GGBL 2517", building: "G. G. Brown Laboratory" },
      links: [],
    },
    {
      name: "Industry Project Team",
      description:
        "Join a five-person team of student consultants and a project manager, working with " +
        "industry professionals at the automotive supplier KPIT to build a full-scale automation " +
        "tool from planning to deployment. Projects run at least a semester and focus on automating testing, safety, " +
        "or company processes, with extensive full-stack development alongside agentic AI " +
        "integration. Python experience is required. React, Next.js or Node.js, and database " +
        "experience are preferred; industry experience is not required. We're looking for " +
        "balanced teams with both frontend and backend experience.",
      level: "Python required",
      lead: "Shamanth Shastry",
      when: "Tuesdays 6 to 8pm",
      room: { code: "CSRB 2230", building: "Climate and Space Research Building" },
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
      when: "Thursdays 6 to 8pm",
      room: { code: "ALH 2012", building: "Alice Lloyd Hall" },
      links: [],
    },
    // Sofiya's two Monday sessions run back to back in EECS 1008, so they are
    // listed in the order you would attend them. This is the order she asked
    // for on 2026-09-01: Matthew's 2026-09-03 list had reversed the hours, but
    // he picked that order arbitrarily and deferred to hers on 2026-09-06.
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
      when: "Mondays 6 to 7pm",
      room: EECS,
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
      when: "Mondays 7 to 8pm",
      room: EECS,
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
