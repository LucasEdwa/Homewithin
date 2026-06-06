import type { LocalMeetup, LocalResource, Workshop } from "@/types";

export const LOCAL_RESOURCES: LocalResource[] = [
  // ── Sverige – Nationella resurser ─────────────────────────────────────────
  {
    id: "se-nat-1",
    name: "RFSL – Riksförbundet för HBTQ+",
    type: "lgbtq_center",
    description:
      "Sveriges ledande HBTQ+-organisation med stöd, rådgivning, juridisk hjälp och politisk påverkan på nationell nivå.",
    state: "Sweden",
    website: "https://www.rfsl.se",
  },
  {
    id: "se-nat-2",
    name: "RFSL Ungdom",
    type: "support_group",
    description:
      "Riksorganisation för unga HBTQ+-personer upp till 25 år. Lokala grupper, läger och politisk aktivism i hela landet.",
    state: "Sweden",
    website: "https://rfslungdom.se",
  },
  {
    id: "se-nat-3",
    name: "Mind – Självmordslinjen",
    type: "support_group",
    description:
      "Krisstöd för den som har tankar på självskada eller självmord. Dygnet runt, anonymt och kostnadsfritt.",
    state: "Sweden",
    website: "https://mind.se",
    phone: "90101",
  },
  {
    id: "se-nat-4",
    name: "BRIS – Barnens Rätt i Samhället",
    type: "support_group",
    description:
      "Stödlinje för barn och unga upp till 18 år i utsatta situationer, inklusive HBTQ+-frågor. Anonymt och kostnadsfritt.",
    state: "Sweden",
    website: "https://www.bris.se",
    phone: "116 111",
  },
  {
    id: "se-nat-5",
    name: "FPES – Riksförbundet för transpersoner",
    type: "lgbtq_center",
    description:
      "Stöd och gemenskap för transpersoner, deras familjer och vänner. Chattlinjer och lokala grupper i hela Sverige.",
    state: "Sweden",
    website: "https://www.fpes.se",
  },
  {
    id: "se-nat-6",
    name: "Diskrimineringsombudsmannen (DO)",
    type: "legal_aid",
    description:
      "Statlig myndighet mot diskriminering bl.a. på grund av sexuell läggning och könsidentitet. Kostnadsfri rådgivning.",
    state: "Sweden",
    website: "https://www.do.se",
  },
  {
    id: "se-nat-7",
    name: "UMO – Ungdomsmottagningen online",
    type: "therapist",
    description:
      "Hälsoinformation och rådgivning för unga 13–25 år om identitet, psykisk hälsa och HBTQ+-frågor.",
    state: "Sweden",
    website: "https://www.umo.se",
  },
  {
    id: "se-nat-8",
    name: "Friends – mot mobbning i skolan",
    type: "support_group",
    description:
      "Arbetar mot kränkningar och mobbning i skolan, inklusive homo- och transfobi. Stöd till elever och personal.",
    state: "Sweden",
    website: "https://friends.se",
  },
  {
    id: "se-nat-9",
    name: "Rädda Barnen – stöd för unga",
    type: "support_group",
    description:
      "Stöd till barn och unga i utsatta situationer, inklusive HBTQ+-ungdomar som saknar stöd hemma.",
    state: "Sweden",
    website: "https://www.raddabarnen.se",
  },
  {
    id: "se-nat-10",
    name: "RFSL – Akut stöd och boende",
    type: "shelter",
    description:
      "RFSL hänvisar till akutboenden och kan hjälpa HBTQ+-personer som behöver akut stöd med boende och säkerhet.",
    state: "Sweden",
    website: "https://www.rfsl.se",
  },

  // ── Stockholm ────────────────────────────────────────────────────────────
  {
    id: "se-sthlm-1",
    name: "RFSL Stockholm",
    type: "lgbtq_center",
    description:
      "Stockholms HBTQ+-förening med rådgivning, stödgrupper, evenemang och mötesplats för hela regionen.",
    state: "Stockholm",
    city: "Stockholm",
    website: "https://www.rfslstockholm.com",
  },
  {
    id: "se-sthlm-2",
    name: "RFSL Rådgivningen Stockholm",
    type: "therapist",
    description:
      "Professionell samtalsrådgivning för HBTQ+-personer. Individuella samtal, par- och familjerådgivning.",
    state: "Stockholm",
    city: "Stockholm",
    website: "https://www.rfsl.se/verksamhet/radgivningen/",
  },
  {
    id: "se-sthlm-3",
    name: "Stockholms Tjej- och Transpersonsjouren (TRIS)",
    type: "support_group",
    description:
      "Stöd till tjejer och transpersoner utsatta för hedersrelaterat våld och förtryck i Stockholmsregionen.",
    state: "Stockholm",
    city: "Stockholm",
    website: "https://tris.se",
  },

  // ── Västra Götaland ──────────────────────────────────────────────────────
  {
    id: "se-vgr-1",
    name: "RFSL Göteborg",
    type: "lgbtq_center",
    description:
      "HBTQ+-center i Göteborg med rådgivning, stödgrupper, bibliotek och mötesplats för hela Västsverige.",
    state: "Västra Götaland",
    city: "Göteborg",
    website: "https://www.rfsl.se",
  },
  {
    id: "se-vgr-2",
    name: "Regnbågens Ungdomsförening Göteborg",
    type: "support_group",
    description:
      "Öppen mötesplats och stöd för unga HBTQ+-personer i Göteborg och Västra Götaland.",
    state: "Västra Götaland",
    city: "Göteborg",
    website: "https://www.rfsl.se",
  },

  // ── Skåne ────────────────────────────────────────────────────────────────
  {
    id: "se-skane-1",
    name: "RFSL Malmö–Ystad",
    type: "lgbtq_center",
    description:
      "Regional HBTQ+-organisation i Skåne med rådgivning, stödgrupper och evenemang i södra Sverige.",
    state: "Skåne",
    city: "Malmö",
    website: "https://www.rfsl.se",
  },
  {
    id: "se-skane-2",
    name: "Helsingborg HBTQ+ – stöd och mötesplats",
    type: "support_group",
    description:
      "Lokal HBTQ+-verksamhet i norra Skåne med stödgrupper och öppna träffar.",
    state: "Skåne",
    city: "Helsingborg",
    website: "https://www.rfsl.se",
  },

  // ── Uppsala ──────────────────────────────────────────────────────────────
  {
    id: "se-upp-1",
    name: "RFSL Uppsala",
    type: "lgbtq_center",
    description:
      "HBTQ+-förening i Uppsala med stödgrupper, öppen verksamhet och mötesplatser för regionen.",
    state: "Uppsala",
    city: "Uppsala",
    website: "https://rfsluppsala.se",
  },

  // ── Östergötland ─────────────────────────────────────────────────────────
  {
    id: "se-ost-1",
    name: "RFSL Linköping",
    type: "lgbtq_center",
    description:
      "HBTQ+-förening i Östergötland med stöd, gemenskap och aktiviteter för HBTQ+-personer i regionen.",
    state: "Östergötland",
    city: "Linköping",
    website: "https://www.rfsl.se",
  },

  // ── Västernorrland ───────────────────────────────────────────────────────
  {
    id: "se-vno-1",
    name: "RFSL Sundsvall",
    type: "lgbtq_center",
    description:
      "HBTQ+-förening i Västernorrland med evenemang, stöd och gemenskap i regionen.",
    state: "Västernorrland",
    city: "Sundsvall",
    website: "https://www.rfsl.se",
  },

  // ── Västerbotten ─────────────────────────────────────────────────────────
  {
    id: "se-vbo-1",
    name: "RFSL Umeå",
    type: "lgbtq_center",
    description:
      "HBTQ+-förening i Västerbotten med rådgivning, stödgrupper och evenemang i Umeåregionen.",
    state: "Västerbotten",
    city: "Umeå",
    website: "https://www.rfsl.se",
  },

  // ── Norrbotten ───────────────────────────────────────────────────────────
  {
    id: "se-nbo-1",
    name: "RFSL Norrbotten",
    type: "lgbtq_center",
    description:
      "HBTQ+-förening i Norrbotten med stöd och community för HBTQ+-personer i norra Sverige.",
    state: "Norrbotten",
    city: "Luleå",
    website: "https://www.rfsl.se",
  },

  // ── Halland ──────────────────────────────────────────────────────────────
  {
    id: "se-hal-1",
    name: "RFSL Halland",
    type: "lgbtq_center",
    description:
      "HBTQ+-förening i Halland med lokala aktiviteter och stöd för HBTQ+-community i regionen.",
    state: "Halland",
    city: "Halmstad",
    website: "https://www.rfsl.se",
  },

  // ── Dalarna ──────────────────────────────────────────────────────────────
  {
    id: "se-dal-1",
    name: "RFSL Dalarna",
    type: "lgbtq_center",
    description:
      "HBTQ+-förening för Dalarna med stöd, gemenskap och aktiviteter för HBTQ+-personer i länet.",
    state: "Dalarna",
    city: "Falun",
    website: "https://www.rfsl.se",
  },

  // ── Gävleborg ────────────────────────────────────────────────────────────
  {
    id: "se-gab-1",
    name: "RFSL Gävle",
    type: "lgbtq_center",
    description:
      "HBTQ+-förening i Gävleborg med evenemang och stöd för HBTQ+-community i regionen.",
    state: "Gävleborg",
    city: "Gävle",
    website: "https://www.rfsl.se",
  },

  // ── Jönköping ────────────────────────────────────────────────────────────
  {
    id: "se-jkp-1",
    name: "RFSL Jönköping",
    type: "lgbtq_center",
    description:
      "HBTQ+-förening i Jönköpings län med lokala stödgrupper och aktiviteter för HBTQ+-community.",
    state: "Jönköping",
    city: "Jönköping",
    website: "https://www.rfsl.se",
  },

  // ── Jämtland ─────────────────────────────────────────────────────────────
  {
    id: "se-jam-1",
    name: "RFSL Östersund",
    type: "lgbtq_center",
    description:
      "HBTQ+-förening i Jämtland med stöd och gemenskap för HBTQ+-personer i regionen.",
    state: "Jämtland",
    city: "Östersund",
    website: "https://www.rfsl.se",
  },

  // ── Örebro ───────────────────────────────────────────────────────────────
  {
    id: "se-ore-1",
    name: "RFSL Örebro",
    type: "lgbtq_center",
    description:
      "HBTQ+-förening i Örebro med stöd och community för HBTQ+-personer i regionen.",
    state: "Örebro",
    city: "Örebro",
    website: "https://www.rfsl.se",
  },

  // ── Värmland ─────────────────────────────────────────────────────────────
  {
    id: "se-var-1",
    name: "RFSL Karlstad",
    type: "lgbtq_center",
    description:
      "HBTQ+-förening i Värmland med stöd och aktiviteter för HBTQ+-community i regionen.",
    state: "Värmland",
    city: "Karlstad",
    website: "https://www.rfsl.se",
  },

  // ── Södermanland ─────────────────────────────────────────────────────────
  {
    id: "se-sod-1",
    name: "RFSL Södermanland",
    type: "lgbtq_center",
    description:
      "HBTQ+-förening i Södermanland med stöd och gemenskap för HBTQ+-personer i länet.",
    state: "Södermanland",
    city: "Eskilstuna",
    website: "https://www.rfsl.se",
  },

  // ── Kronoberg ────────────────────────────────────────────────────────────
  {
    id: "se-kro-1",
    name: "RFSL Kronoberg",
    type: "lgbtq_center",
    description:
      "HBTQ+-förening i Kronoberg med stöd och aktiviteter för HBTQ+-community i Växjöregionen.",
    state: "Kronoberg",
    city: "Växjö",
    website: "https://www.rfsl.se",
  },

  // ── Blekinge ─────────────────────────────────────────────────────────────
  {
    id: "se-ble-1",
    name: "RFSL Blekinge",
    type: "lgbtq_center",
    description:
      "HBTQ+-förening i Blekinge med stöd och gemenskap för HBTQ+-personer i länet.",
    state: "Blekinge",
    city: "Karlskrona",
    website: "https://www.rfsl.se",
  },

  // ── Kalmar ───────────────────────────────────────────────────────────────
  {
    id: "se-kal-1",
    name: "RFSL Kalmar",
    type: "lgbtq_center",
    description:
      "HBTQ+-förening i Kalmar med stöd och aktiviteter för HBTQ+-community i regionen.",
    state: "Kalmar",
    city: "Kalmar",
    website: "https://www.rfsl.se",
  },

  // ── Västmanland ──────────────────────────────────────────────────────────
  {
    id: "se-vml-1",
    name: "RFSL Västerås",
    type: "lgbtq_center",
    description:
      "HBTQ+-förening i Västmanland med stöd och gemenskap för HBTQ+-personer i regionen.",
    state: "Västmanland",
    city: "Västerås",
    website: "https://www.rfsl.se",
  },

  // ── Gotland ──────────────────────────────────────────────────────────────
  {
    id: "se-got-1",
    name: "RFSL Gotland",
    type: "lgbtq_center",
    description:
      "HBTQ+-förening på Gotland med stöd och community för HBTQ+-personer på ön.",
    state: "Gotland",
    city: "Visby",
    website: "https://www.rfsl.se",
  },
];

export const WORKSHOPS: Workshop[] = [
  {
    id: "ws-1",
    title: "Coming Out with Confidence",
    description:
      "A gentle 4-week online workshop helping you prepare your story and practice conversations at your own pace.",
    host: "HomeWithin Community",
    format: "online",
    recurring: "Monthly — first Sunday",
    category: "coming_out",
    free: true,
    link: "https://homewithin.app/workshops/coming-out",
  },
  {
    id: "ws-2",
    title: "Healing from Family Rejection",
    description:
      "Facilitated peer support sessions for those navigating distance or rejection from family of origin.",
    host: "HomeWithin Community",
    format: "online",
    recurring: "Bi-weekly — Saturdays 18:00 UTC",
    category: "family_rejection",
    free: true,
    link: "https://homewithin.app/workshops/family-healing",
  },
  {
    id: "ws-3",
    title: "Building Your Chosen Family",
    description:
      "Interactive workshop on identifying, nurturing, and growing your network of chosen support.",
    host: "HomeWithin Community",
    format: "online",
    recurring: "Monthly — third Saturday",
    category: "chosen_family",
    free: true,
    link: "https://homewithin.app/workshops/chosen-family",
  },
  {
    id: "ws-4",
    title: "Mindfulness for LGBTQ+ Wellbeing",
    description:
      "Weekly guided mindfulness practice tailored to queer experiences of stress and hypervigilance.",
    host: "HomeWithin Community",
    format: "online",
    recurring: "Weekly — Wednesdays 19:00 UTC",
    category: "mental_health",
    free: true,
    link: "https://homewithin.app/workshops/mindfulness",
  },
  {
    id: "ws-5",
    title: "Trans+ Peer Café",
    description:
      "Informal drop-in space for trans, non-binary, and gender-questioning people to connect and share.",
    host: "HomeWithin Community",
    format: "online",
    recurring: "Weekly — Fridays 20:00 UTC",
    category: "trans_support",
    free: true,
    link: "https://homewithin.app/workshops/trans-cafe",
  },
  {
    id: "ws-6",
    title: "Queer Grief & Loss Circle",
    description:
      "A gentle space to process grief — from relationships, family estrangement, or identity losses.",
    host: "HomeWithin Community",
    format: "online",
    recurring: "Monthly — last Thursday",
    category: "grief",
    free: true,
    link: "https://homewithin.app/workshops/grief-circle",
  },
  {
    id: "ws-7",
    title: "Navigating Hostile Schools & Communities",
    description:
      "Practical strategies for LGBTQ+ young people facing bullying, discrimination, or exclusion at school, from neighbors, or in local community spaces.",
    host: "HomeWithin Community",
    format: "online",
    recurring: "Monthly — second Tuesday",
    category: "outside_home",
    free: true,
    link: "https://homewithin.app/workshops/outside-home",
  },
];

export const LOCAL_MEETUPS: LocalMeetup[] = [
  {
    id: "mt-se-1",
    title: "Stockholm Pride",
    description:
      "Nordens största Pride-festival med parade, park och hundratals evenemang för hela HBTQ+-community.",
    city: "Stockholm",
    state: "Stockholm",
    recurring: "Årligen — slutet av juli/början av augusti",
    link: "https://www.stockholmpride.org",
  },
  {
    id: "mt-se-2",
    title: "RFSL Stockholm – Öppet Hus",
    description:
      "Regelbundna öppna träffar för HBTQ+-personer i Stockholm. Välkommen oavsett bakgrund eller erfarenhet.",
    city: "Stockholm",
    state: "Stockholm",
    recurring: "Månadsvis",
  },
  {
    id: "mt-se-3",
    title: "Göteborg Pride",
    description:
      "Göteborgspride med festivalvecka, parade och aktiviteter för hela HBTQ+-community i Västsverige.",
    city: "Göteborg",
    state: "Västra Götaland",
    recurring: "Årligen — september",
  },
  {
    id: "mt-se-4",
    title: "Malmö Pride",
    description:
      "Malmös HBTQ+-festival med parade, konserter och aktiviteter i Skåne.",
    city: "Malmö",
    state: "Skåne",
    recurring: "Årligen — maj",
    link: "https://malmopride.com",
  },
  {
    id: "mt-se-5",
    title: "RFSL Ungdom – Öppen verksamhet",
    description:
      "Öppna träffar för unga HBTQ+-personer lokalt i hela landet. Se RFSL Ungdoms webbplats för lokal och tid.",
    city: "Nationellt",
    state: "Sweden",
    recurring: "Veckovis på många orter",
    link: "https://rfslungdom.se",
  },
  {
    id: "mt-se-6",
    title: "Uppsala Pride",
    description:
      "Uppsala Prides festivaldagar med parade och evenemang för HBTQ+-community i Uppsala.",
    city: "Uppsala",
    state: "Uppsala",
    recurring: "Årligen — höst",
  },
  {
    id: "mt-se-7",
    title: "Umeå Pride",
    description:
      "Pride-firande i Umeå med evenemang, parade och gemenskap för HBTQ+-community i Norrland.",
    city: "Umeå",
    state: "Västerbotten",
    recurring: "Årligen",
    link: "https://www.rfsl.se",
  },
];

export const SWEDISH_STATES = [
  "Blekinge",
  "Dalarna",
  "Gävleborg",
  "Gotland",
  "Halland",
  "Jämtland",
  "Jönköping",
  "Kalmar",
  "Kronoberg",
  "Norrbotten",
  "Skåne",
  "Stockholm",
  "Södermanland",
  "Uppsala",
  "Värmland",
  "Västerbotten",
  "Västernorrland",
  "Västmanland",
  "Västra Götaland",
  "Örebro",
  "Östergötland",
] as const;

export const RESOURCE_LOCATIONS = Array.from(
  new Set(LOCAL_RESOURCES.map((resource) => resource.state)),
).sort((a, b) => a.localeCompare(b));
