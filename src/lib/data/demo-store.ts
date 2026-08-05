import type {
  Author,
  Comment,
  CommunityObservation,
  Notification,
  PollutionTag,
  Report,
  WaterBodyType,
  WaterLocation,
} from "@/types";
import { clamp, seededRandom, slugify } from "@/lib/utils";
import {
  defaultRecommendations,
  INDICATOR_SPECS,
  computeComposite,
  qualityForScore,
} from "@/lib/ai/scoring";
import { sampleAvatar, samplePhoto } from "./sample-image";

/**
 * The bundled demo dataset.
 *
 * Purpose: a fresh clone with no Supabase project still shows a populated,
 * believable platform — map clusters, trend lines, a leaderboard, moderation
 * queue. Everything is generated deterministically from a seed so screenshots,
 * tests and the numbers quoted on the landing page stay identical between
 * server restarts and between the server and client bundles.
 *
 * When Supabase credentials are present this module is never used.
 */

const SEED_LOCATIONS: Array<{
  name: string;
  type: WaterBodyType;
  region: string;
  country: string;
  lat: number;
  lng: number;
  /** Baseline severity this water body tends to sit at. */
  baseline: number;
  /** Score-points per year the baseline drifts by. */
  drift: number;
  signature: PollutionTag[];
  description: string;
}> = [
  { name: "Ishim River — Astana Embankment", type: "river", region: "Akmola", country: "Kazakhstan", lat: 51.1281, lng: 71.4304, baseline: 44, drift: -9, signature: ["turbidity", "floating_garbage"], description: "Urban stretch through the capital, heavily used for recreation." },
  { name: "Lake Balkhash — Western Basin", type: "lake", region: "Almaty", country: "Kazakhstan", lat: 46.1667, lng: 74.8833, baseline: 52, drift: 7, signature: ["algae_bloom", "turbidity"], description: "Endorheic lake with a fresh western and saline eastern basin." },
  { name: "Big Almaty Lake", type: "reservoir", region: "Almaty", country: "Kazakhstan", lat: 43.0533, lng: 76.9861, baseline: 11, drift: 1, signature: [], description: "Glacial alpine reservoir supplying the city of Almaty." },
  { name: "Kapchagay Reservoir", type: "reservoir", region: "Almaty", country: "Kazakhstan", lat: 43.8833, lng: 77.0667, baseline: 38, drift: -5, signature: ["floating_garbage", "plastic"], description: "Popular summer reservoir on the Ili River." },
  { name: "Syr Darya — Kyzylorda", type: "river", region: "Kyzylorda", country: "Kazakhstan", lat: 44.8479, lng: 65.4823, baseline: 66, drift: 4, signature: ["turbidity", "sewage"], description: "Lower reach carrying heavy agricultural return flow." },
  { name: "Thames — Greenwich Reach", type: "river", region: "Greater London", country: "United Kingdom", lat: 51.4826, lng: -0.0077, baseline: 41, drift: -11, signature: ["plastic", "foam"], description: "Tidal reach with long-running restoration monitoring." },
  { name: "Serpentine, Hyde Park", type: "pond", region: "Greater London", country: "United Kingdom", lat: 51.5055, lng: -0.1653, baseline: 33, drift: -3, signature: ["algae_bloom", "eutrophication"], description: "Recreational lake prone to summer cyanobacteria blooms." },
  { name: "Grand Union Canal — Camden", type: "canal", region: "Greater London", country: "United Kingdom", lat: 51.5416, lng: -0.1465, baseline: 57, drift: 2, signature: ["plastic", "floating_garbage", "oil_film"], description: "Narrowboat canal with persistent surface litter." },
  { name: "Lake Geneva — Vidy Bay", type: "lake", region: "Vaud", country: "Switzerland", lat: 46.5122, lng: 6.5936, baseline: 17, drift: -2, signature: [], description: "Bay adjacent to the Lausanne wastewater treatment outfall." },
  { name: "Rhine — Basel Industrial Bend", type: "river", region: "Basel-Stadt", country: "Switzerland", lat: 47.5719, lng: 7.5886, baseline: 46, drift: -6, signature: ["industrial_discharge", "foam"], description: "Historic chemical corridor, now intensively regulated." },
  { name: "Tiber — Rome Trastevere", type: "river", region: "Lazio", country: "Italy", lat: 41.8869, lng: 12.4695, baseline: 62, drift: 3, signature: ["floating_garbage", "sewage", "turbidity"], description: "Urban river with combined sewer overflow pressure." },
  { name: "Venetian Lagoon — Giudecca", type: "wetland", region: "Veneto", country: "Italy", lat: 45.4258, lng: 12.3208, baseline: 55, drift: 6, signature: ["algae_bloom", "oil_film", "plastic"], description: "Shallow tidal lagoon under heavy vessel traffic." },
  { name: "Danube — Budapest Margaret Island", type: "river", region: "Budapest", country: "Hungary", lat: 47.5266, lng: 19.0472, baseline: 43, drift: -4, signature: ["plastic", "turbidity"], description: "Second-longest European river at its urban midpoint." },
  { name: "Vistula — Warsaw Praga Bank", type: "river", region: "Masovia", country: "Poland", lat: 52.2478, lng: 21.0362, baseline: 39, drift: -7, signature: ["floating_garbage"], description: "Largely unregulated river with natural sandbanks." },
  { name: "Bosphorus — Golden Horn", type: "sea", region: "Istanbul", country: "Türkiye", lat: 41.0257, lng: 28.9539, baseline: 59, drift: -8, signature: ["oil_film", "plastic", "sewage"], description: "Historic inlet reclaimed after a decades-long cleanup." },
  { name: "Ganges — Varanasi Ghats", type: "river", region: "Uttar Pradesh", country: "India", lat: 25.3072, lng: 83.0104, baseline: 79, drift: -5, signature: ["sewage", "floating_garbage", "turbidity", "plastic"], description: "Sacred bathing ghats under the Namami Gange programme." },
  { name: "Yamuna — Delhi Kalindi Kunj", type: "river", region: "Delhi", country: "India", lat: 28.5355, lng: 77.3210, baseline: 89, drift: 3, signature: ["foam", "sewage", "industrial_discharge", "unnatural_color"], description: "Notorious for metre-high toxic surfactant foam." },
  { name: "Citarum — Bandung Reach", type: "river", region: "West Java", country: "Indonesia", lat: -6.9525, lng: 107.6533, baseline: 92, drift: -6, signature: ["plastic", "industrial_discharge", "unnatural_color", "floating_garbage"], description: "Textile-industry corridor, subject of a major remediation push." },
  { name: "Mekong — Can Tho Floating Market", type: "river", region: "Can Tho", country: "Vietnam", lat: 10.0452, lng: 105.7469, baseline: 64, drift: 2, signature: ["turbidity", "plastic", "oil_film"], description: "Delta distributary with dense boat commerce." },
  { name: "Lake Victoria — Kisumu Bay", type: "lake", region: "Kisumu", country: "Kenya", lat: -0.0917, lng: 34.7680, baseline: 71, drift: 8, signature: ["eutrophication", "algae_bloom", "floating_garbage"], description: "Water hyacinth mats choke the bay each rainy season." },
  { name: "Guanabara Bay — Rio", type: "sea", region: "Rio de Janeiro", country: "Brazil", lat: -22.8305, lng: -43.1729, baseline: 76, drift: -9, signature: ["sewage", "plastic", "oil_film"], description: "Olympic sailing venue with a long remediation history." },
  { name: "Lake Titicaca — Puno Bay", type: "lake", region: "Puno", country: "Peru", lat: -15.8402, lng: -69.9822, baseline: 61, drift: 5, signature: ["sewage", "eutrophication", "dead_fish"], description: "High-altitude lake facing untreated municipal discharge." },
  { name: "Chicago River — Downtown Loop", type: "river", region: "Illinois", country: "United States", lat: 41.8879, lng: -87.6272, baseline: 35, drift: -6, signature: ["floating_garbage", "oil_film"], description: "Flow-reversed urban river, now a recreation corridor." },
  { name: "Lake Erie — Maumee Bay", type: "lake", region: "Ohio", country: "United States", lat: 41.6889, lng: -83.3800, baseline: 68, drift: 4, signature: ["algae_bloom", "eutrophication"], description: "Annual cyanobacteria bloom driven by farm runoff." },
  { name: "Hudson River — Battery Park", type: "river", region: "New York", country: "United States", lat: 40.7033, lng: -74.0170, baseline: 37, drift: -4, signature: ["plastic", "construction_debris"], description: "Tidal estuary recovering from industrial legacy contamination." },
  { name: "Yarra River — Melbourne CBD", type: "river", region: "Victoria", country: "Australia", lat: -37.8207, lng: 144.9646, baseline: 42, drift: -5, signature: ["turbidity", "floating_garbage"], description: "Sediment-heavy urban river with stormwater inputs." },
  { name: "Songhua River — Harbin", type: "river", region: "Heilongjiang", country: "China", lat: 45.7732, lng: 126.6172, baseline: 58, drift: -7, signature: ["industrial_discharge", "turbidity"], description: "Northern industrial river, freezes over each winter." },
  { name: "Sumida River — Asakusa", type: "river", region: "Tokyo", country: "Japan", lat: 35.7100, lng: 139.8000, baseline: 29, drift: -3, signature: ["foam"], description: "Fully embanked urban river with tidal exchange." },
];

const SEED_PEOPLE: Array<{
  name: string;
  region: string;
  role: Author["role"];
}> = [
  { name: "Aigerim Nurlanova", region: "Almaty", role: "admin" },
  { name: "Daniyar Seitkali", region: "Astana", role: "moderator" },
  { name: "Priya Raghavan", region: "Delhi", role: "user" },
  { name: "Marco Bellini", region: "Lazio", role: "user" },
  { name: "Sofia Lindqvist", region: "Vaud", role: "moderator" },
  { name: "Tobias Meyer", region: "Basel-Stadt", role: "user" },
  { name: "Grace Achieng", region: "Kisumu", role: "user" },
  { name: "Lucas Ferreira", region: "Rio de Janeiro", role: "user" },
  { name: "Hannah Whitcombe", region: "Greater London", role: "user" },
  { name: "Kenji Watanabe", region: "Tokyo", role: "user" },
  { name: "Nguyen Thi Mai", region: "Can Tho", role: "user" },
  { name: "Elif Demir", region: "Istanbul", role: "user" },
  { name: "Andrzej Kowalczyk", region: "Masovia", role: "user" },
  { name: "Maya Sharma", region: "Uttar Pradesh", role: "user" },
];

const REPORT_TITLES: Record<string, string[]> = {
  clean: [
    "Routine baseline check",
    "Seasonal water clarity survey",
    "Quarterly monitoring photo",
    "Post-rainfall clarity check",
  ],
  moderate: [
    "Surface debris accumulating near the bank",
    "Noticeable turbidity after upstream works",
    "Litter build-up at the inflow",
    "Water looks murkier than last month",
  ],
  bad: [
    "Heavy plastic accumulation along the shoreline",
    "Thick foam layer across the surface",
    "Suspected discharge — water strongly discoloured",
    "Algal mat spreading across the bay",
    "Oil sheen visible near the moorings",
  ],
  critical: [
    "URGENT: dead fish and dense foam",
    "Severe discoloured plume from outfall pipe",
    "Water body appears ecologically collapsed",
    "Massive waste dumping on the riverbank",
  ],
};

const DESCRIPTIONS: Record<string, string[]> = {
  clean: [
    "Photographed during the regular monitoring walk. Water looks healthy, no unusual smell, visible fish activity near the bank.",
    "Clear conditions today. Bottom visible in the shallows. Recording as a baseline for the next comparison.",
  ],
  moderate: [
    "Debris seems to be collecting where the current slows. Nothing alarming yet but it's noticeably worse than my last visit.",
    "Water is browner than usual — there is construction upstream that may be releasing sediment.",
  ],
  bad: [
    "Very strong smell here. Foam persists even away from the weir, which makes me think it's not just aeration.",
    "Large amount of plastic packaging trapped in the vegetation. I counted at least thirty bottles in a ten metre stretch.",
    "The water has a distinctly unnatural tint and there's an iridescent film near the moored boats.",
  ],
  critical: [
    "Multiple dead fish along fifty metres of bank. Smell is overwhelming and there is dense foam. Reported to the local authority as well.",
    "A pipe is discharging directly into the river and the plume is clearly visible for a long distance downstream.",
  ],
};

const COMMENT_BODIES = [
  "I walked this stretch last week and it looked the same. Glad someone documented it.",
  "The municipality cleaned this up two months ago — it's already back to this state.",
  "There's an outflow about 200 m upstream that might explain the foam.",
  "Confirmed, I photographed the same spot from the other bank yesterday.",
  "Has anyone reported this to the regional inspectorate? Happy to co-sign.",
  "This is much worse than the readings from the spring survey.",
  "Thanks for logging this — adding it to our volunteer group's cleanup list.",
];

/* ------------------------------------------------------------------ *
 * Generation
 * ------------------------------------------------------------------ */

export interface DemoDataset {
  locations: WaterLocation[];
  authors: Author[];
  reports: Report[];
  comments: Comment[];
  notifications: Notification[];
  currentUser: Author;
}

const START = Date.UTC(2024, 8, 1); // 2024-09-01 — 18 months of history
const END = Date.UTC(2026, 6, 20); // 2026-07-20

function build(): DemoDataset {
  const authors: Author[] = SEED_PEOPLE.map((person, i) => ({
    id: `usr-${String(i + 1).padStart(3, "0")}`,
    name: person.name,
    avatarUrl: sampleAvatar(person.name, initialsOf(person.name)),
    role: person.role,
    points: 0,
  }));

  const locations: WaterLocation[] = SEED_LOCATIONS.map((loc, i) => ({
    id: `loc-${String(i + 1).padStart(3, "0")}`,
    name: loc.name,
    slug: slugify(loc.name),
    type: loc.type,
    region: loc.region,
    country: loc.country,
    lat: loc.lat,
    lng: loc.lng,
    description: loc.description,
  }));

  const reports: Report[] = [];
  const comments: Comment[] = [];

  SEED_LOCATIONS.forEach((spec, locIndex) => {
    const location = locations[locIndex];
    const rnd = (salt: string) => seededRandom(`${location.id}:${salt}`);

    // Busier, more polluted water bodies attract more citizen reports.
    const count = 3 + Math.round(rnd("count") * 4 + spec.baseline / 22);

    for (let n = 0; n < count; n++) {
      const progress = count === 1 ? 0.5 : n / (count - 1);
      const capturedAt = new Date(
        START + (END - START) * (0.04 + progress * 0.94 + (rnd(`jit${n}`) - 0.5) * 0.05),
      );

      const yearsElapsed =
        (capturedAt.getTime() - START) / (365.25 * 24 * 3600 * 1000);
      const seasonal =
        Math.sin(((capturedAt.getUTCMonth() + 1) / 12) * Math.PI * 2 - 1.1) *
        (spec.signature.includes("algae_bloom") ? 11 : 4);
      const noise = (rnd(`noise${n}`) - 0.5) * 13;

      const targetScore = clamp(
        Math.round(spec.baseline + spec.drift * yearsElapsed + seasonal + noise),
        3,
        99,
      );

      const author = authors[Math.floor(rnd(`author${n}`) * authors.length)];
      const reportId = `rep-${location.id.slice(4)}-${String(n + 1).padStart(2, "0")}`;

      const indicators = buildIndicators(reportId, targetScore, spec.signature);
      const modelConfidence = 66 + Math.round(rnd(`conf${n}`) * 28);
      const composite = computeComposite(indicators, targetScore, modelConfidence);
      const tags = indicators
        .filter((i) => i.detected && i.key !== "clarity")
        .map((i) => i.key as PollutionTag);

      const band = bandOf(composite.score);
      const observations = pickObservations(reportId, tags, composite.score);
      const clarity = indicators.find((i) => i.key === "clarity");

      const jitterLat = (rnd(`lat${n}`) - 0.5) * 0.035;
      const jitterLng = (rnd(`lng${n}`) - 0.5) * 0.05;

      const status =
        composite.score >= 88 && rnd(`mod${n}`) > 0.72
          ? "pending"
          : rnd(`mod${n}`) > 0.955
            ? "flagged"
            : "approved";

      const report: Report = {
        id: reportId,
        title: pick(REPORT_TITLES[band], rnd(`title${n}`)),
        description: pick(DESCRIPTIONS[band], rnd(`desc${n}`)),
        observations,
        status,
        isPublic: true,
        shareToken: `sh_${reportId.replace(/-/g, "")}`,
        viewCount: Math.round(rnd(`views${n}`) * 480 + composite.score * 3),
        createdAt: capturedAt.toISOString(),
        updatedAt: capturedAt.toISOString(),
        imageUrl: samplePhoto(reportId, composite.score, tags),
        thumbnailUrl: null,
        capturedAt: capturedAt.toISOString(),
        lat: location.lat + jitterLat,
        lng: location.lng + jitterLng,
        location,
        analysis: {
          id: `ana-${reportId.slice(4)}`,
          model: "gemini-2.5-flash",
          pollutionScore: composite.score,
          waterQuality: qualityForScore(composite.score),
          clarityScore: clarity ? 100 - clarity.severity : 100 - composite.score,
          confidence: composite.confidence,
          detectedObjects: detectedObjectsFor(tags, composite.score),
          pollutionTags: tags,
          explanation: explanationFor(location.name, composite.score, indicators),
          recommendations: defaultRecommendations(composite.score, tags),
          indicators,
          createdAt: new Date(capturedAt.getTime() + 42_000).toISOString(),
        },
        author,
        commentCount: 0,
      };

      reports.push(report);

      // Contentious reports attract discussion.
      const commentCount =
        composite.score >= 55 ? Math.floor(rnd(`cc${n}`) * 4) : Math.floor(rnd(`cc${n}`) * 2);
      for (let c = 0; c < commentCount; c++) {
        const commenter =
          authors[Math.floor(seededRandom(`${reportId}:cu${c}`) * authors.length)];
        comments.push({
          id: `cmt-${reportId.slice(4)}-${c}`,
          body: pick(COMMENT_BODIES, seededRandom(`${reportId}:cb${c}`)),
          createdAt: new Date(
            capturedAt.getTime() + (c + 1) * 3600_000 * (4 + c * 9),
          ).toISOString(),
          author: commenter,
        });
      }
      report.commentCount = commentCount;
    }
  });

  reports.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  // Points mirror the database trigger: 10 base + 3 per severity decile.
  for (const report of reports) {
    if (report.status === "rejected") continue;
    const author = authors.find((a) => a.id === report.author.id);
    if (author) {
      author.points += 10 + Math.floor(report.analysis.pollutionScore / 10) * 3;
    }
  }
  for (const report of reports) {
    const author = authors.find((a) => a.id === report.author.id);
    if (author) report.author = author;
  }

  const currentUser = authors[0];
  const notifications = buildNotifications(reports, currentUser);

  return { locations, authors, reports, comments, notifications, currentUser };
}

function buildIndicators(
  seed: string,
  score: number,
  signature: PollutionTag[],
) {
  const rnd = (salt: string) => seededRandom(`${seed}:${salt}`);
  const indicators = [];

  // Clarity always measured; degrades with severity.
  indicators.push({
    key: "clarity" as const,
    label: INDICATOR_SPECS[0].label,
    severity: clamp(Math.round(score * 0.82 + (rnd("cl") - 0.5) * 16), 3, 97),
    detected: true,
    note:
      score > 55
        ? "Water column is opaque; no visible bottom in the shallows."
        : "Reasonable transparency with a visible sediment gradient.",
  });

  for (const tag of signature) {
    const spec = INDICATOR_SPECS.find((s) => s.key === tag);
    if (!spec) continue;
    const severity = clamp(
      Math.round(score * (0.72 + rnd(`s${tag}`) * 0.5)),
      6,
      98,
    );
    indicators.push({
      key: tag,
      label: spec.label,
      severity,
      detected: severity >= 26,
      note: `${spec.label} identified across the frame at ${severity}/100 severity.`,
    });
  }

  // Occasional incidental finding not in the location's usual signature.
  if (score > 48 && rnd("extra") > 0.62) {
    const pool = INDICATOR_SPECS.filter(
      (s) => s.key !== "clarity" && !signature.includes(s.key as PollutionTag),
    );
    const extra = pool[Math.floor(rnd("extraPick") * pool.length)];
    if (extra) {
      const severity = clamp(Math.round(score * (0.32 + rnd("es") * 0.34)), 8, 74);
      indicators.push({
        key: extra.key,
        label: extra.label,
        severity,
        detected: severity >= 26,
        note: `Secondary signal: ${extra.label.toLowerCase()} present at lower intensity.`,
      });
    }
  }

  return indicators;
}

function detectedObjectsFor(tags: PollutionTag[], score: number) {
  const map: Partial<Record<PollutionTag, string[]>> = {
    plastic: ["Plastic bottles", "Polythene bags"],
    floating_garbage: ["Mixed solid waste", "Floating debris raft"],
    oil_film: ["Iridescent oil sheen"],
    foam: ["Persistent white foam"],
    algae_bloom: ["Green algal mats"],
    unnatural_color: ["Discoloured plume"],
    turbidity: ["Suspended sediment"],
    industrial_discharge: ["Discharge outfall pipe"],
    sewage: ["Organic sludge"],
    dead_fish: ["Dead fish"],
    construction_debris: ["Dumped rubble", "Discarded tyres"],
    eutrophication: ["Dense surface vegetation"],
  };

  const out = new Set<string>();
  for (const tag of tags) for (const label of map[tag] ?? []) out.add(label);
  out.add(score < 30 ? "Clear open water" : "Water surface");
  return [...out].slice(0, 8);
}

function explanationFor(
  place: string,
  score: number,
  indicators: { label: string; severity: number; detected: boolean; key: string }[],
) {
  const drivers = indicators
    .filter((i) => i.key !== "clarity" && i.detected)
    .sort((a, b) => b.severity - a.severity)
    .slice(0, 3);

  if (!drivers.length) {
    return `Vision analysis of this frame at ${place} found no significant anthropogenic pollution signature. Transparency and colour are within the range expected for a healthy water body of this type, giving a composite severity of ${score}/100.`;
  }

  return `Vision analysis of this frame at ${place} identifies ${drivers
    .map((d) => `${d.label.toLowerCase()} (${d.severity}/100)`)
    .join(", ")}. These signals are spatially consistent across the surface rather than confined to a single reflection artefact, which supports a genuine detection. The weighted indicator matrix resolves to a composite environmental severity of ${score}/100 (${qualityForScore(score)}).`;
}

function pickObservations(
  seed: string,
  tags: PollutionTag[],
  score: number,
): CommunityObservation[] {
  const out = new Set<CommunityObservation>();
  const rnd = (salt: string) => seededRandom(`${seed}:obs:${salt}`);

  if (tags.includes("sewage") && rnd("smell") > 0.25) out.add("bad_smell");
  if (tags.includes("dead_fish")) out.add("dead_fish");
  if (tags.includes("foam") && rnd("foam") > 0.3) out.add("foam");
  if (tags.includes("construction_debris") && rnd("dump") > 0.35) out.add("illegal_dumping");
  if (tags.includes("industrial_discharge") && rnd("fact") > 0.2) out.add("nearby_factory");
  if (tags.includes("unnatural_color") && rnd("disc") > 0.3) out.add("discolored_water");
  if (tags.includes("oil_film") && rnd("oil") > 0.3) out.add("oil_sheen");
  if (tags.includes("eutrophication") && rnd("veg") > 0.35) out.add("excess_vegetation");
  if (score >= 85 && rnd("smell2") > 0.5) out.add("bad_smell");

  return [...out];
}

function buildNotifications(reports: Report[], user: Author): Notification[] {
  const out: Notification[] = [];
  const notable = reports
    .filter((r) => r.author.id !== user.id)
    .slice(0, 14);

  notable.forEach((report, i) => {
    const score = report.analysis.pollutionScore;
    const isCritical = score >= 81;
    const isIncrease = !isCritical && score >= 58;

    if (!isCritical && !isIncrease && i % 3 !== 0) return;

    out.push({
      id: `ntf-${report.id.slice(4)}`,
      kind: isCritical ? "critical_trend" : isIncrease ? "pollution_increase" : "nearby_report",
      title: isCritical
        ? "Critical pollution detected nearby"
        : isIncrease
          ? "Pollution rising at a location you follow"
          : "New water report nearby",
      body: isCritical
        ? `${report.location?.name ?? "A nearby water body"} scored ${score}/100 (Critical). Immediate environmental response is recommended.`
        : isIncrease
          ? `${report.location?.name ?? "A followed location"} moved to ${score}/100 (${report.analysis.waterQuality}), up from its previous assessment.`
          : `${report.author.name} published a new assessment for ${report.location?.name ?? "a nearby water body"}.`,
      reportId: report.id,
      locationId: report.location?.id ?? null,
      readAt: i > 4 ? new Date(Date.now() - i * 7200_000).toISOString() : null,
      createdAt: report.createdAt,
    });
  });

  out.push({
    id: "ntf-achievement-1",
    kind: "achievement",
    title: "Achievement unlocked — Field Analyst",
    body: "You have published 10 verified assessments. Keep going to reach Basin Guardian.",
    reportId: null,
    locationId: null,
    readAt: null,
    createdAt: new Date(Date.now() - 4 * 86400_000).toISOString(),
  });

  return out.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

/* ------------------------------- helpers ------------------------------- */

function bandOf(score: number) {
  if (score >= 81) return "critical";
  if (score >= 58) return "bad";
  if (score >= 36) return "moderate";
  return "clean";
}

function pick<T>(list: T[], r: number) {
  return list[Math.floor(r * list.length) % list.length];
}

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

/**
 * Built once per process. Mutable so uploads made during a demo session show
 * up in the dashboard, map and leaderboard exactly as they would with a real
 * database behind them.
 */
let dataset: DemoDataset | null = null;

export function demoData(): DemoDataset {
  if (!dataset) dataset = build();
  return dataset;
}

export function addDemoReport(report: Report) {
  const data = demoData();
  data.reports.unshift(report);
  if (report.location && !data.locations.some((l) => l.id === report.location!.id)) {
    data.locations.push(report.location);
  }
  const author = data.authors.find((a) => a.id === report.author.id);
  if (author) {
    author.points += 10 + Math.floor(report.analysis.pollutionScore / 10) * 3;
  }
  return report;
}

export function addDemoComment(comment: Comment, reportId: string) {
  const data = demoData();
  data.comments.push(comment);
  const report = data.reports.find((r) => r.id === reportId);
  if (report) report.commentCount += 1;
  return comment;
}

export function removeDemoReport(id: string) {
  const data = demoData();
  const index = data.reports.findIndex((r) => r.id === id);
  if (index === -1) return false;
  data.reports.splice(index, 1);
  return true;
}
