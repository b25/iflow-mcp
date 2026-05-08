/**
 * Scenario 1 — „Unde pierdem bani fără să ne dăm seama?”
 * Distilled from `.plans/Scenariul_1.txt` + tool mapping from `.plans/product-scenarios.md` section C1.
 */
export type Scenario1Perspective = {
  num: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  titleRo: string;
  hypothesisRo: string;
  modulesRo: string[];
  indicatorsRo: string[];
  /** MCP analyst tool that runs this perspective against api-external. */
  mcpAnalyzeTool: string;
  /** Backend / K5 note from the phase plan. */
  backendPrereq: string;
};

export const SCENARIO_1_PERSPECTIVES: Scenario1Perspective[] = [
  {
    num: 1,
    titleRo: "Pierderi în execuție (cost real > cost estimat)",
    hypothesisRo:
      "Comenzile sunt acceptate pe baza unui cost estimat, dar costul real depășește estimatul → marja se erodează sau dispare.",
    modulesRo: [
      "Comenzi → preț vânzare, cost estimat, marjă, cantitate ofertată",
      "Oferte → cost ofertare (Cost Produs, Cost Total, Adaos %, profit estimat)",
      "Bonuri de Consum → consum real (cantitate × cost) per comandă",
      "Bonuri de Producție → fabricat efectiv",
      "Stocuri → cost achiziție UM curent",
      "Flux de Lucru → istoric, timp per etapă, consum real / timp suprascris",
    ],
    indicatorsRo: [
      "Δ Cost = Cost real (bonuri consum + manoperă) − Cost estimat (ofertă)",
      "Top comenzi cu Δ negativ",
      "Produse/categorii cu depășiri sistematice de consum",
      "Etape unde timpul real depășește estimatul",
    ],
    mcpAnalyzeTool: "analyze_execution_loss",
    backendPrereq: "K5.1 — join / cost breakdown pe comandă",
  },
  {
    num: 2,
    titleRo: "Venit ratat în vânzări (pre-execuție)",
    hypothesisRo: "Banii se pierd înainte de execuție — în pâlnia de vânzări.",
    modulesRo: [
      "Oportunități → valoare",
      "Oferte → status, versiuni",
      "Comenzi → valoare finală",
      "Setări → oferte expirate, follow-up",
    ],
    indicatorsRo: [
      "Conversie Oportunitate → Ofertă → Comandă",
      "Δ preț ofertă V1 vs comandă finală",
      "Discounturi medii pe agent / categorie / produs",
      "Oferte expirate fără răspuns",
      "Top motive refuz",
      "Timp mediu ofertă → comandă",
      "Versiuni multiple oferte (negociere prelungită)",
    ],
    mcpAnalyzeTool: "analyze_sales_funnel",
    backendPrereq: "K5.2 — /sales-funnel",
  },
  {
    num: 3,
    titleRo: "Pierderi financiare directe (cash-flow)",
    hypothesisRo: "Banii sunt câștigați pe hârtie dar nu intră în cont sau intră prea târziu.",
    modulesRo: [
      "Facturi → sold, status, scadențe, încasări",
      "Facturi Proforme neconvertite",
      "Tranzacții casă/bancă",
      "Clienți → sold datorat",
      "Rezumat Executiv → termen mediu încasare, TVA, registre",
    ],
    indicatorsRo: [
      "Top clienți sold restant 30/60/90 zile",
      "Termen mediu încasare per client",
      "Sume nealocate (avansuri vs facturi)",
      "Comenzi finalizate vs facturat (nefacturate)",
      "Diferențe valutare",
      "Clienți cu restanțe care primesc comenzi noi",
    ],
    mcpAnalyzeTool: "analyze_receivables_risk",
    backendPrereq: "K5.3 — aging / receivables",
  },
  {
    num: 4,
    titleRo: "Pierderi din stocuri",
    hypothesisRo: "Capital blocat în stoc sau pierdut prin ineficiențe.",
    modulesRo: [
      "Stocuri → curent, în lucru, rezervat, min/max, cost, valoare",
      "Bonuri Transfer",
      "Produse → ultima vânzare, frecvență",
      "Achiziții → dată aprovizionare",
    ],
    indicatorsRo: [
      "Stoc imobilizat (fără mișcare > X luni)",
      "Rupturi (sub minim)",
      "Supra-stoc (peste maxim)",
      "Discrepanțe inventar",
      "Produse cu retururi frecvente",
      "Stoc rezervat „înghețat” pe comenzi blocate",
    ],
    mcpAnalyzeTool: "analyze_stock_health",
    backendPrereq: "K5.4 — dead-stock / ruptură",
  },
  {
    num: 5,
    titleRo: "Pierderi din achiziții",
    hypothesisRo: "Costuri aprovizionare cresc silențios; marjele se erodează.",
    modulesRo: [
      "Achiziții → preț unitar, dată, furnizor",
      "Comenzi furnizor vs facturat",
      "Furnizori → termen plată, livrare",
      "Produse → istoric cost achiziție",
    ],
    indicatorsRo: [
      "Trend preț achiziție per produs",
      "Δ preț comandă furnizor vs achiziție efectivă",
      "Furnizori cu alerte creștere preț",
      "Livrări parțiale prelungite",
      "Decalaj plată furnizor vs încasare client",
    ],
    mcpAnalyzeTool: "analyze_supplier_drift",
    backendPrereq: "K5.5 + K4.4 istoric preț",
  },
  {
    num: 6,
    titleRo: "Pierderi operaționale (eficiență flux)",
    hypothesisRo: "Pierderi prin ineficiență: întârzieri, blocaje, comenzi uitate.",
    modulesRo: [
      "Flux de Lucru → etape, durate, întârzieri, alocare",
      "Istoric comandă",
      "Programări planificate vs realizate",
      "Comenzi → status, termen livrare",
      "Rapoarte angajați → ore",
      "Comenzi nefacturate, avize nefacturate",
    ],
    indicatorsRo: [
      "Etape bottleneck",
      "Angajați timp neproductiv",
      "Comenzi întârziate",
      "Avize vechi fără factură",
      "Finalizate operațional dar nefacturate",
    ],
    mcpAnalyzeTool: "analyze_workflow_efficiency",
    backendPrereq: "K5.6 — bottleneck",
  },
  {
    num: 7,
    titleRo: "Pierderi din relația cu clienții (churn)",
    hypothesisRo: "Pierdem clienți sau valoare per client fără să observăm.",
    modulesRo: [
      "Comenzi → istoric, frecvență, valoare medie",
      "Clienți → ultima comandă, nivel",
      "Oportunități/Oferte fără conversie",
      "Facturi per client",
    ],
    indicatorsRo: [
      "Clienți dormanți",
      "Scădere nivel (Large → Medium → Small)",
      "Concentrare risc top 5 clienți",
      "Oferte fără comenzi ulterioare",
      "Valoare medie comandă în scădere",
    ],
    mcpAnalyzeTool: "analyze_customer_health",
    backendPrereq: "K5.7 — churn",
  },
  {
    num: 8,
    titleRo: "Pierderi din erori și corecții",
    hypothesisRo: "Storno și retururi costă direct și indirect.",
    modulesRo: ["Facturi → storno, anulări"],
    indicatorsRo: [
      "Frecvență storno per agent / perioadă",
      "Top produse cu retururi",
    ],
    mcpAnalyzeTool: "analyze_correction_costs",
    backendPrereq: "Agregări facturi / corecții",
  },
];

/** Lines 122–141 din Scenariul_1.txt — proiectare endpointuri. */
export const SCENARIO_1_ENDPOINT_NOTES_RO: string[] = [
  "Granularitate: date la nivel rând/linie, nu doar agregate (ex. comenzi cu id, client_id, cost_estimat, cost_real).",
  "Cross-referencing pe ID consistent (comanda_id, client_id, produs_id, furnizor_id, angajat_id).",
  "Filtre minime: interval date, paginare, status, client, produs, angajat.",
  "Două nivele: sumar (ex. Rezumat Executiv) + detaliu pentru drill-down.",
  "Date calculate vs brute: refolosiți KPI-uri existente; pentru analize noi, date brute.",
  "Permisiuni: același model ca Rezumat Executiv.",
  "Volume: 6–12 luni, paginare și agregări server-side (ex. top 20 comenzi după deviație cost).",
];
