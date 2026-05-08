/**
 * Scenario 2 — „De ce nu mai merge ca înainte?”
 * Source: `.plans/Scenariul_2.txt` + alignment with `.plans/product-scenarios.md` section D.
 */

export const SCENARIO_2_SOURCE_FILES = [".plans/Scenariul_2.txt", ".plans/product-scenarios.md section D"];

export const SCENARIO_2_FRAMEWORK_RO = {
  title: "Diagnostic comparativ — schimbări față de un trecut care funcționa",
  difference_vs_scenario_1:
    "Scenariul 1 scanează starea curentă; Scenariul 2 cere două snapshot-uri și un calendar al schimbărilor (baseline + diferențial + cauze probabile).",
  phases: [
    {
      id: 1,
      nameRo: "Detectarea diferențialului",
      roleRo: "Ce s-a schimbat? (faza analitică)",
    },
    {
      id: 2,
      nameRo: "Generarea ipotezelor cauzale",
      roleRo: "De ce probabil s-a schimbat? (faza investigativă)",
    },
    {
      id: 3,
      nameRo: "Validarea cu drill-down",
      roleRo: "Confirmăm sau respingem ipotezele? (verificare)",
    },
    {
      id: 4,
      nameRo: "Sinteza narativă",
      roleRo: "Poveste coerentă, nu listă de cifre",
    },
  ],
};

export const SCENARIO_2_BASELINE_METHODS_RO: { method: string; whenRo: string }[] = [
  {
    method: "yoy",
    whenRo:
      "Aceeași perioadă anul trecut — prima alegere dacă există ≥12 luni istoric și sezonalitate clară.",
  },
  {
    method: "median",
    whenRo:
      "Mediană mobilă 3–6 luni — când nu există un an de istoric sau businessul s-a schimbat; mediana e robustă la outlieri.",
  },
  {
    method: "trend",
    whenRo:
      "Trend extrapolat — dacă businessul crește constant, „normalul” e pe traiectorie, nu nivel absolut.",
  },
];

export const SCENARIO_2_BASELINE_TRANSPARENCY_RO =
  "Metoda de baseline trebuie declarată explicit în răspuns (fără alegere tacită).";

export const SCENARIO_2_MONITORING_GROUPS: { groupRo: string; metricsRo: string[] }[] = [
  {
    groupRo: "Operațional (Flux, Comenzi, Istoric)",
    metricsRo: [
      "Timp mediu pe etapă; durată totală comandă",
      "% comenzi întârziate; distribuție timp pe etape",
      "Suprascrieri manuale de timp; pierderi înregistrate pe comandă",
    ],
  },
  {
    groupRo: "Vânzări (Oportunități, Oferte, Comenzi)",
    metricsRo: [
      "Conversie Oportunitate → Ofertă → Comandă",
      "Valoare medie comandă; discount mediu; mix produse",
      "Ciclul de vânzare; versiuni medii per ofertă",
    ],
  },
  {
    groupRo: "Financiar (Facturi, Tranzacții, Achiziții)",
    metricsRo: [
      "Termen mediu încasare; % facturi la termen; sold restant",
      "Marjă medie pe comandă; cost mediu achiziție per produs",
      "Cheltuieli neasociate documentelor",
    ],
  },
  {
    groupRo: "Stocuri",
    metricsRo: ["Rotație stoc pe categorii", "Frecvență rupturi"],
  },
  {
    groupRo: "Clienți",
    metricsRo: [
      "Clienți activi; rată de revenire",
      "Concentrare venit top 5; clienți noi; dormanți reactivați",
    ],
  },
  {
    groupRo: "Echipă",
    metricsRo: [
      "Ore lucrate vs productive; volum per angajat per etapă",
      "Rată finalizare oferte per agent; activitate în sistem; creștere personal",
    ],
  },
];

/** Șase categorii de cauze (Faza 3) — Scenariul_2.txt A–F. */
export const SCENARIO_2_CAUSAL_CATEGORIES: { code: string; labelRo: string; examplesRo: string[] }[] =
  [
    {
      code: "A",
      labelRo: "Persoană",
      examplesRo: [
        "Angajat nou pe etapă; plecare/concediu; schimbare manager cont",
        "Volum muncă (ex. 3× mai multe etape)",
      ],
    },
    {
      code: "B",
      labelRo: "Proces / configurare",
      examplesRo: [
        "Flux modificat; preț produs; adaos categorie client",
        "Permisiuni; notificări automate",
      ],
    },
    {
      code: "C",
      labelRo: "Partener (furnizor sau client)",
      examplesRo: [
        "Furnizor nou / preț în creștere / livrări parțiale",
        "Client mare − volum; client nou deformează statistici",
      ],
    },
    {
      code: "D",
      labelRo: "Produs / mix",
      examplesRo: [
        "Produs nou / scos din vânzare",
        "Schimbare mix; retururi (calitate / așteptări)",
      ],
    },
    {
      code: "E",
      labelRo: "Pattern temporal",
      examplesRo: [
        "Sezonalitate; end-of-month/quarter",
        "Sărbători; vacanțe; evenimente externe",
      ],
    },
    {
      code: "F",
      labelRo: "Date / operare",
      examplesRo: [
        "Instrucțiuni incomplete; comenzi fără ofertă",
        "Documente nefacturate; editări multiple",
      ],
    },
  ];

export const SCENARIO_2_WORKED_EXAMPLE_RO = {
  anomaly: "Timpul mediu pe etapa „Finisaj” a crescut cu 47% începând cu 15 martie.",
  scan: [
    "Operatorul Y alocat prima dată pe Finisaj pe 12 martie",
    "Comenzile lui Y: timp mediu +60% față de ceilalți",
    "Înainte: operatorul X (acum în concediu)",
  ],
  hypothesis: "Perioada de acomodare a lui Y pe Finisaj.",
  confidence: "Ridicat — corelație temporală, izolată pe operator.",
};

export const SCENARIO_2_IDEAL_NARRATIVE_RO = [
  "Poveste, nu tabel — cronologic sau pe priorități.",
  "Cifre concrete; cauze probabile, nu certitudini.",
  "Distinge anomalii reale de fluctuații normale (ex. sezonalitate).",
  "Max. 3–5 observații prioritare în răspunsul principal; rest la cerere.",
];

export const SCENARIO_2_QUALITY_CHALLENGES_RO: string[] = [
  "Sezonalitate ascunsă — verificare „s-a întâmplat și anul trecut?”",
  "Confounding — mai multe schimbări simultane → ipoteze concurente, nu alegere arbitrară",
  "Volum minim — variații pe eșantion mic marcate incerte / suprimate",
  "False positives — priorizare brutală (max 3–5 în top)",
  "Detalii vs claritate — 30s pentru manager; drill-down la „de ce?”",
];

/** Considerații endpointuri — Scenariul_2.txt (critice pentru K4/K4.2/K4.6). */
export const SCENARIO_2_ENDPOINT_NOTES_RO: string[] = [
  "Time-series per metric (nu doar snapshot) — ex. /metrics/... interval + from/to.",
  "Activity / Change Log unificat (entity_type, entity_id, change_type, before, after, actor_id, ts) — critic pentru corelare cauze.",
  "Agregări multi-dimensionale group_by (categorie × tier, etapă × angajat).",
  "Istoric per entitate: preț produs, timeline client, alocări angajat, preț furnizor.",
  "Endpoint evenimente cross-modul: /events?from&to pentru „ce s-a schimbat în jurul datei X”.",
  "Baseline pe server: valoare curentă, metodă, baseline, Δ, semnificație (n).",
  "Permisiuni ierarhizate — log de activitate sensibil (cine a făcut ce).",
];

/** MCP tool that implements metric drill + events (Scenario 2 phases 1–2 parțial). */
export const SCENARIO_2_MCP_DIAGNOSE_TOOL = "diff_diagnose";
