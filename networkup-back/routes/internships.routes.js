import express from "express";
import Internship from "../models/Internships.js";

/* ── Tag extraction ──────────────────────────────────────────────────────────── */
const TAG_RULES = [
  { tags: ["Web Development", "Frontend"],   keywords: ["react","vue","angular","html","css","javascript","typescript","frontend","web dev","next.js","gatsby","svelte"] },
  { tags: ["Backend"],                        keywords: ["node.js","express","django","flask","spring","backend","api","rest","graphql","php","ruby on rails","laravel"] },
  { tags: ["Full Stack"],                     keywords: ["full stack","fullstack","mern","mean","lamp"] },
  { tags: ["Mobile Development"],             keywords: ["android","ios","flutter","react native","swift","kotlin","mobile app","xamarin"] },
  { tags: ["Machine Learning", "AI"],         keywords: ["machine learning","deep learning","nlp","natural language","neural network","tensorflow","pytorch","llm","generative ai","computer vision","ai/ml","artificial intelligence"] },
  { tags: ["Data Science"],                   keywords: ["data science","data scientist","data analyst","pandas","numpy","jupyter","statistics","r programming","tableau","power bi","excel","data mining"] },
  { tags: ["DevOps", "Cloud"],                keywords: ["devops","docker","kubernetes","aws","azure","gcp","ci/cd","terraform","linux","cloud","infrastructure","ansible","jenkins"] },
  { tags: ["Graphic Design"],                 keywords: ["graphic design","illustrator","photoshop","figma","canva","adobe","brand design","visual design","corel","print design"] },
  { tags: ["UI/UX Design"],                   keywords: ["ui/ux","ui design","ux design","user experience","user interface","wireframe","prototype","interaction design","sketch","invision"] },
  { tags: ["Cybersecurity"],                  keywords: ["cybersecurity","security","penetration testing","ethical hacking","soc","vulnerability","ctf","network security","infosec"] },
  { tags: ["Blockchain"],                     keywords: ["blockchain","web3","solidity","ethereum","smart contract","crypto","nft","defi","dapp"] },
  { tags: ["Marketing"],                      keywords: ["marketing","seo","sem","social media","content marketing","email marketing","growth hacking","ppc","digital marketing","influencer","brand"] },
  { tags: ["Video Editing", "Media"],         keywords: ["video editing","premiere pro","after effects","motion graphics","videography","youtube","content creator","photography","lightroom"] },
  { tags: ["Finance"],                        keywords: ["finance","accounting","fintech","investment","banking","equity research","ca","chartered accountant","financial","audit","taxation"] },
  { tags: ["Business Development", "Sales"],  keywords: ["business development","sales","crm","b2b","lead generation","business analyst","business strategy","account management"] },
  { tags: ["Product Management"],             keywords: ["product manager","product management","roadmap","agile","scrum","jira","product owner","sprint"] },
  { tags: ["Research"],                       keywords: ["research","publication","thesis","academia","lab","scientific","r&d","research analyst"] },
  { tags: ["HR", "Operations"],               keywords: ["human resources","hr","talent acquisition","recruitment","operations","people operations","payroll"] },
  { tags: ["Game Development"],               keywords: ["game dev","unity","unreal","game design","godot","game developer","3d","blender"] },
  { tags: ["Embedded Systems", "IoT"],        keywords: ["embedded","iot","arduino","raspberry pi","firmware","rtos","microcontroller","vhdl","fpga"] },
  { tags: ["Python"],                         keywords: ["python"] },
  { tags: ["Java"],                           keywords: ["java"] },
  { tags: ["C++"],                            keywords: ["c++","cpp"] },
  { tags: ["Internship"],                     keywords: ["intern","internship","trainee","apprentice"] },
  { tags: ["Remote"],                         keywords: ["remote","work from home","wfh"] },
];

function extractTags(title = "", description = "") {
  const haystack = `${title} ${description}`.toLowerCase();
  const found = new Set();
  for (const rule of TAG_RULES) {
    if (rule.keywords.some(kw => haystack.includes(kw))) {
      rule.tags.forEach(t => found.add(t));
    }
  }
  return [...found];
}

const router = express.Router();

let lastApiFetch = 0;
const FETCH_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours

/* ── Shared upsert ──────────────────────────────────────────────────────────── */
async function upsertMany(docs) {
  if (!docs.length) return;
  const ops = docs.map(doc => ({
    updateOne: {
      filter: { externalId: doc.externalId },
      update: { $set: doc },
      upsert: true,
    },
  }));
  await Internship.bulkWrite(ops, { ordered: false });
}

/* ── Safe fetch helper ──────────────────────────────────────────────────────── */
async function safeFetch(url, options = {}) {
  const res = await fetch(url, options);
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

/* ══════════════════════════════════════════════════════════════════════════════
   SOURCE 1 — SerpAPI Google Jobs
══════════════════════════════════════════════════════════════════════════════ */
function normaliseSerp(j) {
  const loc      = j.location || "";
  const isRemote = !!(loc.toLowerCase().includes("remote") || j.detected_extensions?.work_from_home);
  const url      = j.apply_options?.[0]?.link || j.job_link || "";
  const title    = j.title || "";
  const desc     = (j.description || "").replace(/<[^>]+>/g, "").slice(0, 800);

  return {
    externalId:  `serp_${j.job_id || `${title}-${j.company_name}`}`,
    title,
    company:     j.company_name || "",
    location:    loc,
    type:        j.detected_extensions?.schedule_type || "Internship",
    url,
    description: desc,
    logo:        j.thumbnail || "",
    remote:      isRemote,
    source:      "Google Jobs",
    tags:        extractTags(title, desc),
    postedAt:    j.detected_extensions?.posted_at ? new Date(j.detected_extensions.posted_at) : null,
    fetchedAt:   new Date(),
  };
}


async function syncSerpAPI() {
  if (!process.env.SERP_API_KEY) return 0;
  const queries = [
    "internship India 2025",
    "software engineering internship Bangalore Hyderabad Pune Delhi",
  ];
  let total = 0;
  for (const q of queries) {
    try {
      const params = new URLSearchParams({ engine: "google_jobs", q, hl: "en", gl: "in", api_key: process.env.SERP_API_KEY });
      const { ok, data } = await safeFetch(`https://serpapi.com/search.json?${params}`);
      if (!ok || data.error) { console.warn(`SerpAPI "${q}":`, data.error || "failed"); continue; }
      const jobs = data.jobs_results || [];
      console.log(`SerpAPI "${q}": ${jobs.length} jobs`);
      await upsertMany(jobs.map(normaliseSerp));
      total += jobs.length;
      await new Promise(r => setTimeout(r, 400));
    } catch (err) { console.warn(`SerpAPI "${q}" error:`, err.message); }
  }
  return total;
}

/* ══════════════════════════════════════════════════════════════════════════════
   SOURCE 2 — Himalayas
══════════════════════════════════════════════════════════════════════════════ */
function normaliseHimalayas(j) {
  const loc      = j.location || j.locationRestrictions?.join(", ") || "Remote";
  const isRemote = !!(j.remote || loc.toLowerCase().includes("remote"));
  const title    = j.title || "";
  const desc     = (j.description || j.descriptionHtml || "").replace(/<[^>]+>/g, "").slice(0, 800);

  return {
    externalId:  `him_${j.id || j.slug || `${title}-${j.companyName}`}`,
    title,
    company:     j.companyName || j.company?.name || "",
    location:    loc,
    type:        j.jobType || "Internship",
    url:         j.applicationLink || j.url || `https://himalayas.app/jobs/${j.slug || ""}`,
    description: desc,
    logo:        j.companyLogo || j.company?.logo || "",
    remote:      isRemote,
    source:      "Himalayas",
    tags:        extractTags(title, desc),
    postedAt:    j.publishedAt ? new Date(j.publishedAt) : null,
    fetchedAt:   new Date(),
  };
}

async function syncHimalayas() {
  try {
    const queries = ["developer", "software", "data", "marketing", "design"];
    let total = 0;
    for (const q of queries) {
      const { ok, data } = await safeFetch(
        `https://himalayas.app/jobs/api/search?country=in&employmentType=Intern&query=${encodeURIComponent(q)}&limit=50`
      );
      if (!ok) { console.warn("Himalayas: failed for", q); continue; }
      const jobs = data.jobs || data.data || [];
      console.log(`Himalayas "${q}": ${jobs.length} jobs`);
      await upsertMany(jobs.map(normaliseHimalayas));
      total += jobs.length;
      await new Promise(r => setTimeout(r, 300));
    }
    return total;
  } catch (err) { console.warn("Himalayas error:", err.message); return 0; }
}

/* ══════════════════════════════════════════════════════════════════════════════
   SOURCE 3 — Remotive
══════════════════════════════════════════════════════════════════════════════ */
function normaliseRemotive(j) {
  const title = j.title || "";
  const desc  = (j.description || "").replace(/<[^>]+>/g, "").slice(0, 800);

  return {
    externalId:  `rem_${j.id || `${title}-${j.company_name}`}`,
    title,
    company:     j.company_name || "",
    location:    j.candidate_required_location || "Worldwide / Remote",
    type:        j.job_type || "Full-time",
    url:         j.url || "",
    description: desc,
    logo:        j.company_logo || "",
    remote:      true,
    source:      "Remotive",
    tags:        extractTags(title, desc),
    postedAt:    j.publication_date ? new Date(j.publication_date) : null,
    fetchedAt:   new Date(),
  };
}

async function syncRemotive() {
  try {
    const categories = ["software-dev", "data", "devops-sysadmin", "design", "product"];
    let total = 0;
    for (const cat of categories) {
      const { ok, data } = await safeFetch(
        `https://remotive.com/api/remote-jobs?category=${cat}&search=intern&limit=50`
      );
      if (!ok) { console.warn("Remotive: failed for", cat); continue; }
      const jobs = data.jobs || [];
      const filtered = jobs.filter(j => {
        const loc = (j.candidate_required_location || "").toLowerCase();
        return !loc || loc.includes("worldwide") || loc.includes("india") ||
               loc.includes("asia") || loc.includes("apac") || loc.includes("anywhere");
      });
      console.log(`Remotive "${cat}": ${filtered.length}/${jobs.length} eligible`);
      await upsertMany(filtered.map(normaliseRemotive));
      total += filtered.length;
      await new Promise(r => setTimeout(r, 300));
    }
    return total;
  } catch (err) { console.warn("Remotive error:", err.message); return 0; }
}

/* ══════════════════════════════════════════════════════════════════════════════
   SOURCE 4 — RemoteOK
══════════════════════════════════════════════════════════════════════════════ */
function normaliseRemoteOK(j) {
  const title = j.position || j.title || "";
  const desc  = (j.description || "").replace(/<[^>]+>/g, "").slice(0, 800);

  return {
    externalId:  `rok_${j.id || j.slug || `${title}-${j.company}`}`,
    title,
    company:     j.company || "",
    location:    j.location || "Remote / Worldwide",
    type:        "Remote",
    url:         j.url || `https://remoteok.com/remote-jobs/${j.slug || ""}`,
    description: desc,
    logo:        j.logo || "",
    remote:      true,
    source:      "RemoteOK",
    tags:        extractTags(title, desc),
    postedAt:    j.date ? new Date(j.date) : null,
    fetchedAt:   new Date(),
  };
}

async function syncRemoteOK() {
  try {
    const { ok, data } = await safeFetch("https://remoteok.com/api?tag=internship", {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; InternshipsBot/1.0)" },
    });
    if (!ok) { console.warn("RemoteOK: failed"); return 0; }
    const jobs = Array.isArray(data) ? data.filter(j => j.id && j.position) : [];
    console.log(`RemoteOK: ${jobs.length} internship-tagged jobs`);
    await upsertMany(jobs.map(normaliseRemoteOK));
    return jobs.length;
  } catch (err) { console.warn("RemoteOK error:", err.message); return 0; }
}

/* ══════════════════════════════════════════════════════════════════════════════
   SOURCE 5 — Jobicy
══════════════════════════════════════════════════════════════════════════════ */
function normaliseJobicy(j) {
  const loc   = j.jobGeo || j.jobLevel || "Remote";
  const title = j.jobTitle || "";
  const desc  = (j.jobDescription || "").replace(/<[^>]+>/g, "").slice(0, 800);

  return {
    externalId:  `job_${j.id || `${title}-${j.companyName}`}`,
    title,
    company:     j.companyName || "",
    location:    loc,
    type:        j.jobType || "Remote",
    url:         j.url || "",
    description: desc,
    logo:        j.companyLogo || "",
    remote:      true,
    source:      "Jobicy",
    tags:        extractTags(title, desc),
    postedAt:    j.pubDate ? new Date(j.pubDate) : null,
    fetchedAt:   new Date(),
  };
}

async function syncJobicy() {
  try {
    const endpoints = [
      "https://jobicy.com/api/v2/remote-jobs?geo=india&industry=dev&count=50",
      "https://jobicy.com/api/v2/remote-jobs?geo=apac&industry=dev&count=50",
      "https://jobicy.com/api/v2/remote-jobs?geo=india&industry=design&count=50",
      "https://jobicy.com/api/v2/remote-jobs?geo=apac&industry=marketing&count=50",
    ];
    let total = 0;
    for (const url of endpoints) {
      const { ok, data } = await safeFetch(url);
      if (!ok) { console.warn("Jobicy: failed for", url); continue; }
      const jobs = data.jobs || [];
      console.log(`Jobicy (${url.split("geo=")[1]?.split("&")[0]}): ${jobs.length} jobs`);
      await upsertMany(jobs.map(normaliseJobicy));
      total += jobs.length;
      await new Promise(r => setTimeout(r, 300));
    }
    return total;
  } catch (err) { console.warn("Jobicy error:", err.message); return 0; }
}

/* ══════════════════════════════════════════════════════════════════════════════
   SYNC ALL — NEVER touches manually-imported (LinkedIn) data
══════════════════════════════════════════════════════════════════════════════ */
async function syncAll() {
  const AUTO_SOURCES = ["Google Jobs", "Himalayas", "Remotive", "RemoteOK", "Jobicy"];
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const pruned = await Internship.deleteMany({
    source: { $in: AUTO_SOURCES },
    fetchedAt: { $lt: cutoff },
  });
  if (pruned.deletedCount > 0) {
    console.log(`Pruned ${pruned.deletedCount} stale auto-fetched listings`);
  }

  const [himCount, remCount, rokCount, jobCount] = await Promise.all([
    syncHimalayas(),
    syncRemotive(),
    syncRemoteOK(),
    syncJobicy(),
  ]);
  const serpCount = await syncSerpAPI();

  const total = himCount + remCount + rokCount + jobCount + serpCount;
  console.log(
    `Synced — Himalayas:${himCount} Remotive:${remCount} RemoteOK:${rokCount} Jobicy:${jobCount} SerpAPI:${serpCount} | Total:${total}`
  );
  lastApiFetch = Date.now();
  return total;
}

/* ══════════════════════════════════════════════════════════════════════════════
   GET /api/internships
══════════════════════════════════════════════════════════════════════════════ */
router.get("/", async (req, res) => {
  const { search = "", type = "", tag = "", refresh = "" } = req.query;
  const now = Date.now();

  let synced = false, apiError = null;
  const shouldFetch = refresh === "1" || now - lastApiFetch > FETCH_INTERVAL;

  if (shouldFetch) {
    try { await syncAll(); synced = true; }
    catch (err) { apiError = err.message; console.error("syncAll error:", err.message); }
  }

  try {
    const query = {};

    if (search?.trim()) {
      query.$or = [
        { title:    { $regex: search, $options: "i" } },
        { company:  { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
      ];
    }

    if (type?.trim() && type !== "All") {
      if (type.toLowerCase() === "remote") {
        query.remote = true;
      } else {
        query.type = { $regex: type, $options: "i" };
      }
    }

    if (tag?.trim() && tag !== "All") {
      query.tags = tag;
    }

    const listings = await Internship.find(query)
      .sort({ postedAt: -1, fetchedAt: -1 })
      .limit(300)
      .lean();

    console.log(`Serving ${listings.length} internships`);

    return res.json({
      data:      listings,
      total:     listings.length,
      synced,
      apiError,
      fetchedAt: lastApiFetch || null,
    });
  } catch (dbErr) {
    console.error("DB error:", dbErr.message);
    return res.status(500).json({ message: "Failed to load internships" });
  }
});

export default router;