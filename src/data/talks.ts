import type { Flag } from "./content-status";
import { flag } from "./content-status";

/**
 * MSAIL talks archive — VERIFIED titles + speakers, captured from the live-site
 * talk archive (`../current-site-backup/talk/*`). 37 talks spanning 2020–2024.
 *
 * Flagged caveats:
 *  - Dates: the live archive encodes a date only in each talk's slug, with an
 *    inconsistent format (mostly mmddyy; the two 2024 tech talks look ddmmyy).
 *    Only the YEAR is reliable, so that's all we publish; `year: null` means the
 *    slug carried no date at all. Exact dates / slides / recordings are unlinked.
 *  - The series shows nothing newer than early 2024 — treat as an ARCHIVE until
 *    talks resume (see CONTENT.md §1.4).
 *  - The Andrew Ng quote that opened the old Talks page is intentionally DROPPED.
 */
export type Talk = {
  title: string;
  /** Speaker(s), as the live archive lists them. */
  speaker: string;
  /** Reliable from the slug; null when the slug carried no date. */
  year: number | null;
  /** Live-archive slug (also the source-of-truth id). */
  slug: string;
};

export const talksArchive: Talk[] = [
  { title: "MSAIL TECH TALK w/ Kiran Prasad", speaker: "Kiran Prasad", year: 2024, slug: "prasad_210324" },
  { title: "MSAIL TECH TALK w/ Wesley Tian", speaker: "Wesley Tian", year: 2024, slug: "wesleytian_240324" },
  { title: "An Overview of Attention and Transformer Mechanisms for NLP", speaker: "Nisreen Bahrainwala", year: 2022, slug: "attention_031522" },
  { title: "An Overview of Binarized Neural Networks", speaker: "Timothy Baker", year: 2022, slug: "bnn_041222" },
  { title: "Concrete Problems in AI Safety", speaker: "Ashwin Sreevatsa", year: 2022, slug: "aisafety_012522" },
  { title: "Fairness in Machine Learning", speaker: "Serafina Kamp", year: 2022, slug: "fairness_032222" },
  { title: "Machine Learning for Intraoperative Diagnosis of Brain Tumors Imaged using Stimulated Raman Histology", speaker: "Cheng Jiang", year: 2022, slug: "brain_tumor_040522" },
  { title: "Open Problems in Cooperative AI", speaker: "Ashwin Sreevatsa", year: 2022, slug: "cooperative_022222" },
  { title: "Scaling Neural Tangent Kernels via Sketching and Random Features", speaker: "Kevin Wang", year: 2022, slug: "ntk_020122" },
  { title: "The Devil is in the Details: Spatial and Temporal Super-Resolution of Global Climate Models using Adversarial Deep Learning", speaker: "Sanjeev Raja", year: 2022, slug: "climate_adversarial_032922" },
  { title: "AlphaFold 2 and the Protein Folding Problem", speaker: "Ashwin Sreevatsa", year: 2021, slug: "alphafold_2_092021" },
  { title: "Contrastive Learning with Hard Negative Samples", speaker: "Kevin Wang", year: 2021, slug: "contrastive_hns_110121" },
  { title: "Deep RL for Robotics: A Short Overview", speaker: "Nikhil Devraj", year: 2021, slug: "deeprlrobotics_021621" },
  { title: "How We Built This: TDM Studio and Sentiment Analysis", speaker: "Dan Hepp and John Dillon", year: 2021, slug: "proquest_041321" },
  { title: "Human-in-the-Loop Natural Language Processing", speaker: "Dr. Jonathan Kummerfeld", year: 2021, slug: "jkk_120621" },
  { title: "Intelligent Politics: How AI Can Improve Our Political Institutions and Systems", speaker: "Andong Luis Li Zhao", year: 2021, slug: "politics_ai_systems_040521" },
  { title: "Latent Semantic Analysis", speaker: "Nisreen Bahrainwala", year: 2021, slug: "lsa_102521" },
  { title: "Learning Effective Representations for Small Molecules", speaker: "Mukundh Murthy", year: 2021, slug: "chemdesc_092721" },
  { title: "Michigan AI Alumni Panel", speaker: "Anthony Zheng, Kiran Prasad, Andong Li Zhao, Christian Kavouras", year: 2021, slug: "alumni_panel111521" },
  { title: "Speech Emotion Recognition with ML", speaker: "Lance Ying", year: 2021, slug: "speech_emotion_recog_100421" },
  { title: "Understanding MLOps for Computer Vision Pipelines", speaker: "Datature Team", year: 2021, slug: "datature_110821" },
  { title: "AlphaZero and its Impact on the World of Chess", speaker: "Kevin Wang", year: 2020, slug: "alphazero_chess_092920" },
  { title: "Bloomberg Tech Talk: Applied Named Entity Recognition", speaker: "Daniel Preotiuc-Pietro and Mayank Kulkarni", year: 2020, slug: "ner_090920" },
  { title: "Brain-Inspired AI", speaker: "John Day", year: 2020, slug: "brain_insp_110320" },
  { title: "Faculty Talk: Cognitive Architecture", speaker: "Professor John Laird", year: 2020, slug: "laird_102720" },
  { title: "Faculty Talk: Prediction Markets and More", speaker: "Dr. Sindhu Kutty", year: 2020, slug: "kutty_111720" },
  { title: "Faculty Talk: Situated Language Processing and Embodied Dialogue", speaker: "Prof. Joyce Chai", year: 2020, slug: "chai_120120" },
  { title: "Faculty Talk: Strategic Reasoning in Dynamic Environments", speaker: "Professor Michael Wellman", year: 2020, slug: "wellman_092220" },
  { title: "Human-Centered Autonomous Vehicles", speaker: "Patrick Morgan", year: 2020, slug: "av_100620" },
  { title: "Image-to-Image Translation with Conditional Adversarial Networks", speaker: "Andrew Awad", year: 2020, slug: "cgan_102020" },
  { title: "Reinforcement Learning Applied to COVID-19 Optimization Problems", speaker: "Nikhil Devraj", year: 2020, slug: "rlcovid_101320" },
  { title: "Text Summarization with Deep Learning", speaker: "Yashmeet Gambhir", year: 2020, slug: "textsummarization_111020" },
  { title: "The Trend Towards Large Language Models", speaker: "Sean Stapleton", year: 2020, slug: "gpt3_091520" },
  { title: "Cognitive Load Estimation", speaker: "Patrick Morgan", year: null, slug: "cognitive_load_estimation" },
  { title: "Harmful Bias in Natural Language Generation", speaker: "Yashmeet Gambhir", year: null, slug: "harmful_bias_nlg" },
  { title: "Proving Theorems with Generative Language Models", speaker: "Ashwin Sreevatsa", year: null, slug: "generative_language_modeling" },
  { title: "Using Transformers for Vision", speaker: "Andrew Awad and Drake Svoboda", year: null, slug: "image-worth-16x16-words" },
];

export const talksMeta: { span: string; flag: Flag } = {
  span: "2020 \u2013 2024",
  flag: flag(
    "verified",
    "Titles + speakers verified from the live-site archive. Dates are year-only " +
      "(slug-encoded, inconsistent format); slides/recordings not yet linked; " +
      "series appears paused after early 2024.",
  ),
};
