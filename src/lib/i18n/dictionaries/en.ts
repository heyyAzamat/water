/**
 * English dictionary — the source of truth for the shape.
 *
 * `ru.ts` and `kk.ts` are typed against `Dictionary`, so a missing or misnamed
 * key is a build error rather than a blank label in production.
 *
 * Values are plain data only (no functions): the whole object crosses the
 * server → client boundary through the i18n provider. Interpolation uses
 * `{token}` placeholders resolved by `fmt()`.
 */

export const en = {
  meta: {
    title: "AquaVision AI — Monitor water bodies with computer vision",
    titleTemplate: "%s · AquaVision AI",
    description:
      "Photograph any river, lake or reservoir. AquaVision AI scores its environmental condition in seconds, tracks how it changes over time, and maps every finding — no sensors, no hardware.",
  },

  common: {
    skipToContent: "Skip to main content",
    signIn: "Sign in",
    signUp: "Create account",
    startFree: "Start free",
    openDashboard: "Open dashboard",
    backToSite: "Back to site",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    openNavigation: "Open navigation",
    closeNavigation: "Close navigation",
    search: "Search",
    viewAll: "View all",
    loading: "Loading",
    cancel: "Cancel",
    scrollDown: "Scroll to content",
    edition: "First edition",
    allRightsReserved: "All rights reserved",
  },

  language: {
    label: "Language",
    change: "Change language",
  },

  nav: {
    how: "How it works",
    features: "AI features",
    map: "Live map",
    impact: "Impact",
    faq: "FAQ",
    contact: "Contact",
  },

  hero: {
    kicker: "AquaVision",
    titleTop: "Living",
    titleMain: "Water.",
    tagline: "Water body intelligence",
    badge: "Vision AI",
    badgeText: "Environmental scoring from a single photograph",
    subtitle:
      "Photograph a river, lake or reservoir. AquaVision analyses the image with computer vision, scores its condition from 0–100, explains exactly what it found, and tracks how the site changes over time.",
    subtitleStrong: "No sensors. No hardware. Entirely digital.",
    ctaPrimary: "Analyse a photograph",
    ctaSecondary: "Explore the live map",
    stats: {
      assessments: "Assessments",
      waterBodies: "Water bodies",
      contributors: "Contributors",
      countries: "Countries",
    },
    ticker:
      "Analysing {images} images across {sites} monitored sites · average severity {score}/100",
  },

  how: {
    eyebrow: "How it works",
    title: "From photograph to defensible assessment in under a minute",
    description:
      "Four stages, fully automated. The only manual step is pointing a camera at the water.",
    steps: [
      {
        title: "Photograph the water",
        body: "Any phone camera works. Shoot the surface from the bank, a bridge or a boat — PNG, JPEG or WEBP.",
        detail: "Drag & drop · client-side compression · EXIF capture time",
      },
      {
        title: "Computer vision analyses it",
        body: "The model measures clarity, plastics, foam, oil film, algae and unnatural colour, then rates each one 0–100.",
        detail: "13 indicators · structured JSON · confidence-scored",
      },
      {
        title: "The scoring engine composes the verdict",
        body: "A weighted matrix recomputes the overall severity so the number is reproducible — not just whatever the model felt like saying.",
        detail: "Peak-biased weighting · divergence penalty · 5 grade bands",
      },
      {
        title: "It lands on the map and the timeline",
        body: "Every assessment is stored, pinned, clustered and compared against the location's history to detect the trend.",
        detail: "Heatmap · clusters · 30-day projection · PDF export",
      },
    ],
  },

  features: {
    eyebrow: "AI capabilities",
    title: "Not a classifier bolted onto an upload form",
    description:
      "AquaVision is an assessment pipeline: measure, recompute, explain, compare against history, and stay honest about uncertainty.",
    items: [
      {
        title: "Multi-indicator vision analysis",
        body: "Thirteen independent pollution signals — plastics, floating garbage, oil film, foam, algal bloom, unnatural colour, sediment, sewage, industrial discharge, dead fauna and more — each with its own severity and evidence note.",
      },
      {
        title: "Reproducible 0–100 scoring",
        body: "A weighted matrix blends every indicator, biased toward the worst single signal so one oil slick in a clean frame still registers. Model disagreement docks the confidence rather than being hidden.",
      },
      {
        title: "Trend detection & projection",
        body: "Confidence-weighted least squares across a location's history, with an explicit noise floor so seasonal light variation is never reported as a crisis. Projects 30 days ahead.",
      },
      {
        title: "Live heatmap & clustering",
        body: "Every report pinned and colour-coded by severity, aggregated into density clusters, filterable by date, region, water body type and grade.",
      },
      {
        title: "Automatic environmental reports",
        body: "Coordinates, imagery, findings, indicator table, AI reasoning, recommendations and trend summary — exportable to PDF, printable, shareable by link.",
      },
      {
        title: "Crowdsourced corroboration",
        body: "Field observers add smell, dead fish, foam, illegal dumping and nearby industry. Human notes corroborate the vision result — capped so they can never manufacture a critical score alone.",
      },
    ],
    scale: {
      title: "The severity scale",
      body: "One scale, five bands, used identically by the score ring, the map markers, the alert thresholds and the PDF.",
      legend: "0 = pristine · 100 = ecological emergency",
    },
  },

  mapSection: {
    eyebrow: "Live map",
    title: "One map.",
    titleSub: "Every assessment.",
    description:
      "Markers are coloured by severity and cluster by density. Switch to the heat layer to see where pollution concentrates across a whole basin.",
  },

  stats: {
    eyebrow: "Network impact",
    title: "What the network has measured so far",
    description:
      "Every number below is computed live from the assessment database — no marketing figures.",
    distributionTitle: "Grade distribution",
    distributionBody:
      "How the {total} assessed images fall across the severity bands.",
    distributionAria:
      "Distribution of assessments across the five severity grades",
    tiles: {
      assessments: "Assessments",
      assessmentsHint: "AI-analysed and published",
      waterBodies: "Water bodies",
      waterBodiesHint: "across {countries} countries",
      contributors: "Contributors",
      contributorsHint: "citizen observers",
      critical: "Critical findings",
      criticalHint: "scored 81+ — escalated",
    },
    meanLabel: "Mean network severity",
    meanHint: "Average across every assessment on record",
  },

  benefits: {
    eyebrow: "Why it works",
    title: "Sensor-grade coverage without a single sensor",
    description:
      "Hardware monitoring is accurate and expensive, which is why most water bodies have none at all. AquaVision trades a little precision for orders of magnitude more coverage.",
    audiences: [
      {
        who: "Citizens & volunteers",
        gains: [
          "Turn a phone photo into evidence a regulator will read",
          "See whether your local river is actually getting better",
          "Earn recognition on the contributor leaderboard",
        ],
      },
      {
        who: "Municipalities & regulators",
        gains: [
          "Continuous coverage without deploying a single sensor",
          "Prioritise inspections by severity, not by complaint volume",
          "Export a dated, coordinate-stamped PDF per incident",
        ],
      },
      {
        who: "NGOs & researchers",
        gains: [
          "Longitudinal time series per water body, free to export",
          "Consistent scoring methodology across every contributor",
          "An open API surface for existing pipelines",
        ],
      },
    ],
    advantages: [
      {
        title: "No capital expenditure",
        body: "A sensor buoy costs thousands and covers one point. A photograph costs nothing and covers anywhere someone can stand.",
      },
      {
        title: "Deployable today",
        body: "No procurement, no installation, no calibration schedule, no batteries to replace in February.",
      },
      {
        title: "Scales with people, not budget",
        body: "Coverage grows every time somebody joins. Marginal cost per additional monitoring site is effectively zero.",
      },
      {
        title: "Auditable by design",
        body: "Every score decomposes into the indicators that produced it, with the model, confidence and timestamp recorded.",
      },
    ],
  },

  faq: {
    eyebrow: "FAQ",
    title: "The questions that actually matter",
    description: "Straight answers on accuracy, methodology and limits.",
    items: [
      {
        q: "How accurate is a score derived from one photograph?",
        a: "It is a visual assessment, and we are explicit about that. AquaVision measures what is visible — clarity, plastics, foam, oil film, algal biomass, unnatural colour — and reports a confidence that drops for poor light, motion blur, heavy compression or a distant crop. It cannot detect dissolved chemistry, heavy metals or bacteria, and the report says so. Its value is coverage and trend: a site photographed monthly by five people yields a signal no single lab sample can.",
      },
      {
        q: "Why recompute the score instead of trusting the model's number?",
        a: "Because a single opaque number is not auditable. The model rates each indicator separately with an evidence note; a weighted matrix then composes the overall severity, biased toward the worst signal so one serious finding in an otherwise clean frame is not averaged away. If the model's own overall guess diverges from its indicator matrix, that divergence is subtracted from the confidence rather than quietly discarded.",
      },
      {
        q: "How does trend detection avoid crying wolf over seasonal change?",
        a: "Two guards. First, the fit is confidence-weighted least squares, so a blurry 41%-confidence photo cannot swing the verdict as hard as a crisp 92% one. Second, there is an explicit ±6-point noise floor: movement smaller than that is reported as stable, because water photographs genuinely vary with light, season and framing. A direction is only declared when the window-mean comparison and the regression slope agree in sign.",
      },
      {
        q: "Do I need to install anything or buy hardware?",
        a: "No. The entire platform is digital — a camera and a browser. There are no buoys, probes, dataloggers or gateways, nothing to calibrate and nothing to maintain in the field.",
      },
      {
        q: "Who owns the data I contribute?",
        a: "Your uploads stay attributed to you and you can delete a report at any time. Approved public assessments are readable by everyone, because environmental condition data is a public good — that openness is what makes the map useful to the people who can act on it.",
      },
      {
        q: "Can this integrate with our existing monitoring programme?",
        a: "Yes. Every assessment is available through a REST surface, each location exposes its full score time series, and reports export as PDF with coordinates and timestamps intact. Teams typically use AquaVision as a wide-area triage layer that tells them where to send a sampling crew.",
      },
    ],
  },

  contact: {
    eyebrow: "Get in touch",
    title: "Bring AquaVision to your basin",
    description:
      "Municipalities, NGOs, universities and volunteer river groups — tell us which water bodies you need covered and we will help you get a monitoring programme running.",
    emailLabel: "Email",
    locationLabel: "Based in",
    locationValue: "Astana, Kazakhstan · remote-first",
    onboardingLabel: "Programme onboarding",
    onboardingValue: "Typically under two weeks",
    nameLabel: "Name",
    namePlaceholder: "Aigerim Nurlanova",
    emailPlaceholder: "you@organisation.org",
    orgLabel: "Organisation",
    orgHint: "Optional",
    orgPlaceholder: "City water authority",
    messageLabel: "What would you like to monitor?",
    messagePlaceholder:
      "We manage 40 km of the Ishim and need to prioritise inspections…",
    submit: "Send enquiry",
    submitting: "Sending",
    privacy: "We never share your details. No newsletter, no tracking pixels.",
    sentTitle: "Message received",
    sentBody:
      "Thanks — we read every enquiry and usually reply within two working days.",
    sendAnother: "Send another",
  },

  cta: {
    kicker: "Don't miss it",
    title: "Join us",
    body: "Your nearest river has never been assessed. It takes one photograph to change that — and the first report you publish becomes the baseline everyone else measures against.",
    primary: "Start an analysis",
    secondary: "Browse reports",
  },

  footer: {
    tagline:
      "Intelligent monitoring of water bodies using computer vision. Crowdsourced, hardware-free, open by default.",
    product: "Product",
    platform: "Platform",
    company: "Company",
    links: {
      liveMap: "Live map",
      reports: "Reports",
      newAnalysis: "New analysis",
      leaderboard: "Leaderboard",
      how: "How it works",
      features: "AI capabilities",
      impact: "Network impact",
      faq: "FAQ",
      contact: "Contact",
      dashboard: "Dashboard",
      signIn: "Sign in",
      signUp: "Create account",
    },
    rights: "© {year} AquaVision AI. Built for the water bodies nobody is watching.",
    status: "All systems operational",
  },

  auth: {
    backToSite: "Back to site",
    consent:
      "By continuing you agree that assessments you publish are visible to everyone — environmental data is a public good.",
    asideTitle: "Join the network watching",
    asideTitleAccent: "the water nobody measures.",
    asideBody:
      "{contributors} contributors have published {reports} AI assessments across {locations} water bodies in {countries} countries.",
    asideItems: [
      {
        title: "Analysis in seconds",
        body: "Thirteen pollution indicators scored from a single photograph, with an evidence note for each.",
      },
      {
        title: "Trends you can defend",
        body: "Confidence-weighted regression with a noise floor, so seasonal variation is never reported as a crisis.",
      },
      {
        title: "No hardware, ever",
        body: "A camera and a browser. Nothing to procure, install, calibrate or maintain in the field.",
      },
    ],
    signInTitle: "Welcome back",
    signInBody:
      "Sign in to publish assessments, follow locations and track trends.",
    signInSwitch: "New to AquaVision?",
    signInSwitchLink: "Create an account",
    signUpTitle: "Create your account",
    signUpBody:
      "Free forever for citizen monitoring. Your first assessment takes about a minute.",
    signUpSwitch: "Already have an account?",
    signUpSwitchLink: "Sign in",
    google: "Continue with Google",
    orEmail: "or use email",
    fullName: "Full name",
    email: "Email",
    password: "Password",
    passwordHint: "8 characters minimum",
    submitSignIn: "Sign in",
    submitSignUp: "Create account",
  },

  appNav: {
    dashboard: "Dashboard",
    dashboardDesc: "Your activity, scores and achievements",
    upload: "New analysis",
    uploadDesc: "Upload a photograph for AI assessment",
    map: "Live map",
    mapDesc: "Every report, clustered and heat-mapped",
    reports: "Reports",
    reportsDesc: "Browse, filter and search all assessments",
    leaderboard: "Leaderboard",
    leaderboardDesc: "Top contributors across the network",
    notifications: "Notifications",
    notificationsDesc: "Nearby reports and trend alerts",
    moderation: "Moderation",
    moderationDesc: "Review the queue and manage users",
    profile: "Profile & settings",
    profileDesc: "Your details and notification radius",
    sectionOperations: "Operations",
    sectionAccount: "Account",
    ctaTitle: "Analyse a photograph",
    ctaBody: "Drag in an image and get a scored assessment in seconds.",
  },

  topbar: {
    searchPlaceholder: "Search reports…",
    searchLabel: "Search reports",
    notifications: "Notifications",
    notificationsUnread: "{count} new",
    notificationsEmpty:
      "Nothing yet. Alerts appear here when pollution rises near you.",
    viewAllNotifications: "View all notifications",
    accountMenu: "Account menu",
    points: "{count} pts",
    demoTitle: "Demo mode",
    demoBody: "Running on the bundled dataset. Add Supabase keys for real accounts.",
    roleAdmin: "Administrator",
    roleModerator: "Moderator",
    roleUser: "Contributor",
    profile: "Profile",
    notificationSettings: "Notification settings",
    moderationPanel: "Moderation panel",
    signOut: "Sign out",
    read: "Read",
    unread: "Unread",
  },

  /** Domain vocabulary shared by the map, filters, reports and upload flow. */
  domain: {
    indicators: {
      clarity: {
        label: "Water clarity",
        description:
          "Transparency and turbidity of the water column — suspended sediment, murkiness.",
      },
      plastic: {
        label: "Plastic waste",
        description: "Bottles, bags, packaging and microplastic accumulation.",
      },
      floating_garbage: {
        label: "Floating garbage",
        description:
          "General solid waste drifting on the surface or trapped at banks.",
      },
      oil_film: {
        label: "Oil / petroleum film",
        description: "Iridescent sheen or dark slick indicating hydrocarbon spill.",
      },
      foam: {
        label: "Surface foam",
        description:
          "Persistent white or brown foam, often surfactant or sewage related.",
      },
      algae_bloom: {
        label: "Algae bloom",
        description:
          "Green/blue-green mats indicating eutrophication and oxygen loss.",
      },
      unnatural_color: {
        label: "Unnatural coloration",
        description:
          "Dye-like, rust, milky or fluorescent tints from chemical discharge.",
      },
      turbidity: {
        label: "Sediment load",
        description: "Heavy brown sediment from erosion, dredging or runoff.",
      },
      industrial_discharge: {
        label: "Industrial discharge",
        description:
          "Visible outfall pipes, effluent plumes or discharge structures.",
      },
      sewage: {
        label: "Sewage indicators",
        description: "Grey water, organic sludge, or sanitary waste on the surface.",
      },
      dead_fish: {
        label: "Dead aquatic life",
        description: "Fish kill or dead fauna — a direct signal of acute toxicity.",
      },
      construction_debris: {
        label: "Construction debris",
        description: "Rubble, concrete, tyres and dumped building material.",
      },
      eutrophication: {
        label: "Eutrophication",
        description:
          "Excess nutrient load: duckweed carpets, dense aquatic vegetation.",
      },
    },
    status: {
      pending: "Pending",
      approved: "Approved",
      flagged: "Flagged",
      rejected: "Rejected",
    },
    waterBody: {
      river: "River",
      lake: "Lake",
      reservoir: "Reservoir",
      pond: "Pond",
      canal: "Canal",
      sea: "Sea",
      wetland: "Wetland",
      other: "Other",
    },
    observations: {
      bad_smell: "Bad smell",
      dead_fish: "Dead fish",
      foam: "Foam",
      illegal_dumping: "Illegal dumping",
      nearby_factory: "Factory nearby",
      discolored_water: "Discoloured water",
      oil_sheen: "Oil sheen",
      excess_vegetation: "Excess vegetation",
    },
    notificationKinds: {
      nearby_report: "Nearby",
      pollution_increase: "Rising",
      critical_trend: "Critical",
      comment: "Comment",
      achievement: "Achievement",
      moderation: "Moderation",
    },
  },

  ui: {
    closeDialog: "Close dialog",
    preview: {
      scenesLabel: "Preview scenes",
      showScene: "Show {place}",
      confidence: "Confidence",
      indicatorMatrix: "Indicator matrix",
      stored: "Stored, mapped & trended",
      scenes: [
        {
          region: "Delhi, India",
          objects: [
            "Persistent white foam",
            "Organic sludge",
            "Discharge outfall",
          ],
          explanation:
            "Dense surfactant foam covers the majority of the frame and persists well away from any weir, ruling out simple aeration.",
        },
        {
          region: "Ohio, United States",
          objects: ["Green algal mats", "Dense surface vegetation"],
          explanation:
            "Green channel leads red and blue by 19% across a contiguous surface region, consistent with cyanobacteria biomass rather than reflected foliage.",
        },
        {
          region: "Almaty, Kazakhstan",
          objects: ["Clear open water", "Visible substrate"],
          explanation:
            "High luminance contrast with a neutral colour cast and a visible bottom gradient in the shallows. No anthropogenic pollution signature measurable.",
        },
      ],
    },
    report: {
      notFound: "Report not found",
      allReports: "All reports",
      moderationSuffix: "{status} moderation",
      views: "{count} views",
      comments: "{count} comments",
      photoAlt: "Water surface photographed at {place} on {date}",
      unmappedPlace: "an unmapped location",
      factCoordinates: "Coordinates",
      factWaterBody: "Water body",
      factUnknown: "Unknown",
      factConfidence: "Confidence",
      factClarity: "Clarity",
      statModel: "Model",
      statAnalysed: "Analysed",
      findingsTitle: "AI findings",
      findingsBody: "What the vision model concluded and why.",
      detectedObjects: "Detected objects",
      pollutionTypes: "Pollution types",
      indicatorsTitle: "Indicator matrix",
      indicatorsBody:
        "Every measured signal, its severity and the pixel-level evidence.",
      fieldNoteTitle: "Reporter's field note",
      fieldNoteBody:
        "An unverified human observation, recorded alongside the AI assessment.",
      observationsTitle: "On-site observations",
      observationsBody: "Checked by the reporter at the scene.",
      recommendationsTitle: "Recommendations",
      recommendationsBody:
        "Concrete next actions for a local authority or volunteer group.",
      trendTitle: "Trend analysis",
      trendBody: "{count} observations at this location.",
      trendFirst: "First",
      trendLatest: "Latest",
      trendProjected: "Projected",
      shareTitle: "Share this assessment",
      shareBody: "A public link that needs no account to open.",
      nearbyTitle: "Nearby assessments",
      nearbyBody: "Within {km} km of these coordinates.",
      openMap: "Open map",
      discussionTitle: "Community discussion",
      discussionBody: "Local knowledge that a single photograph cannot capture.",
    },

    actions: {
      exportPdf: "Export PDF",
      generating: "Generating…",
      shareLink: "Share link",
      copied: "Copied",
      copyShareLink: "Copy share link",
      pdfExported: "PDF exported",
      pdfFailed: "Could not generate the PDF",
      pdfFailedBody:
        "Try the print option instead — it produces the same layout.",
      shareCopied: "Share link copied",
      clipboardUnavailable: "Clipboard unavailable",
      moderationFailed: "Moderation failed",
      reportDeleted: "Report deleted",
      deleteFailed: "Could not delete this report",
      contentNotFound: "Report content not found",
    },

    comments: {
      placeholder:
        "Add local context — when did you last see this stretch, is it getting worse, has anyone reported it?",
      label: "Write a comment",
      hint: "{count}/{max} · ⌘↵ to post",
      post: "Post",
      failed: "Could not post your comment",
      signedOut: "Sign in to add local context to this assessment.",
      emptyTitle: "No comments yet",
      emptyBody:
        "Local knowledge often explains what a photograph cannot. Be the first to add context.",
    },

    moderation: {
      queueTitle: "Moderation queue",
      queueBody:
        "Approve to publish to the map, flag for a second opinion, reject to hide, or delete permanently.",
      tabNeedsReview: "Needs review",
      tabPending: "Pending",
      tabFlagged: "Flagged",
      tabLive: "Live",
      deleteTitle: "Delete this report?",
      deleteBody:
        "The photograph, its AI analysis and every comment will be removed. This cannot be undone, and the location loses this point from its trend series.",
      keepIt: "Keep it",
      deletePermanently: "Delete permanently",
      allGrades: "All grades",
      allRegions: "All regions",
      anyDate: "Any date",
      last30: "Last 30 days",
      last90: "Last 3 months",
      lastYear: "Last year",
      openReport: "Open report",
      noAssessments: "No assessments yet.",
      readFailed: "Failed to read file",
      failed: "Moderation failed",
      deleted: "Report deleted",
      deleteFailed: "Could not delete the report",
      queueClear: "Queue is clear",
      nothingHere: "Nothing here",
      queueClearBody: "No assessments are waiting on a moderation decision.",
      nothingHereBody: "No reports currently have this status.",
    },

    settings: {
      geoUnavailable: "Geolocation is unavailable in this browser.",
      geoCentred: "Monitoring area centred on your position.",
      geoFailed: "Could not read your position — enter it manually.",
      saved: "Profile saved",
      saveFailed: "Could not save your profile",
      displayName: "Display name",
      region: "Region",
      regionHint: "Shown on your profile",
      regionPlaceholder: "Almaty",
      bio: "Bio",
      bioHint: "Optional, 280 characters",
      bioPlaceholder:
        "Volunteer river monitor covering the Ishim embankment.",
      nearbyLabel: "New report nearby",
      nearbyDescription:
        "Someone publishes an assessment inside your monitoring radius.",
      trendLabel: "Pollution increase & critical trends",
      trendDescription:
        "A location you have reported on gets measurably worse.",
      homeLat: "Home latitude",
      homeLng: "Home longitude",
      useMyLocation: "Use my current location",
    },

    mapExplorer: {
      panelLabel: "Map filters and results",
      closeFilters: "Close filters",
      searchPlaceholder: "Search rivers, lakes, regions…",
      searchLabel: "Search water bodies",
      filterQuality: "Filter by water quality",
      filterType: "Filter by water body type",
      filterRegion: "Filter by region",
      filterDate: "Filter by date",
      allTypes: "All types",
      emptyTitle: "No reports match",
      emptyBody:
        "Widen the severity range or clear a filter to see more of the network.",
      layerLabel: "Map layer",
      layerPins: "Pins",
      layerHeat: "Heat",
      layerBoth: "Both",
      closePreview: "Close report preview",
    },

    charts: {
      noIndicators: "No indicator matrix was recorded for this assessment.",
      belowThreshold: "below threshold",
      projection: "+30 days",
      needSecondPoint:
        "A second observation at this location unlocks trend detection.",
      severity: "Severity",
    },

    mapPage: {
      metaTitle: "Live map",
      metaDescription:
        "Every water assessment, clustered and heat-mapped by pollution severity.",
    },
    dropzone: {
      unsupported: "Unsupported format",
      unsupportedBody: "Upload a PNG, JPEG or WEBP image.",
      tooLarge: "Image too large",
      tooLargeBody: "{size} exceeds the 25 MB limit.",
      unreadable: "Could not read that image",
      unreadableBody: "The file may be corrupt. Try a different photograph.",
      selectedAlt: "Selected water body photograph, ready for analysis",
      replace: "Replace image",
      remove: "Remove image",
      dimensions: "Dimensions",
      format: "Format",
      size: "Size",
      compressed: "Compressed",
      noGain: "no gain",
      preparing: "Preparing image…",
      dropToAnalyse: "Drop to analyse",
      dragHere: "Drag a photograph here",
      preparingHint: "Compressing and measuring colourimetry",
      browseHint: "or click to browse · PNG, JPEG, WEBP up to 25 MB",
    },
    upload: {
      step1Title: "1 · The photograph",
      step1Body:
        "Shoot the water surface, not the sky. A frame that is mostly shoreline lowers the confidence.",
      step2Title: "2 · Where was it taken?",
      step2Body:
        "Linking to a known location is what unlocks trend detection over time.",
      step3Title: "3 · What did you observe?",
      step3Body:
        "Field notes corroborate the vision result. They are recorded alongside it and can raise a detection, never invent one.",
      knownWaterBody: "Known water body",
      knownWaterBodyHint: "or add a new one below",
      addNewLocation: "Add a new location…",
      locationName: "Location name",
      locationNamePlaceholder: "Ishim River — north embankment",
      waterBodyType: "Water body type",
      region: "Region",
      regionOptional: "Optional",
      regionPlaceholder: "Akmola",
      latitude: "Latitude",
      longitude: "Longitude",
      useMyLocation: "Use my current location",
      observationsLegend: "On-site observations",
      fieldNote: "Field note",
      fieldNoteHint: "Optional but valuable",
      fieldNotePlaceholder:
        "Strong smell near the outfall. Foam persists 50 m downstream of the weir…",
      readyTitle: "Ready to analyse",
      readyBody:
        "The vision model scores thirteen pollution indicators, then a weighted matrix recomputes the overall severity so the number is reproducible and auditable.",
      readyList: [
        "Water clarity and turbidity",
        "Plastics and floating garbage",
        "Oil film, foam and discharge plumes",
        "Algal bloom and eutrophication",
        "Unnatural colouration",
      ],
      runAnalysis: "Run AI analysis",
      addPhotoFirst: "Add a photograph first",
      coordsWarning:
        "You can analyse now, but coordinates are required before publishing so the report can appear on the map.",
      analysingTitle: "Analysing photograph",
      analysingBody: "This normally takes five to fifteen seconds.",
      stages: [
        { label: "Reading image", detail: "Decoding and normalising pixels" },
        { label: "Vision analysis", detail: "Scoring thirteen indicators" },
        { label: "Composing score", detail: "Weighted matrix and confidence" },
        { label: "Drafting report", detail: "Explanation and recommendations" },
      ],
      metricConfidence: "Confidence",
      metricClarity: "Clarity",
      metricLatency: "Latency",
      heuristicEngine: "Heuristic engine",
      heuristicNote:
        "No vision API key is configured, so this score came from the colourimetric engine. Add GOOGLE_GENERATIVE_AI_API_KEY for full model analysis.",
      notWaterWarning:
        "The model did not identify open water in this frame. Publishing is still allowed, but consider a photograph where the water surface fills most of the image.",
      explanationTitle: "AI explanation",
      detected: "Detected",
      indicatorsTitle: "Indicator matrix",
      indicatorsBody: "Every measured signal with its severity and evidence.",
      recommendationsTitle: "Recommendations",
      publishTitle: "Publish this assessment",
      publishBody:
        "It becomes part of the public map and the location's time series.",
      reportTitle: "Report title",
      reportTitlePlaceholder: "Heavy plastic accumulation along the shoreline",
      publish: "Publish report",
      startOver: "Start over",
      publishBlocked:
        "A title of at least three characters and a location with coordinates are required before publishing.",
      geoUnavailable: "Geolocation unavailable in this browser.",
      geoCaptured: "Coordinates captured from your device.",
      geoFailed: "Could not read your position",
      geoDenied: "Permission denied — enter the coordinates manually.",
      notWaterToastTitle: "This may not be a water body",
      notWaterToastBody:
        "The model did not recognise open water in this frame. Review before publishing.",
      analysisFailed: "Analysis failed",
      tryAgain: "Try again in a moment.",
      published: "Report published",
      publishedBody: "Your assessment is live on the map.",
      publishFailed: "Publishing failed",
      titleCritical: "Critical pollution at {place}",
      titleDetected: "{indicator} detected at {place}",
      titleBaseline: "Baseline assessment — {place}",
      titleFallbackPlace: "water body",
    },
    filters: {
      searchPlaceholder: "Search reports, rivers, lakes, regions…",
      searchLabel: "Search reports",
      sortLabel: "Sort reports",
      sortRecent: "Most recent",
      sortWorst: "Worst first",
      sortBest: "Cleanest first",
      sortPopular: "Most viewed",
      button: "Filters",
      quality: "Water quality",
      allGrades: "All grades",
      type: "Water body type",
      allTypes: "All types",
      region: "Region",
      allRegions: "All regions",
      minSeverity: "Minimum severity",
      anySeverity: "Any severity",
      minAndWorse: "{score}+ ({label} and worse)",
      criticalOnly: "{score}+ ({label} only)",
      from: "Captured from",
      to: "Captured until",
      totalReports: "{count} reports",
      removeFilter: "Remove the {name} filter",
      clearAll: "Clear all filters",
      pagination: "Pagination",
      previous: "Previous",
      next: "Next",
    },
    unmappedLocation: "Unmapped location",
    unmapped: "Unmapped",
    imageAlt: "Water surface at {name}",
    unreadOf: "unread of {total}",
    allRead: "{count} notifications · all read",
    markAllRead: "Mark all read",
    markAllError: "Could not mark notifications as read",
    unread: "Unread",
  },

  pages: {
    dashboard: {
      metaTitle: "Dashboard",
      metaDescription:
        "Your assessments, statistics, score history and achievements.",
      greeting: "Welcome back, {name}",
      introEmpty:
        "You haven't published an assessment yet — your first one becomes a location's baseline.",
      intro:
        "You have published {reports} assessments across {locations} water bodies.",
      newAnalysis: "New analysis",
      map: "Map",
      tileAssessments: "Assessments",
      tileAssessmentsHint: "{count} critical findings",
      tileWaterBodies: "Water bodies",
      tileWaterBodiesHint: "distinct locations documented",
      tilePoints: "Contribution points",
      tilePointsHint: "Rank #{rank} network-wide",
      tilePointsHintEmpty: "Publish to enter the ranking",
      tileSeverity: "Mean severity",
      tileSeverityHint: "best {best} · worst {worst}",
      tileSeverityHintEmpty: "across your uploads",
      historyTitle: "Your pollution score history",
      historyDescription:
        "Severity of every assessment you have published, oldest first.",
      latestTitle: "Latest assessment",
      latestDescription: "Most recent AI verdict on your uploads.",
      confidence: "Confidence {value}%",
      openReport: "Open full report",
      latestEmptyTitle: "No assessments yet",
      latestEmptyDescription:
        "Upload a photograph of any water body to get your first score.",
      latestEmptyAction: "Analyse a photograph",
      recentTitle: "Recent uploads",
      recentDescription: "Your last six published assessments.",
      viewAll: "View all",
      recentEmptyTitle: "Nothing uploaded yet",
      recentEmptyDescription:
        "Your uploads will appear here with their AI score the moment they are analysed.",
      leaderboardTitle: "Leaderboard",
      leaderboardDescription: "Top contributors this cycle.",
      leaderboardAll: "All",
      you: "you",
      reportsCount: "{count} reports",
      achievementsTitle: "Achievements",
      achievementsDescription: "{unlocked} of {total} unlocked.",
      hotspotsTitle: "Network hotspots",
      hotspotsDescription: "Highest-severity locations right now.",
      distributionTitle: "Network grade distribution",
      distributionDescription:
        "How all {count} published assessments fall across the severity bands.",
    },

    upload: {
      metaTitle: "New analysis",
      metaDescription:
        "Upload a photograph of a water body and get an AI environmental assessment.",
      title: "Analyse a water body",
      description:
        "One photograph is enough. The vision model scores thirteen pollution indicators, a weighted matrix composes the overall severity, and the result joins the location's time series.",
      engineGemini: "Gemini Vision active",
      engineHeuristic: "Heuristic engine",
      heuristicNoticeBefore:
        "No vision API key is configured, so uploads are scored by the built-in colourimetric engine — it measures real image statistics (contrast, colour casts, edge density, hue entropy) and maps them onto the same indicator matrix. Set",
      heuristicNoticeMiddle: "in",
      heuristicNoticeAfter: "to switch to full model analysis.",
    },

    notifications: {
      metaTitle: "Notifications",
      metaDescription:
        "Nearby reports, rising pollution and critical trend alerts.",
      title: "Notifications",
      description:
        "You are alerted when a report is published near your monitoring area, when a followed location's severity rises, and when a trend turns critical.",
      emptyTitle: "No notifications yet",
      emptyDescription:
        "Set a monitoring area in your profile and we will alert you when something changes nearby.",
      emptyAction: "Set monitoring area",
    },

    reports: {
      metaTitle: "Reports",
      metaDescription:
        "Browse, filter and search every AI water assessment on the network.",
      title: "Assessment reports",
      description:
        "Every published AI assessment, filterable by grade, region, water body type and date.",
      newAnalysis: "New analysis",
      emptyTitle: "No reports match those filters",
      emptyDescription:
        "Try widening the severity range, clearing the region, or searching for a different water body.",
      resetFilters: "Reset filters",
    },

    leaderboard: {
      metaTitle: "Leaderboard",
      metaDescription:
        "Top contributors monitoring water bodies across the network.",
      title: "Contributor leaderboard",
      description:
        "Points reward finding what matters: a base award per published assessment plus a bonus scaled to the severity discovered. Documenting a critical site is worth more than a clean one.",
      tileContributors: "Contributors",
      tileContributorsHint: "publishing assessments",
      tileAssessments: "Assessments",
      tileAssessmentsHint: "{count} water bodies covered",
      tileRank: "Your rank",
      tileRankHint: "{points} points",
      tileRankHintEmpty: "Publish to enter the ranking",
      you: "you",
      points: "points",
      reports: "reports",
      regions: "regions",
      avgSeverity: "avg severity",
      fullTitle: "Full ranking",
      fullDescription:
        "Ordered by contribution points, then by number of assessments.",
      caption: "Contributor leaderboard ranked by points",
      colContributor: "Contributor",
    },

    profile: {
      metaTitle: "Profile & settings",
      metaDescription:
        "Your contributor profile, statistics and notification settings.",
      demoAccount: "demo account",
      newAnalysis: "New analysis",
      tileAssessments: "Assessments",
      tileAssessmentsHint: "{count} critical",
      tileWaterBodies: "Water bodies",
      tileWaterBodiesHint: "documented",
      tilePoints: "Points",
      tilePointsHint: "rank #{rank}",
      tilePointsHintEmpty: "unranked",
      tileSeverity: "Mean severity",
      tileSeverityHint: "best {best} · worst {worst}",
      tileSeverityHintEmpty: "no data yet",
      contributionsTitle: "Your assessments",
      contributionsDescription:
        "Everything you have published, most recent first.",
      browseAll: "Browse all",
      emptyTitle: "No assessments yet",
      emptyDescription:
        "Upload a photograph of any river, lake or reservoir to publish your first one.",
      emptyAction: "Start an analysis",
      deploymentTitle: "Deployment",
      deploymentDescription:
        "Which subsystems this instance is currently running.",
      subsystemDatabase: "Database",
      subsystemVision: "Vision",
      subsystemStorage: "Storage",
      valueSupabase: "Supabase Postgres",
      valueDemoDataset: "Bundled demo dataset",
      valueGemini: "Gemini Vision",
      valueHeuristic: "Colourimetric heuristic",
      valueSupabaseStorage: "Supabase Storage",
      valueInMemory: "In-memory (session only)",
      deploymentNote:
        "Configure keys in .env.local to switch any subsystem to production mode.",
    },

    admin: {
      metaTitle: "Moderation",
      metaDescription:
        "Review the queue, moderate uploads and manage contributors.",
      title: "Moderation panel",
      description:
        "Assessments scoring 90 or above are held for human review before they reach the public map — a false critical alert costs more credibility than a slow one.",
      tilePending: "Awaiting review",
      tilePendingHint: "critical-severity holds",
      tileFlagged: "Flagged",
      tileFlaggedHint: "marked by a moderator",
      tilePublished: "Published",
      tilePublishedHint: "{count} critical on the map",
      tileContributors: "Contributors",
      tileContributorsHint: "{count} water bodies",
      distributionTitle: "Network distribution",
      distributionDescription: "Grade spread across all analysed images.",
      contributorsTitle: "Contributors",
      contributorsDescription:
        "{count} accounts, ranked by contribution points.",
      contributorPoints: "{count} points",
      coverageTitle: "Coverage",
      coverageWaterBodies: "Water bodies",
      coverageCountries: "Countries",
      coverageSeverity: "Mean severity",
      coverageImages: "Images analysed",
    },
  },

  roles: {
    user: "user",
    moderator: "moderator",
    admin: "admin",
  },

  /** Severity bands. Keys match `WaterQuality` in `@/types`. */
  grades: {
    Excellent: {
      label: "Excellent",
      blurb: "No visible contamination. Water appears clear and healthy.",
    },
    Good: {
      label: "Good",
      blurb: "Minor surface debris or slight turbidity. Ecologically stable.",
    },
    Moderate: {
      label: "Moderate",
      blurb: "Noticeable pollution indicators. Monitoring recommended.",
    },
    Poor: {
      label: "Poor",
      blurb: "Significant contamination visible. Intervention advised.",
    },
    Critical: {
      label: "Critical",
      blurb: "Severe pollution. Immediate environmental response required.",
    },
  },

  /** Keys match `TrendDirection` in `@/types`. */
  trend: {
    improving: "Improving",
    stable: "Stable",
    worsening: "Worsening",
    unknown: "Insufficient data",
  },

  errors: {
    notFoundTitle: "This page drifted downstream",
    notFoundBody:
      "The link is broken or the report was removed. The map and the archive are still where you left them.",
    notFoundHome: "Back to home",
    notFoundMap: "Open the map",
    errorTitle: "Something went wrong",
    errorBody:
      "An unexpected error interrupted this view. Retrying usually resolves it.",
    retry: "Try again",
  },
};

/**
 * The shape every locale must satisfy. Deliberately inferred *without*
 * `as const`: properties widen to `string` and arrays stay mutable, so `ru`
 * and `kk` only have to match the structure, not repeat English literals.
 */
export type Dictionary = typeof en;
