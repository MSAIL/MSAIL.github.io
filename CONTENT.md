# MSAIL Website Content Inventory

_Inventory date: 2026-06-08. For migration planning ahead of a redesign._

## ⚠️ Scope note: there are TWO content sources

The repo you opened (`MSAIL.github.io-source`, Pelican) is the **abandoned 2016 site**. The **live `msail.github.io` is a different, current Hugo site** built from `Nivedhitha-dp/MSAIL` (a maintainer's personal account) — see `ANALYSIS.md` for the full story. **The content that actually needs migrating is the LIVE site's** (2020–2025): About Us, Initiatives, Talks, Resources, Alumni, etc. This inventory therefore leads with the **live** site (Part 1) and treats the 2016 Pelican content as a historical archive (Part 2).

> **Inspection note:** live-site content was captured over the network (page fetches + the published output repo). Names/roles/links are quoted as the live pages render them today; verify spellings and email aliases against the source before publishing. Legacy-repo content (Part 2) is quoted from local files with line cites.

---

## 🚩 Priority refresh targets (per org leadership)

You named **"Projects & Initiatives"** and **"About Us"** as the two pages to refresh, and flagged both as likely stale. **Correction to my first read:** both pages **DO exist on the live site** (they only don't exist in this old Pelican repo). They are real, and they are stale in exactly the way you'd expect.

> ### AWAITING FRESH CONTENT (incoming this week)
> New **admin/leadership roster** and **upcoming initiatives** are arriving this week. **Do not treat the current copy below as final** — it is the *outgoing* version, captured so nothing is lost in the swap. The fresh content slots in as follows:

| Incoming content | Replaces (current live copy) | Where it's edited (source of truth) |
|---|---|---|
| **New admin / leadership roster** | The "Admin Team" + "Faculty Mentors" lists on **`/aboutus/`** (current: 11 admins + Dr. Wei Hu — table below) | `content/` for the About page in the Hugo source repo **`Nivedhitha-dp/MSAIL`** (a personal acct — see governance risk in ANALYSIS.md) |
| **Upcoming initiatives** | The 4 initiatives on **`/projects/`** (current: Transformer, CNN, Education, ML News — table below) | `content/projects/` (Academic-theme "projects" items) in **`Nivedhitha-dp/MSAIL`** |

**Both pages are PRIORITY + stale today:** the About page still shows "Copyright MSAIL 2023" and a roster that predates this year's team; the Initiatives page lists only 4 items with no dates, status, or outcomes. When the fresh roster/initiatives land, also refresh: the homepage "Upcoming Talks"/calendar block, and the Alumni page.

---

# Part 1 — LIVE site content inventory (`msail.github.io`) — _this is what migrates_

### 1.1 Homepage (`/`)

| Element | Current content | Keep / Rewrite / Drop | Reason |
|---|---|---|---|
| Hero tagline | "A student organization focused on exploring cutting-edge artificial intelligence education, application and research." | **Keep / light rewrite** | On-message; fine to carry forward |
| "What is MSAIL?" | "MSAIL is a student organization devoted to artificial intelligence research. We strive to spread our passion for AI throughout the University of Michigan student body, regardless of demographic or academic standing." | **Keep / rewrite** | Good mission statement; tighten and pair with a clear Join CTA |
| "Upcoming Talks" | Pulls from the Talks collection | **Rewrite (data-driven)** | Must reflect the *current* semester; currently risks showing nothing/old |
| "MSAIL Fall 2025 Calendar" | Embedded calendar | **Rewrite** | Update each term; verify it's not an empty/locked embed |
| Footer | "Copyright MSAIL 2023" | **Rewrite** | Hardcoded year is stale (content runs to 2025); make it auto-year |
| Andrew Ng quote (carried over from 2016, appears on Talks page) | "...if you read research papers consistently... there's no one there to pat you on the back..." | **Drop** | Borrowed 2015 voice; survived two site generations; off-brand for recruiting |

### 1.2 About Us (`/aboutus/`) — 🚩 PRIORITY · AWAITING FRESH ROSTER

Current copy (the *outgoing* roster — fresh team replaces this):

> "MSAIL is a large organization of over 400 members, and as such requires our Admin Team to help keep operations running smoothly."

**Faculty Mentor:** Dr. Wei Hu — Assistant Professor, Computer Science & Engineering.

**Admin Team (current live, to be replaced this week):**

| Name | Role | Email |
|---|---|---|
| Nathan Kawamoto | Co-president | njkamoto@umich.edu |
| Usman Ghani | Co-president | mghani@umich.edu |
| Aman Nagesh | Recruiting/Outreach | amannag@umich.edu |
| Nivedhitha Dondati Purushotham | Mentorship & Web Experience Lead | nividp@umich.edu |
| Abubakar Siddi | Industry Project Lead | siddiq@umich.edu |
| Grace Wu | Industry Project Co-Lead | gracejwu@umich.edu |
| Yuchen Wang | Project Lead | wangyuch@umich.edu |
| David Smith | Project Lead | smitd@umich.edu |
| Omkar Nayak | Education | omkarn@umich.edu |
| Sathvika A | Industry Project Coordinator | sayyappr@umich.edu |
| Alexander Bowler | ML Papers and News | albowler@umich.edu |

**Recommendation:** **Rewrite/replace** wholesale with the incoming roster. Migration improvements: make the roster a **data file** (YAML/JSON) so it's editable without touching templates; add a one-line bio + photo per person; add a short "what MSAIL is / history / faculty" narrative (the current page is almost entirely the team list). Keep "400+ members" only if still accurate.

### 1.3 Projects & Initiatives (`/projects/`) — 🚩 PRIORITY · AWAITING FRESH INITIATIVES

Current initiatives (the *outgoing* set — fresh initiatives replace/extend this):

| Initiative | Description | Level / Format | Lead | Keep/Rewrite/Drop |
|---|---|---|---|---|
| Transformer Project | "Replicate the GPT-2 transformer architecture and build into personal project" | Advanced | Yuchen Wang | **Rewrite** — refresh lead & status |
| CNN Project | "Replicate CNN architecture from scratch and build into personal project" | Beginner | David Smith | **Rewrite** — refresh lead & status |
| Education | Earn certifications from deeplearning.ai (links deeplearning.ai) | Open / drop-in | Omkar Nayak | **Rewrite** |
| ML News | "Join in on laid-back paper and machine learning news discussion" | Open / drop-in | Alex Bowler | **Rewrite / merge** with the Education/ML-Discussion page (overlaps) |

**Recommendation:** **Rewrite** with the incoming initiatives. Improvements: add **status** (active/recruiting/completed), **term**, and **outcomes/links** (repos, demos, results) per initiative — the current cards are description-only and undated. Consider a "project showcase" treatment that highlights finished work (strong recruiting signal). Note overlap between "ML News" here and the "ML Discussion" page (§1.8) — consolidate.

### 1.4 Talks (`/talk/`)

A Hugo/Academic "talks" archive, **Sept 9, 2020 → Mar 28, 2024** (note: nothing newer than early 2024 — looks stalled). Selected speakers: Wesley Tian, Kiran Prasad (2024); Timothy Baker, Cheng Jiang, Sanjeev Raja, Serafina Kamp, Nisreen Bahrainwala, Ashwin Sreevatsa, Kevin Wang (2022); Dr. Jonathan Kummerfeld, Datature, an Alumni Panel (2021); Prof. Joyce Chai, Sean Stapleton (2020). Opens with the carried-over Andrew Ng quote.

**Recommendation:** **Keep as an archive** (genuine, valuable history) but (a) **drop the Andrew Ng quote**, (b) resume adding talks or clearly label the section as an archive if the talk series has ended, (c) ensure each talk has speaker + affiliation + date + (ideally) slides/recording links.

### 1.5 Resources (`/resources/`)

Large curated library: "a conglomeration of resources for MSAIL members." Sections: **Learning Concepts** (Intro to DL, Computer Vision, NLP, RL — fast.ai, EECS 498/598, CS231n, CS224n, CS285, Spinning Up, Sutton & Barto, etc.); **Campus Involvement** (Undergrad/Grad/Special-Topics UM course tables stamped "**Last updated 9/23/21**", research labs, three UM reading groups — CV/NLP/RL); **Conferences** (ICML/ICLR/NeurIPS/CVPR/ICCV/EMNLP/ACL/NAACL, several pointing at 2021 editions); **Medium/Blog articles** (marked "**under construction**"); **Meta-skills** (research/paper-reading/talks/grad-school advice). Contact: `msail-admin@umich.edu`. Footer "Copyright MSAIL 2023."

**Recommendation:** **Keep & refresh.** This is the most substantive content on the site and worth preserving. But it's visibly aging: course tables "Last updated 9/23/21", conference links pinned to 2021, a section still "under construction." **Rewrite** dates/links; finish or drop the "under construction" block; de-link rotted conference-year URLs (use canonical `icml.cc` etc.).

### 1.6 Contact (`/contact/`)

Primary email **`msail-admin@umich.edu`**; points to the About page for individual admin emails. A "Cite" heading is present. **No social media, Discord, or form** on this page.

**Recommendation:** **Keep / expand** — add Slack, mailing-list, and any socials here so Contact is the single hub. Verify the `msail-admin@umich.edu` alias is live.

### 1.7 Join / Sign up (`/join`)

Two channels: **MCommunity group** ("Michigan Student AI Lab" — https://mcommunity.umich.edu, "Join Group") and **Slack** (https://join.slack.com/t/msail-team/signup; the header also links `https://msail-team.slack.com`). No Google Form, no Discord.

**Recommendation:** **Keep** — this is the real join funnel. Improvements: surface it more prominently (a homepage hero CTA), confirm the Slack invite link hasn't expired, and consider whether MCommunity + Slack is enough or a newsletter is wanted.

### 1.8 Education / "ML Discussion" (`/education/`)

Describes the **ML Discussion** group: "Thursday 7:00–8:00 at NUB 1567," optional member paper presentations; links "Previous Material – Winter 2021" (`/previous_material/`).

**Recommendation:** **Rewrite & rename.** The label "Education" doesn't match the content ("ML Discussion"); the room/time may be stale; "Previous Material – Winter 2021" is 4+ years old. Consolidate with the "ML News" initiative (§1.3) — they're the same activity.

### 1.9 Alumni (`/alumni/`)

A portrait gallery of **15 past members with membership periods only — no outcomes**: Robert Aung (F20), Andrew Awad (W21), Kierra Davis (W21), Nikhil Devraj (F20), Isaac Fung (W22), Abhay Shakhapur (W24), Andrew Li (W24), Anthony Liang (W20 BS / W21 MS), Patrick Morgan (W21), Ashwin Sreevatsa (W22), Sean Stapleton (F20), Kevin Wang (F21), Nina Li (W23), Chloe Snyders (W23), William Wang (W24). The page invites past members to submit info.

**Recommendation:** **Keep but upgrade — high recruiting value.** Right now it's photos + dates. The single most valuable add for recruiting is **"where they went"** (company / grad school / role). This is the closest thing to a "member outcomes" page and it currently omits the outcome. See Missing-but-expected (§3).

### 1.10 Other live routes

| Route | Content | Recommendation |
|---|---|---|
| `/admin/` | Admin-related page | Audit; likely fold into About |
| `/constitution/` | Org constitution doc | **Keep** (governance) — verify it's current |
| `/previous_material/` | Archived material ("Winter 2021") | **Keep as archive** or drop if dead |
| `/post/`, `/slides/`, `/media/`, `/tag(s)/`, `/categories/`, `/author(s)/`, `/publication_types/`, `index.json/.xml` | Hugo/Academic system + taxonomy scaffolding | N/A — regenerated by the SSG; not hand-content |

### 1.11 External links & channels (live)

| Destination | Where | Keep/Rewrite/Drop |
|---|---|---|
| `msail-admin@umich.edu` | Contact, Resources | **Keep** — verify alias active |
| MCommunity group "Michigan Student AI Lab" | Join | **Keep** — primary mailing list |
| Slack `msail-team` (join + workspace links) | Join, header | **Keep** — verify invite not expired |
| deeplearning.ai | Initiatives (Education) | **Keep** |
| ~dozens of course/paper/blog/conference links | Resources | **Keep; link-check** (many pinned to 2021) |
| Individual admin `@umich.edu` emails | About Us | **Replace** with incoming roster |
| Social media (X/Instagram/LinkedIn), Discord | — | **ABSENT** — see §3 |

---

# Part 2 — LEGACY Pelican repo content (2016) — historical archive

This is the content in *this* checkout. It is ~10 years old; **almost all is DROP or ARCHIVE.** The one genuinely worth-migrating asset is the event archive.

### 2.1 Legacy homepage & leadership (`theme/templates/index.html`)
- Mission paragraph + **Andrew Ng HuffPost quote** (`index.html:6-14`) — **Drop** (the quote already leaked onto the live Talks page; kill it there too).
- "Active Leadership" grid, **6 people hardcoded** (`index.html:68-117`): Aaron Pollack (BS'17), Alex Chojnacki (BS'17), Benjamin Bray (BS'17), Cheng-Yu Dai (PhD), Sam Tenka (BS'18), Spencer Buja (BS'16) — **Drop as current**; optional historical/alumni note. Portraits in `theme/static/images/leadership/`.
- Footer "Website by Benjamin Bray (benrbray@umich.edu)" (`base.html:54`) — **Drop** (personal alumni email).

### 2.2 Legacy pages (`content/pages/`)
| Page | Content | Reco |
|---|---|---|
| `schedule.md` (Order 100) | Google Calendar iframe (`umich.edu_imffl9oecd54ijml7ol1bv42l8`) | **Drop** — dead 2016 calendar |
| `activities.md` (Order 200) | Tutorials/Reading Group/Hack Nights (Tue 5:30 DOW 2166) + MDST (Thu 7:00 DOW 3150, org. Jonathan Stroud, adv. Prof. Jacob Abernethy). Links: kaggle/titanic, aima.cs.berkeley.edu, **malformed `umdst.com` (no `http://`)**, `mdst.eecs.umich.edu` | **Drop/Rewrite** — all stale; MDST is now independent; Abernethy left UM (~2018) |
| `resources.md` (Order 500) | "This page will soon be improved" + Google Sheets iframe of UM ML orgs/classes/faculty | **Drop** — superseded by the live Resources page (§1.5) |

### 2.3 Legacy event archive (`content/events/`) — **migrate as read-only history**

19 posts, Jan–Mar 2016. **Whole-set reco: KEEP as an archive** (real technical content), **DROP from any "upcoming" surface.** Data-quality fixes on import: de-dupe (the `Summary:` is repeated in the body in nearly every file; hack-night boilerplate repeats 2–3×); `hack-jan20-kickoff.md` has **no `Summary:`**; `reading-feb16-ecoc.md:5,14` has a "WE" typo + borrowed-abstract copy; 6 reading-group files end with identical "experimenting with a new format" boilerplate.

| Date (2016) | Category | Title | Presenter(s) | Key links |
|---|---|---|---|---|
| Jan 19 5:30 | Tutorial | Clustering the Iris Dataset via K-Means | Aaron Pollack & Samuel Tenka | (none) |
| Jan 19 7:00 | Reading Group | Spectral Clustering | — | Luxburg 2007; scikit-learn |
| Jan 20 7:00 | Hack Night | Kickoff, Markov Models, Spectral Clustering | — | (no summary) |
| Jan 26 5:30 | Tutorial | Gaussian Mixture Modeling | — | (none) |
| Jan 26 7:00 | Reading Group | Intro to Statistical Learning Theory | — | Kulkarni & Harman 2011; Caltech LFD |
| Jan 27 7:00 | Hack Night | Round 2 | — | Markov/spectral recap |
| Feb 2 5:30 | Tutorial | Klustering without the "K" (Dirichlet Processes) | — | (none) |
| Feb 2 7:00 | Reading Group | T-SNE | — | van der Maaten & Hinton 2008; Karpathy demo |
| Feb 3 7:00 | Hack Night | Round 3 | (Spencer, Cheng-Yu, Ben) | Google DL course (unlinked) |
| Feb 9 5:30 | Tutorial | Regression Part I | — | (none) |
| Feb 9 7:00 | Reading Group | Curriculum Learning | — | Bengio et al. 2009 |
| Feb 10 7:00 | Hack Night | Round 4 | (Spencer, Ben) | Curriculum Learning paper |
| Feb 16 5:30 | Tutorial | Regression Part II | — | (none) |
| Feb 16 7:00 | Reading Group | Error-Correcting Output Codes | Alex Chojnacki | Dietterich & Bakiri (titles only) |
| Feb 17 7:00 | Hack Night | Round 5 | (Spencer, Ben) | Curriculum Learning paper |
| Mar 8 5:30 | Tutorial | Support Vector Machines | — | (none) |
| Mar 8 7:00 | Reading Group | Intro to Reinforcement Learning | Cyrus Anderson | Guo et al. 2014; Sutton & Barto |
| Mar 9 7:00 | Hack Night | Round 6 | — | boilerplate |
| Mar 16 7:00 | Hack Night | Round 7 | — | boilerplate (**last event ever**) |

---

## 3. Missing-but-expected content (assessed against the LIVE site)

| Expected | Status on live site | Action |
|---|---|---|
| **Member outcomes / "where our members go"** | **Effectively MISSING** — the Alumni page (§1.9) lists 15 names + dates but **no companies/grad schools/roles** | **Create** — add outcomes to Alumni; highest recruiting ROI |
| **Discord** | MISSING (Slack only) | Add if the org uses it |
| **Social media (X / Instagram / LinkedIn)** | MISSING | Add to Contact/footer |
| **Sponsors / partners** | MISSING | Add if applicable |
| **GitHub org link / project repos** | MISSING (Initiatives describe code projects but link no repos) | Add repo links to each initiative |
| **HTTPS** | **MISSING** — site served over HTTP, `https_enforced=false` | Enable Enforce HTTPS (one click) |
| **Current-term schedule on homepage** | Weak — "Fall 2025 Calendar" embed; Talks stop at 2024 | Wire to live data each term |
| **Up-to-date "last updated"/copyright** | Stale — footer "Copyright MSAIL 2023" | Auto-year |
| Projects & Initiatives, About Us | **Present** (contrary to the old repo) — but stale; **🚩 fresh content incoming this week** | Refresh (§1.2–1.3) |

## 4. Migration notes

- **Where live content is edited:** the Hugo source `Nivedhitha-dp/MSAIL` (personal acct). The roster lives in the About page content; initiatives in `content/projects/`-style items. **Before editing the incoming roster/initiatives, confirm write access and ideally move the source into the `MSAIL` org** (see ANALYSIS.md, governance risk).
- **Images:** live portraits/assets live in the Hugo source's static/media folders + the output repo's `/images`, `/media`. Legacy portraits (`theme/static/images/leadership/`) are stale people — **re-shoot for the new roster**; do **not** carry `alex.png` (521 KB PNG for a 120px avatar).
- **Carry forward:** the live Resources library (refresh dates/links), the Talks archive (drop the Ng quote), the Alumni list (add outcomes), the org constitution; and from the legacy repo, the **19-event archive** (de-duped). 
- **Re-author from fresh content this week:** About Us roster + Faculty, Projects & Initiatives, homepage CTA/calendar.
- **Drop on migration:** Andrew Ng quote (everywhere), "under construction"/"will soon be improved" placeholders, the malformed `umdst.com` link, dead 2016 Google Calendar/Sheets iframes, the hardcoded "Copyright 2023", and the legacy personal-email footer.
