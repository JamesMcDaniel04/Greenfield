import type { Opportunity, SourceCitation } from "@/lib/types";

type ThemeKey =
  | "accounting"
  | "industrialMro"
  | "syntheticData"
  | "complianceReadiness"
  | "oncology"
  | "counterUas"
  | "agentInference"
  | "agentOrchestration"
  | "priorAuth"
  | "accessibility"
  | "refrigerantTransition"
  | "leadLine"
  | "dairyBiosecurity"
  | "apprenticeship"
  | "foodTraceability"
  | "droneCompliance"
  | "gridInterconnection"
  | "freightTransparency"
  | "constructionSafety"
  | "shiftWork"
  | "openSourceMaintainers"
  | "jobSearchOps"
  | "researchWorkflow"
  | "teacherAdmin"
  | "freelancerBackOffice";

type ResearchStage = "solo" | "smallTeam" | "domainExpert" | "venture" | "practice";

type StageDefaults = {
  founder_path: Opportunity["founder_path"];
  difficulty: Opportunity["difficulty"];
  starting_capital: Opportunity["starting_capital"];
  time_to_launch: Opportunity["time_to_launch"];
  build_stack_hint: Opportunity["build_stack_hint"];
  revenue_ceiling: Opportunity["revenue_ceiling"];
  model_type: Opportunity["model_type"];
};

type ThemeDefinition = {
  industry: Opportunity["industry"];
  audience: Opportunity["audience"];
  niche: string;
  model_type: Opportunity["model_type"];
  revenue_ceiling?: Opportunity["revenue_ceiling"];
  moat: Opportunity["moat"];
  distribution_play: Opportunity["distribution_play"];
  demand_trend: Opportunity["demand_trend"];
  market_size_summary: string;
  timing_rationale: string;
  sources: SourceCitation[];
};

type IdeaSeed = {
  theme: ThemeKey;
  stage: ResearchStage;
  title: string;
  niche: string;
  summary: string;
  model_type?: Opportunity["model_type"];
  audience?: Opportunity["audience"];
  revenue_ceiling?: Opportunity["revenue_ceiling"];
  moat?: Opportunity["moat"];
  distribution_play?: Opportunity["distribution_play"];
  demand_trend?: Opportunity["demand_trend"];
  founder_path?: Opportunity["founder_path"];
  difficulty?: Opportunity["difficulty"];
  starting_capital?: Opportunity["starting_capital"];
  time_to_launch?: Opportunity["time_to_launch"];
  build_stack_hint?: Opportunity["build_stack_hint"];
  the_play?: string;
  build_path?: string;
};

type SeedTuple = [ResearchStage, string, string, string, Opportunity["model_type"]?];
type SeedInput = SeedTuple | Omit<IdeaSeed, "theme">;

const BASE_DATE = new Date("2026-05-24T00:00:00Z").toISOString();
const BASE_RANK = 36;

function src(
  source_type: SourceCitation["source_type"],
  daysAgo: number,
  url: string,
  title: string,
  snippet: string,
): SourceCitation {
  const d = new Date("2026-05-24T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return {
    source_type,
    url,
    title,
    snippet,
    published_at: d.toISOString(),
    ingested_at: BASE_DATE,
  };
}

const STAGE_DEFAULTS: Record<ResearchStage, StageDefaults> = {
  solo: {
    founder_path: "Bootstrap",
    difficulty: "Easy",
    starting_capital: "Under $1k",
    time_to_launch: "Weeks",
    build_stack_hint: "No-code",
    revenue_ceiling: "Lifestyle ($100k-$1M ARR)",
    model_type: "Productized Service",
  },
  smallTeam: {
    founder_path: "Bootstrap",
    difficulty: "Medium",
    starting_capital: "$1k-$10k",
    time_to_launch: "1-3 months",
    build_stack_hint: "AI-coded (Claude/Cursor/Codex)",
    revenue_ceiling: "Scale ($1M-$10M ARR)",
    model_type: "SaaS",
  },
  domainExpert: {
    founder_path: "Bootstrap",
    difficulty: "Hard",
    starting_capital: "$10k-$100k",
    time_to_launch: "1-3 months",
    build_stack_hint: "Hybrid",
    revenue_ceiling: "Scale ($1M-$10M ARR)",
    model_type: "SaaS",
  },
  venture: {
    founder_path: "VC-backed",
    difficulty: "Expert",
    starting_capital: "$100k+",
    time_to_launch: "3+ months",
    build_stack_hint: "Traditional engineering",
    revenue_ceiling: "Venture ($10M+ ARR)",
    model_type: "Hardware + Software",
  },
  practice: {
    founder_path: "Bootstrap",
    difficulty: "Easy",
    starting_capital: "Under $1k",
    time_to_launch: "Weeks",
    build_stack_hint: "AI-coded (Claude/Cursor/Codex)",
    revenue_ceiling: "Lifestyle ($100k-$1M ARR)",
    model_type: "SaaS",
  },
};

const THEMES: Record<ThemeKey, ThemeDefinition> = {
  accounting: {
    industry: "Vertical SaaS",
    audience: "B2B",
    niche: "Small-firm accounting ops",
    model_type: "SaaS",
    moat: "Brand & community",
    distribution_play: "Community-led",
    demand_trend: "Steady growth",
    market_size_summary: "Solo and small accounting firms represent a large, fragmented buyer base with meaningful recurring spend and low appetite for enterprise software. A product that owns one painful workflow at $100-$500 per month can become a durable niche business long before it needs broad-firm penetration.",
    timing_rationale: "Karbon and Intuit are both still investing in workflow layers for tax and bookkeeping firms, and practitioners continue discussing practice-management gaps in public communities. That combination signals a live software budget, not just founder imagination.",
    sources: [
      src("blog", 11, "https://www.globenewswire.com/news-release/2025/06/04/3093624/0/en/Karbon-Launches-End-to-End-Tax-Workflows-AI-Innovations-and-Practice-Intelligence-to-Accelerate-Firm-Growth.html", "Karbon launches end-to-end tax workflows and AI innovations", "Practice-management vendors are still shipping deeper workflow tooling for accountants."),
      src("blog", 120, "https://investors.intuit.com/news-events/press-releases/detail/235/intuit-proconnect-announces-karbon-partnership-to-deliver-intuit-practice-management-to-tax-professionals", "Intuit ProConnect announces Karbon partnership", "Major tax software distribution validating lightweight practice-management demand."),
      src("reddit", 21, "https://www.reddit.com/r/Bookkeeping/comments/1sydmst/best_practice_management_software/", "r/Bookkeeping discussion on practice-management software", "Recent thread comparing Karbon, Financial Cents, and other small-firm workflow tools."),
    ],
  },
  industrialMro: {
    industry: "Logistics & Supply Chain",
    audience: "B2B",
    niche: "Obsolete industrial parts",
    model_type: "SaaS",
    moat: "Proprietary data",
    distribution_play: "Cold outbound",
    demand_trend: "Niche but durable",
    market_size_summary: "The obsolete-parts problem is narrow but expensive because it is tied to downtime, decommissioning, and non-standard equipment histories. Buyers do not need a giant platform to justify spend here; they need speed, verification, and sourcing confidence.",
    timing_rationale: "Plants still run aging automation hardware while service brokers and component houses keep publishing guidance on sourcing discontinued parts. The persistence of these operational workarounds suggests the market is still underserved by purpose-built software.",
    sources: [
      src("blog", 95, "https://www.controleng.com/services-for-obsolete-electronic-components/", "Control Engineering on services for obsolete electronic components", "Industry trade guidance focused on keeping legacy electronics alive in production."),
      src("blog", 32, "https://3etech.com/resources/guides/sourcing-obsolete-electronic-components/", "Guide to sourcing obsolete electronic components", "Commercial sourcing workflows still revolve around verification, traceability, and broker relationships."),
      src("reddit", 19, "https://www.reddit.com/r/PLC/comments/1e9glbe/", "r/PLC discussion on Allen-Bradley obsolescence plans", "Operators are still publicly asking how to source and plan around legacy control hardware."),
    ],
  },
  syntheticData: {
    industry: "Developer Tools",
    audience: "B2B",
    niche: "Synthetic regulated data",
    model_type: "API / Usage-Based",
    moat: "Proprietary data",
    distribution_play: "Product-led growth",
    demand_trend: "Accelerating",
    market_size_summary: "Regulated engineering teams increasingly need realistic staging data without moving production records around. This makes synthetic-data infrastructure a real budget line for health-tech, fintech, and enterprise software teams shipping into compliance-heavy environments.",
    timing_rationale: "Open-source synthetic-data tooling remains active, vendors are adding AI-specific configuration features, and fresh academic work is still benchmarking fidelity and privacy tradeoffs. The category is evolving quickly enough that there is room for narrower wedges on top of the core tooling layer.",
    sources: [
      src("blog", 18, "https://www.tonic.ai/blog/agentification-of-test-data-management-meet-structural-agent", "Tonic introduces an agent for structural test-data configuration", "The incumbent category is still investing in workflow automation around synthetic and masked data."),
      src("arxiv", 44, "https://arxiv.org/abs/2504.01908", "Benchmarking Synthetic Tabular Data: A Multi-Dimensional Evaluation Framework", "Recent paper on how to evaluate synthetic data quality beyond one metric."),
      src("github", 60, "https://github.com/sdv-dev/SDV", "Synthetic Data Vault on GitHub", "Active open-source baseline that many teams already use as a starting point."),
      src("reddit", 620, "https://www.reddit.com/r/devops/comments/16fqpsm/data_masking_in_staging/", "r/devops discussion on data masking in staging", "Engineers are still debating how to avoid copying production data into staging while preserving realistic test cases."),
      src("hackernews", 610, "https://news.ycombinator.com/item?id=41569240", "Show HN: Open-Source Data Anonymization for Developers", "The HN thread surfaces recurring frustration around realistic non-production datasets and schema changes that break masking rules."),
    ],
  },
  complianceReadiness: {
    industry: "Legal & Compliance",
    audience: "B2B",
    niche: "Trust and audit readiness",
    model_type: "SaaS",
    moat: "Speed of execution",
    distribution_play: "Partnerships",
    demand_trend: "Steady growth",
    market_size_summary: "Startups selling into larger customers are forced into security reviews, policy requests, and audit prep long before they are ready for heavy enterprise governance software. That creates a wide downmarket wedge for lightweight readiness tooling and productized delivery.",
    timing_rationale: "Vanta’s continued scale and ongoing founder discussion around SOC 2 pressure both indicate that the problem has moved downmarket. Teams are not debating whether this work exists; they are debating how to survive it with tiny headcount.",
    sources: [
      src("blog", 300, "https://www.vanta.com/resources/vanta-announces-series-c", "Vanta announces $150M Series C", "Compliance automation remains a scaled category rather than a fringe workflow."),
      src("hackernews", 65, "https://news.ycombinator.com/item?id=46706083", "Ask HN: Why does SOC 2 feel so hard for early-stage startups?", "Founders openly discussing audit burden and evidence collection pain."),
      src("reddit", 150, "https://www.reddit.com/r/SaaS/comments/1p87eed/customer_asked_if_we_have_soc2_i_said_working_on/", "r/SaaS post about enterprise leads asking for SOC 2", "The compliance request now shows up early in startup sales cycles."),
    ],
  },
  oncology: {
    industry: "Healthcare & Med-Adjacent",
    audience: "B2C",
    niche: "Precision oncology navigation",
    model_type: "Transactional",
    moat: "Regulatory access",
    distribution_play: "Partnerships",
    demand_trend: "Accelerating",
    market_size_summary: "Cancer care is a high-value, high-friction workflow where second opinions, genomics, and trial coordination carry direct willingness to pay. Even niche products can become meaningful businesses because the operational pain is clinical, emotional, and expensive.",
    timing_rationale: "More oncology decisions are now genomics-informed, major cancer centers continue to promote structured second-opinion programs, and new research keeps showing that deeper profiling changes care recommendations. That is enough to support focused workflow businesses around record gathering, navigation, and review.",
    sources: [
      src("other", 72, "https://www.nature.com/articles/s41698-025-00942-5", "Study on comprehensive genomic profiling changing treatment recommendations", "Recent precision-oncology evidence linking deeper profiling to changed care plans."),
      src("other", 14, "https://www.dana-farber.org/appointments-second-opinions/second-opinion-program", "Dana-Farber second-opinion program", "Top-tier cancer centers continue to run explicit second-opinion workflows."),
      src("blog", 12, "https://www.mskcc.org/news/what-to-know-about-getting-second-opinion-after-cancer-diagnosis", "MSK on getting a cancer second opinion", "Patient demand for second opinions is explicit enough to warrant dedicated education and intake systems."),
    ],
  },
  counterUas: {
    industry: "Cybersecurity",
    audience: "B2B",
    niche: "Critical-infrastructure counter-UAS",
    model_type: "Hardware + Software",
    moat: "Regulatory access",
    distribution_play: "Direct sales",
    demand_trend: "Accelerating",
    market_size_summary: "Utilities, energy sites, ports, and defense-adjacent operators are spending against drone threat models that sit between physical security and regulated infrastructure. The buyer count is limited, but contract values and maintenance potential are high.",
    timing_rationale: "The market is moving from awareness to deployed systems: Anduril is winning international C-UAS contracts, CISA is publishing critical-infrastructure guidance, and DoD keeps updating homeland policy posture. That creates room for software, evidence, and deployment workflows around the hardware stack.",
    sources: [
      src("blog", 14, "https://www.anduril.com/news/anduril-awarded-dutch-ministry-of-defence-cuas-contract", "Anduril awarded Dutch Ministry of Defence C-UAS contract", "Counter-UAS procurement is moving into fielded international programs."),
      src("blog", 40, "https://www.cisa.gov/topics/physical-security/be-air-aware/protect-critical-infrastructure-and-public-gatherings", "CISA guidance on protecting critical infrastructure from UAS threats", "Government guidance now treats drone threats as an operational planning issue."),
      src("other", 90, "https://media.defense.gov/2026/Feb/10/2003873921/-1/-1/1/FACT-SHEET-C-UAS-POLICY-IN-THE-US-HOMELAND.PDF", "DoD fact sheet on U.S. homeland counter-UAS policy", "Homeland counter-UAS authorities and policy scaffolding continue to expand."),
    ],
  },
  agentInference: {
    industry: "AI Infrastructure",
    audience: "B2B",
    niche: "Agent inference performance",
    model_type: "Hardware + Software",
    revenue_ceiling: "Venture ($10M+ ARR)",
    moat: "Capital intensity",
    distribution_play: "Direct sales",
    demand_trend: "Accelerating",
    market_size_summary: "As agents spend more tokens on branching, tool calling, retries, and speculative decoding, the cost surface shifts away from simple chat benchmarks. That creates room for performance tooling, benchmarking, and specialized infrastructure focused on real agent traces instead of lab demos.",
    timing_rationale: "Groq is publicly marketing speculative decoding gains, new research is focusing on schema-aware tool calling, and enterprises are now measuring agent workloads separately from chat. The workload shape is specific enough to support focused products rather than generic inference claims.",
    sources: [
      src("blog", 25, "https://groq.com/groq-first-generation-14nm-chip-just-got-a-6x-speed-boost-introducing-llama-3-1-70b-speculative-decoding-on-groqcloud/", "Groq launches speculative decoding endpoint with large speed gains", "Speculative decoding is now a commercial performance wedge, not just an academic curiosity."),
      src("blog", 18, "https://groq.com/blog/inside-the-lpu-deconstructing-groq-speed", "Inside the LPU: deconstructing Groq speed", "Low-latency inference architecture is being framed around real workload behavior."),
      src("arxiv", 36, "https://arxiv.org/abs/2604.13519", "ToolSpec: accelerating tool calling with schema-aware speculative decoding", "Fresh research focused specifically on tool-calling traces and decoding behavior."),
    ],
  },
  agentOrchestration: {
    industry: "AI Infrastructure",
    audience: "B2B",
    niche: "Enterprise agent orchestration",
    model_type: "SaaS",
    revenue_ceiling: "Venture ($10M+ ARR)",
    moat: "Network effects",
    distribution_play: "Direct sales",
    demand_trend: "Accelerating",
    market_size_summary: "Mid-market and enterprise teams now have enough internal agents, automations, and vendor stacks to need shared control planes. The budget shows up as reliability, permissioning, and observability spend rather than generic AI experimentation.",
    timing_rationale: "Anthropic’s Model Context Protocol made tool schemas portable, while Microsoft and others are productizing multi-agent orchestration patterns. The market has moved past one-bot demos and into fleet-management problems.",
    sources: [
      src("blog", 160, "https://www.anthropic.com/research/model-context-protocol", "Anthropic introduces the Model Context Protocol", "Portable tool schemas make shared agent infrastructure substantially more realistic."),
      src("blog", 30, "https://devblogs.microsoft.com/agent-framework/semantic-kernel-multi-agent-orchestration/", "Microsoft on Semantic Kernel multi-agent orchestration", "Large platform vendors are standardizing multi-agent workflow patterns."),
      src("blog", 10, "https://opensource.microsoft.com/blog/2026/05/14/conductor-deterministic-orchestration-for-multi-agent-ai-workflows/", "Conductor for deterministic multi-agent orchestration", "Recent tooling focused on safety limits, workflow control, and cross-model orchestration."),
      src("reddit", 27, "https://www.reddit.com/r/LLMDevs/comments/1sxonw2/how_many_of_you_are_actually_running_multiagent/", "r/LLMDevs discussion on multi-agent systems in production", "Builders describe debugging handoffs and tracing failures as the main reason many teams retreat to a single agent with tools."),
      src("reddit", 29, "https://www.reddit.com/r/AI_Agents/comments/1swbew1/how_are_teams_handling_permissions_for_ai_agents/", "r/AI_Agents discussion on agent permissions and audit logs", "Operators are explicitly talking about blast radius, tool scopes, and approval gates for internal agents."),
    ],
  },
  priorAuth: {
    industry: "Healthcare & Med-Adjacent",
    audience: "B2B",
    niche: "Prior authorization operations",
    model_type: "SaaS",
    moat: "Proprietary data",
    distribution_play: "Direct sales",
    demand_trend: "Accelerating",
    market_size_summary: "Prior authorization is a universal admin burden across specialty care, home health, DME, and payer integrations. Because the workflow touches scheduling, revenue, and patient outcomes, even narrow products can command real ACV if they remove rework or denials.",
    timing_rationale: "CMS operational deadlines under the Interoperability and Prior Authorization Final Rule started on January 1, 2026, CMS published additional drug-related proposals in April 2026, and the AMA’s May 13, 2026 survey still shows deep physician skepticism and burden. The pain is current and budget-relevant.",
    sources: [
      src("other", 145, "https://www.cms.gov/newsroom/fact-sheets/cms-interoperability-prior-authorization-final-rule-cms-0057-f", "CMS Interoperability and Prior Authorization Final Rule", "Federal deadlines now force payers and providers to operationalize more transparent authorization workflows."),
      src("other", 40, "https://www.cms.gov/newsroom/fact-sheets/2026-cms-interoperability-standards-prior-authorization-drugs-proposed-rule", "CMS proposed rule on interoperability standards and prior authorization for drugs", "Drug-related authorization APIs and standards remain an active policy area in 2026."),
      src("blog", 11, "https://www.ama-assn.org/practice-management/prior-authorization/ama-prior-authorization-physician-survey", "AMA prior authorization physician survey", "Recent survey data shows physicians still see high burden and low confidence in voluntary payer reform."),
      src("reddit", 171, "https://www.reddit.com/r/medicine/comments/1pe3e7b/inappropriate_prior_auth_denial_patient_advocacy/", "r/medicine discussion on inappropriate prior authorization denials", "Clinicians openly describe prior auth appeals as nonsense work that pulls time away from patient care."),
    ],
  },
  accessibility: {
    industry: "Accessibility & Compliance",
    audience: "B2B",
    niche: "Digital accessibility execution",
    model_type: "Productized Service",
    moat: "Speed of execution",
    distribution_play: "Partnerships",
    demand_trend: "Accelerating",
    market_size_summary: "Accessibility work is now tied to procurement, international market access, and release-management risk rather than only litigation fear. That makes room for productized services, tooling, and evidence layers that sit below the full-platform vendors.",
    timing_rationale: "The European Accessibility Act entered into application on June 28, 2025, and WCAG 2 remains the technical baseline many teams must map to across web, app, document, and software surfaces. Accessibility is now a release and compliance workflow, not just an audit event.",
    sources: [
      src("other", 330, "https://accessible-eu-centre.ec.europa.eu/content-corner/news/new-era-inclusion-begins-eaa-enters-force-2025-06-27_en", "AccessibleEU on the EAA entering into force", "The legal trigger for digital-accessibility work is already live across Europe."),
      src("other", 240, "https://digital-strategy.ec.europa.eu/en/policies/web-accessibility", "European Commission web accessibility policy page", "European institutions continue to frame accessibility as an active policy and implementation domain."),
      src("other", 19, "https://www.w3.org/WAI/standards-guidelines/wcag/", "W3C WCAG 2 overview", "WCAG remains the shared technical standard buyers and delivery teams map accessibility work to."),
      src("reddit", 92, "https://www.reddit.com/r/webdev/comments/1r50svh/is_or_should_web_accessibility_be_mandatory_2026/", "r/webdev discussion on mandatory web accessibility in 2026", "Developers are actively debating audits, tooling, and the compliance burden created by accessibility requirements."),
    ],
  },
  refrigerantTransition: {
    industry: "Climate & Energy",
    audience: "B2B",
    niche: "A2L refrigerant transition",
    model_type: "SaaS",
    moat: "Distribution",
    distribution_play: "Partnerships",
    demand_trend: "Accelerating",
    market_size_summary: "The refrigerant transition creates operational work across contractors, distributors, inspectors, facility owners, and retrofit planners. Buyers do not need a moonshot here; they need documentation, compatibility, training, and project coordination tied to real installs.",
    timing_rationale: "EPA restrictions bit new equipment categories starting January 1, 2025, AHRI is still publishing transition-specific training, and trade coverage keeps documenting field confusion and shortages around A2L equipment. That means there is active demand for transition-specific workflows today.",
    sources: [
      src("other", 9, "https://www.epa.gov/climate-hfcs-reduction/technology-transitions-program", "EPA Technology Transitions Program", "The regulatory transition away from higher-GWP HFCs is active and still evolving."),
      src("blog", 45, "https://www.ahrinet.org/a2l-video-series", "AHRI A2L video series", "Industry groups are still educating contractors, distributors, and inspectors on A2L handling and code changes."),
      src("blog", 22, "https://www.achrnews.com/articles/166001-a2ls-advance-despite-regulatory-uncertainty", "ACHR News on A2Ls advancing despite regulatory uncertainty", "Trade coverage shows the transition is underway even while operational uncertainty remains high."),
      src("reddit", 329, "https://www.reddit.com/r/HVAC/comments/1lmy83h", "r/HVAC discussion on A2L tool and truck readiness", "Technicians are explicitly complaining about tool changes, costs, and install confusion tied to the A2L transition."),
    ],
  },
  leadLine: {
    industry: "Water & Utilities",
    audience: "B2B2C",
    niche: "Lead-line replacement operations",
    model_type: "SaaS",
    moat: "Regulatory access",
    distribution_play: "Direct sales",
    demand_trend: "Accelerating",
    market_size_summary: "Lead-service-line replacement programs sit at the intersection of regulation, resident coordination, contractor management, and public funding. That makes them ideal for workflow software because the bottleneck is operational execution more than strategy.",
    timing_rationale: "EPA’s Lead and Copper Rule Improvements require systems to identify and replace lead pipes on a defined timeline, while funding and execution support materials continue to expand. Utilities and engineering partners now have both deadlines and budget, but still lack resident-facing operating systems.",
    sources: [
      src("other", 140, "https://www.epa.gov/ground-water-and-drinking-water/lead-and-copper-rule-improvements", "EPA Lead and Copper Rule Improvements", "The final rule requires drinking water systems to identify and replace lead pipes within 10 years."),
      src("other", 90, "https://www.epa.gov/ground-water-and-drinking-water/funding-lead-service-line-replacement", "EPA funding sources for lead service line replacement", "Federal and non-federal funding paths exist specifically for lead-line work."),
      src("other", 70, "https://www.epa.gov/ground-water-and-drinking-water/planning-and-conducting-lead-service-line-replacement", "EPA planning and conducting lead service line replacement", "EPA is publishing detailed operational guidance for full replacement programs."),
    ],
  },
  dairyBiosecurity: {
    industry: "Food & Agriculture",
    audience: "B2B",
    niche: "Dairy H5N1 operations",
    model_type: "SaaS",
    moat: "Regulatory access",
    distribution_play: "Direct sales",
    demand_trend: "Steady growth",
    market_size_summary: "The H5N1 response creates recurring logistics, testing, documentation, and biosecurity workflows across farms, processors, and regulators. These are narrow markets but painful enough to sustain focused vertical products.",
    timing_rationale: "USDA launched the National Milk Testing Strategy on December 6, 2024, APHIS continues to update guidance and FAQs, and dairy-specific biosecurity materials remain active. The need is operational and immediate, not theoretical.",
    sources: [
      src("other", 169, "https://www.usda.gov/about-usda/news/press-releases/2024/12/06/usda-announces-new-federal-order-begins-national-milk-testing-strategy-address-h5n1-dairy-herds", "USDA announces National Milk Testing Strategy", "Federal testing and reporting requirements are now shaping dairy operations."),
      src("other", 70, "https://www.aphis.usda.gov/national-milk-testing-strategy", "APHIS National Milk Testing Strategy page", "APHIS continues to maintain and update the strategy as a live program."),
      src("other", 120, "https://www.aphis.usda.gov/livestock-poultry-disease/avian/avian-influenza/hpai-detections/livestock/nmts/faq", "APHIS NMTS FAQ", "Producers and processors still need detailed implementation guidance around testing stages and obligations."),
    ],
  },
  apprenticeship: {
    industry: "Education & Workforce",
    audience: "B2B",
    niche: "Registered apprenticeship operations",
    model_type: "SaaS",
    moat: "Distribution",
    distribution_play: "Partnerships",
    demand_trend: "Steady growth",
    market_size_summary: "Employers, school systems, and intermediaries are being pushed into apprenticeship structures without having apprenticeship-native operating tools. This is a classic wedge where process complexity grows faster than incumbent software quality.",
    timing_rationale: "The Department of Labor released updated Registered Apprenticeship guidance on March 9, 2026, announced new expansion funding on April 13, 2026, and continues to publish fresh participation data in education-linked apprenticeships. That is a strong signal that apprenticeship administration is growing beyond the trades-only core.",
    sources: [
      src("other", 76, "https://www.dol.gov/newsroom/releases/eta/eta20260309", "DOL updated guidance for Registered Apprenticeship", "Federal guidance is still changing the operating expectations for sponsors and partners."),
      src("other", 41, "https://www.dol.gov/newsroom/releases/eta/eta20260413?lang=fa", "DOL announces $85M in apprenticeship expansion funding", "States and intermediaries are still being funded to expand and modernize apprenticeship programs."),
      src("other", 20, "https://www.apprenticeship.gov/sites/default/files/Education-20260501.pdf", "Education apprentices served, fiscal years 2021-2025", "Fresh apprenticeship participation data shows the model expanding into education pathways."),
    ],
  },
  foodTraceability: {
    industry: "Food & Agriculture",
    audience: "B2B",
    niche: "Food traceability readiness",
    model_type: "SaaS",
    moat: "Proprietary data",
    distribution_play: "Direct sales",
    demand_trend: "Steady growth",
    market_size_summary: "Traceability remains a painful problem because it spans suppliers, lot codes, receiving, recalls, and record retrieval across fragmented operators. The compliance delay to 2028 buys time, but it does not remove the work or the budget need.",
    timing_rationale: "FDA is still actively publishing implementation resources, FAQs, and stakeholder actions around the Food Traceability Rule even after Congress pushed enforcement out to July 20, 2028. That means the market is in preparedness mode rather than dead mode.",
    sources: [
      src("other", 25, "https://www.fda.gov/food/food-safety-modernization-act-fsma/fsma-final-rule-requirements-additional-traceability-records-certain-foods", "FDA FSMA final rule for additional traceability records", "The core recordkeeping rule remains the central compliance anchor for covered foods."),
      src("other", 95, "https://www.fda.gov/food/hfp-constituent-updates/fda-takes-several-actions-related-food-traceability-rule", "FDA actions related to the Food Traceability Rule", "FDA is still investing in implementation materials and stakeholder engagement in 2026."),
      src("other", 120, "https://www.fda.gov/food/new-era-smarter-food-safety/tracking-and-tracing-food", "FDA tracking and tracing of food overview", "FDA continues to frame traceability as a strategic public-health capability rather than a paperwork exercise."),
      src("reddit", 275, "https://www.reddit.com/r/manufacturing/comments/1mx5ele/fsma_204/", "r/manufacturing discussion on FSMA 204 paperwork and tracking", "Operators are openly describing ERP gaps, paperwork pain, and retrieval worries around FSMA 204."),
    ],
  },
  droneCompliance: {
    industry: "Industrial & Drone Ops",
    audience: "B2B",
    niche: "FAA drone compliance",
    model_type: "SaaS",
    moat: "Regulatory access",
    distribution_play: "Direct sales",
    demand_trend: "Steady growth",
    market_size_summary: "Commercial drone operators are still small enough to reject heavyweight aviation software but regulated enough to need documentation, waiver, and authorization workflows. That gap supports narrow compliance and mission-readiness products.",
    timing_rationale: "Remote ID is now a standing operational requirement, Part 107 waiver workflows are still active, and the FAA continues updating application guidance and authorization processes. The paperwork surface is now durable enough to build on.",
    sources: [
      src("other", 430, "https://www.faa.gov/uas/getting_started/remote_id", "FAA Remote Identification of Drones", "Remote ID is now a baseline requirement for registered drone operations."),
      src("other", 70, "https://www.faa.gov/uas/commercial_operators/part_107_waivers", "FAA Part 107 waivers", "Waivers remain a live path for operations outside standard Part 107 limits."),
      src("other", 60, "https://www.faa.gov/uas/commercial_operators/part_107_airspace_authorizations", "FAA Part 107 airspace authorizations", "Commercial operators still need a formal pathway for controlled-airspace approvals."),
      src("reddit", 300, "https://www.reddit.com/r/fpv/comments/1ls2nx6/asking_all_us_fpv_flyers_about_remote_id/", "r/fpv discussion on Remote ID compliance", "Pilots are still debating compliance, enforcement, and the operational burden of Remote ID in practice."),
    ],
  },
  gridInterconnection: {
    industry: "Energy & Grid Infrastructure",
    audience: "B2B",
    niche: "Large-load power coordination",
    model_type: "SaaS",
    revenue_ceiling: "Venture ($10M+ ARR)",
    moat: "Regulatory access",
    distribution_play: "Direct sales",
    demand_trend: "Accelerating",
    market_size_summary: "Large-load coordination around data centers, co-location, interconnection, and demand flexibility is high-value, slow-moving, and deeply document-heavy. That favors workflow and brokerage products because each win supports meaningful contract value.",
    timing_rationale: "NERC’s 2025 Long-Term Reliability Assessment explicitly calls out data-center and large-load growth, while FERC is forcing PJM and other market participants to clarify co-location and forecasting rules. The pain is no longer speculative; it is on the grid operator agenda.",
    sources: [
      src("other", 35, "https://www.nerc.com/globalassets/our-work/assessments/nerc_ltra_2025.pdf", "NERC 2025 Long-Term Reliability Assessment", "NERC explicitly highlights data-center and large-load growth as a planning challenge."),
      src("other", 160, "https://www.ferc.gov/news-events/news/fact-sheet-ferc-directs-nations-largest-grid-operator-create-new-rules-embrace", "FERC fact sheet on large-load co-location rules", "FERC is forcing new tariff clarity around data centers and co-located generation."),
      src("other", 250, "https://www.ferc.gov/news-events/news/chairman-rosners-letter-rtosisos-large-load-forecasting", "FERC Chairman letter on large-load forecasting", "Large-load forecasting and queue realism are now explicit regulatory concerns."),
    ],
  },
  freightTransparency: {
    industry: "Logistics & Supply Chain",
    audience: "B2B",
    niche: "Carrier and broker transparency",
    model_type: "SaaS",
    moat: "Distribution",
    distribution_play: "Cold outbound",
    demand_trend: "Steady growth",
    market_size_summary: "Owner-operators, small fleets, and importers live inside high-friction exception workflows with thin margins and weak visibility. Narrow tools that resolve disputes, onboarding friction, or broker opacity can win because they touch cash flow directly.",
    timing_rationale: "FMCSA’s broker-transparency NPRM is active, OOIDA continues to press for stronger enforcement, and litigation around transparency rights remains live. The argument is not whether the workflow matters; it is how quickly it gets modernized.",
    sources: [
      src("other", 560, "https://www.fmcsa.dot.gov/regulations/docket-no-fmcsa-2023-0257-rin-2126-ac63-transparency-property-broker-transactions", "FMCSA NPRM on transparency in property broker transactions", "Federal regulators are still actively revising broker recordkeeping and access rules."),
      src("blog", 120, "https://www.ooida.com/2025/ooida-calls-for-stronger-broker-transparency-regs-to-protect-small-business-truckers/", "OOIDA calls for stronger broker transparency rules", "The largest owner-operator group continues to frame transparency as an urgent small-business issue."),
      src("blog", 430, "https://www.freightwaves.com/news/tql-faces-federal-lawsuit-over-broker-transparency-dispute", "FreightWaves on TQL broker-transparency dispute", "The issue is active enough to surface in litigation, not just policy commentary."),
      src("reddit", 494, "https://www.reddit.com/r/Truckers/comments/1i2xhho/if_you_guys_want_change_in_the_trucking_industry/", "r/Truckers discussion urging comments on broker transparency", "Carriers openly describe brokers as squeezing both carriers and shippers, and treat transparency as a live cash-flow problem."),
    ],
  },
  constructionSafety: {
    industry: "Construction & Skilled Trades",
    audience: "B2B",
    niche: "Inspection and safety ops",
    model_type: "SaaS",
    moat: "Distribution",
    distribution_play: "Partnerships",
    demand_trend: "Steady growth",
    market_size_summary: "Construction safety workflows remain fragmented across general contractors, subcontractors, insurers, and job sites. Buyers will pay for products that reduce document chaos, inspection risk, or insurance friction without trying to replace their entire field stack.",
    timing_rationale: "OSHA’s walkaround rule changed inspection representation in 2024, implementation guidance remains active, and BLS continues to show construction as the deadliest private-sector industry by count. That is enough pressure to support better inspection and recordkeeping tools.",
    sources: [
      src("other", 420, "https://www.osha.gov/worker-walkaround/final-rule", "OSHA worker walkaround final rule", "Inspection representation changed recently enough that operating procedures are still catching up."),
      src("other", 380, "https://www.osha.gov/memos/2024-05-10/interim-guidance-worker-walkaround-representative-designation-process", "OSHA interim guidance for walkaround representative designation", "OSHA had to issue implementation guidance immediately after the rule change."),
      src("other", 20, "https://www.bls.gov/opub/ted/2026/national-safety-stand-down-highlights-fall-hazards-in-construction.htm", "BLS on construction fall hazards and fatalities", "Construction still leads private-industry workplace deaths, with falls dominating the risk profile."),
      src("reddit", 30, "https://www.reddit.com/r/SafetyProfessionals/comments/1sazl0c/how_does_everyone_here_collect_and_track_near/", "r/SafetyProfessionals discussion on near-miss reporting friction", "Safety teams are explicitly complaining about paper forms and data-entry-heavy near-miss workflows."),
    ],
  },
  shiftWork: {
    industry: "Education & Workforce",
    audience: "B2C",
    niche: "Predictable scheduling",
    model_type: "SaaS",
    moat: "Network effects",
    distribution_play: "Community-led",
    demand_trend: "Steady growth",
    market_size_summary: "Scheduling instability remains a real pain for hourly workers and a compliance cost for multi-location employers. The wedge exists both on the worker side and the employer evidence side because predictable scheduling rules create recurring recordkeeping and premium-pay workflows.",
    timing_rationale: "New York City and Seattle still maintain active fair-workweek and secure-scheduling enforcement pages, while vertical scheduling vendors continue publishing compliance explainers in 2026. That indicates the problem has not normalized into a solved feature.",
    sources: [
      src("other", 180, "https://www.nyc.gov/site/dca/workers/workersrights/fastfood-retail-workers.page", "NYC Fair Workweek protections for fast food workers", "Large cities still maintain active scheduling-rights enforcement and documentation requirements."),
      src("other", 240, "https://www.glb.seattle.gov/laborstandards/ordinances/secure-scheduling", "Seattle secure scheduling ordinance", "Advance notice, premium pay, and access-to-hours requirements remain active obligations."),
      src("blog", 100, "https://www.7shifts.com/blog/fair-workweek-law/", "7shifts overview of fair workweek law", "Scheduling vendors continue publishing compliance explainers because operators still need help implementing the rules."),
      src("reddit", 120, "https://www.reddit.com/r/restaurantowners/comments/1pzo7ld/do_your_staff_actually_follow_the_schedule_or/", "r/restaurantowners discussion on text-chaos around scheduling", "Operators describe the official schedule living in an app while swaps and call-outs still happen chaotically over text."),
    ],
  },
  openSourceMaintainers: {
    industry: "Developer Tools",
    audience: "Prosumer",
    niche: "Maintainer workflow tooling",
    model_type: "SaaS",
    moat: "Speed of execution",
    distribution_play: "Community-led",
    demand_trend: "Accelerating",
    market_size_summary: "There are more open-source repositories, more AI-assisted contributors, and more issue/PR volume than most solo maintainers can handle. The budget is usually small, but the willingness to try focused tooling is high when the product saves time inside an existing GitHub workflow.",
    timing_rationale: "GitHub’s own 2025 Octoverse numbers show public repository growth and AI-driven contribution growth, while GitHub is actively publishing tools for issue triage and maintainers are publicly complaining about AI-generated support load. That makes maintainer ops a strong practice-project category with real user pain and accessible APIs.",
    sources: [
      src("blog", 210, "https://github.blog/news-insights/octoverse/octoverse-a-new-developer-joins-github-every-second-as-ai-leads-typescript-to-1/", "GitHub Octoverse 2025", "GitHub reported continued growth in developers, repositories, and AI-related project activity."),
      src("blog", 270, "https://github.blog/open-source/maintainers/how-github-models-can-help-open-source-maintainers-focus-on-what-matters/", "GitHub on helping open-source maintainers focus on what matters", "GitHub is explicitly positioning AI tooling around issue triage, duplicate detection, and contributor onboarding."),
      src("reddit", 160, "https://www.reddit.com/r/opensource/comments/1pn9qpl/solo_maintainer_suddenly_drowning_in_prsissues_i/", "r/opensource discussion from a solo maintainer drowning in issues and PRs", "Maintainers describe popularity turning into unpaid triage and support work."),
      src("reddit", 130, "https://www.reddit.com/r/opensource/comments/1q3f89b/open_source_is_being_ddosed_by_ai_slop_and_github/", "r/opensource discussion on AI slop overwhelming maintainers", "Maintainers are now dealing with low-quality AI-generated issues, PRs, and bug reports on top of normal support load."),
    ],
  },
  jobSearchOps: {
    industry: "Education & Workforce",
    audience: "B2C",
    niche: "Job-search workflow tools",
    model_type: "SaaS",
    moat: "Brand & community",
    distribution_play: "Community-led",
    demand_trend: "Accelerating",
    market_size_summary: "Job seekers now manage far more application volume, recruiter noise, and resume tailoring than they did a few years ago, but most still resort to spreadsheets, folders, and Gmail search. The willingness to pay is modest, which makes this a better practice-build category than a venture category, but the user pain is real and immediate.",
    timing_rationale: "Greenhouse and employers are openly acknowledging mass-application fatigue, companies are publishing unprecedented inbound-application numbers, and job seekers keep describing the application process as a black hole. That makes job-search ops fertile ground for narrow tools that teach AI-assisted product building.",
    sources: [
      src("blog", 300, "https://www.greenhouse.com/blog/greenhouse-2025-workforce-hiring-report", "Greenhouse 2025 Workforce & Hiring Report", "Hiring platforms are publicly framing the market around bots, burnout, and application overload."),
      src("blog", 66, "https://www.checklyhq.com/blog/checkly-2025-hiring-data/", "Checkly 2025 hiring data", "Checkly reported more than a thousand applications per posting, showing how much volume candidates now compete inside."),
      src("blog", 354, "https://www.greenhouse.com/de/newsroom/greenhouse-launches-dream-job-to-fix-job-hunting-and-boost-candidates-chances-of-getting-hired", "Greenhouse launches Dream Job to fix job hunting", "Hiring software vendors are shipping candidate-side tools because the normal application process is failing users."),
      src("reddit", 81, "https://www.reddit.com/r/recruitinghell/comments/1rkwkox/how_are_you_guys_actually_keeping_track_of_all/", "r/recruitinghell discussion on keeping track of job applications", "Job seekers describe inbox chaos, manual spreadsheets, and losing track of recruiter threads."),
      src("reddit", 49, "https://www.reddit.com/r/recruitinghell/comments/1str4kp/the_black_hole_and_parasitic_effect_of_applying/", "r/recruitinghell discussion on the black-hole effect of applying", "People are explicitly talking about wasting hours tailoring applications that disappear into unresponsive systems."),
    ],
  },
  researchWorkflow: {
    industry: "Education & Workforce",
    audience: "Prosumer",
    niche: "Research paper workflow",
    model_type: "SaaS",
    moat: "Speed of execution",
    distribution_play: "Community-led",
    demand_trend: "Steady growth",
    market_size_summary: "Graduate students, independent researchers, and knowledge workers all struggle with the same core problem: papers, notes, citations, and meeting context spread across too many tools. This is a strong category for practice projects because users already live in exportable formats like PDFs, Markdown, and Zotero libraries.",
    timing_rationale: "Zotero continues improving its reader and note workflows, researchers are actively experimenting with AI-assisted literature review, and public communities are full of people describing unread-PDF graveyards and messy note systems. That combination makes this a durable practice-build category with clear inputs and outputs.",
    sources: [
      src("other", 25, "https://www.zotero.org/support/pdf_reader", "Zotero PDF Reader and Note Editor documentation", "Zotero keeps deepening annotation, note, and PDF-reader workflows that third-party tools can build around."),
      src("arxiv", 65, "https://arxiv.org/abs/2603.22327", "AgentSLR: Automating Systematic Literature Reviews in Epidemiology with Agentic AI", "Recent research shows active interest in AI-assisted article retrieval, screening, and synthesis."),
      src("reddit", 54, "https://www.reddit.com/r/PhD/comments/1s7i68f/whats_your_system_for_keeping_track_of_everything/", "r/PhD discussion on keeping track of everything during a PhD", "Researchers describe chaos across papers, emails, chapter notes, and meeting context."),
      src("reddit", 410, "https://www.reddit.com/r/PhdProductivity/comments/1juy9o6/does_anyone_feel_like_zotero_just_becomes_a/", "r/PhdProductivity discussion on Zotero becoming a graveyard of unread PDFs", "Users explicitly complain that collecting PDFs is easier than turning them into a usable reading workflow."),
      src("reddit", 19, "https://www.reddit.com/r/PhD/comments/1t41yhs/disorganized_research_workflow_how_did_you_fix_it/", "r/PhD discussion on fixing a disorganized research workflow", "Researchers still describe their systems as chaotic even after adopting several note and reference tools."),
    ],
  },
  teacherAdmin: {
    industry: "Education & Workforce",
    audience: "B2C",
    niche: "Teacher admin workload",
    model_type: "SaaS",
    moat: "Brand & community",
    distribution_play: "Community-led",
    demand_trend: "Steady growth",
    market_size_summary: "Teachers have constant, repetitive admin work but limited budgets and limited patience for heavyweight software. That makes teacher-admin products better as tight, AI-friendly workflow tools than as all-in-one platforms, which is exactly why they are strong practice projects.",
    timing_rationale: "Education Week and RAND continue documenting heavy weekly workloads and expanding non-teaching duties, while teacher communities keep describing grades, parent emails, IEP paperwork, and progress reports as the work that spills into nights and weekends. The pain is stable, visible, and easy to prototype around.",
    sources: [
      src("blog", 117, "https://www.edweek.org/teaching-learning/teachers-say-they-keep-getting-new-duties-what-are-they/2026/01", "Education Week on teachers getting new duties", "Education Week reports that teachers still work about 54 hours a week and keep accumulating non-teaching tasks."),
      src("blog", 1490, "https://www.edweek.org/teaching-learning/how-teachers-spend-their-time-a-breakdown/2022/04", "Education Week breakdown of how teachers spend their time", "The workload data continues to show substantial time outside direct instruction."),
      src("reddit", 69, "https://www.reddit.com/r/Teachers/comments/1ruyupe/does_anyone_else_feel_like_half_the_job_is_now/", "r/Teachers discussion on half the job feeling like paperwork", "Teachers describe progress reports, documentation, parent communication logs, and assessment data entry taking over the week."),
      src("reddit", 79, "https://www.reddit.com/r/Teachers/comments/1rkk8m7/teachers_with_5_or_more_preps_how_do_you_deal/", "r/Teachers discussion on grading with five or more preps", "Teachers describe grading, curriculum work, IEP paperwork, meetings, and parent emails eating all available prep time."),
      src("reddit", 128, "https://www.reddit.com/r/Teachers/comments/1qer8sb/are_you_using_ai_as_a_teacher/", "r/Teachers discussion on using AI behind the scenes", "Teachers are actively looking for ways to reduce workload without surrendering judgment."),
    ],
  },
  freelancerBackOffice: {
    industry: "Vertical SaaS",
    audience: "Prosumer",
    niche: "Freelancer admin and invoicing",
    model_type: "SaaS",
    moat: "Speed of execution",
    distribution_play: "Community-led",
    demand_trend: "Steady growth",
    market_size_summary: "Millions of independent workers now handle proposals, contracts, invoices, and scope management themselves, but most still stitch the workflow together from email, Stripe, templates, and reminders. These users do not need a giant suite; they need one painful admin loop to stop leaking time or money.",
    timing_rationale: "Upwork’s workforce data shows independent knowledge work continuing to grow, PayPal keeps publishing small-business invoicing guidance around late payments, and freelance communities still talk constantly about scope creep and chasing invoices. That makes freelancer back office a reliable practice-build category.",
    sources: [
      src("other", 396, "https://investors.upwork.com/node/11771/pdf", "Upwork Future Workforce Index 2025", "Upwork reported that more than one in four U.S. knowledge workers now work independently."),
      src("blog", 690, "https://www.paypal.com/us/brc/article/create-an-online-invoice-tracker", "PayPal on keeping track of invoices and payments", "Small-business payment tooling still frames invoice tracking and late payments as recurring operational pain."),
      src("blog", 394, "https://www.upwork.com/resources/late-payment-follow-ups", "Upwork guide to following up on late payments", "Late-payment follow-up remains common enough that Upwork maintains dedicated guidance and templates."),
      src("reddit", 95, "https://www.reddit.com/r/FreelanceProgramming/comments/1r7cmzl/how_do_you_handle_scope_creep_and_late_payments/", "r/FreelanceProgramming discussion on scope creep and late payments", "Freelancers describe manual invoice updates, payment chasing, and unstructured scope changes as the repeating pain."),
      src("reddit", 37, "https://www.reddit.com/r/web_design/comments/1rrmke2/how_do_you_guys_actually_handle_scope_creep/", "r/web_design discussion on handling scope creep", "Freelancers are explicitly asking whether a dedicated workflow tool for scope creep would be useful."),
    ],
  },
};

const PRACTICE_THEME_KEYS = new Set<ThemeKey>([
  "openSourceMaintainers",
  "jobSearchOps",
  "researchWorkflow",
  "teacherAdmin",
  "freelancerBackOffice",
]);

function inferPracticeDifficulty(idea: IdeaSeed): Opportunity["difficulty"] {
  const hay = `${idea.title} ${idea.niche} ${idea.summary}`.toLowerCase();
  const hardSignals = [
    "matcher",
    "preflight",
    "scorer",
    "extract",
    "matrix",
    "retriever",
    "context finder",
    "citation",
    "methods",
    "replay coach",
    "scope change detector",
    "risk board",
    "issue duplicate",
    "ats keyword",
  ];
  const mediumSignals = [
    "builder",
    "generator",
    "scheduler",
    "tracker",
    "board",
    "portal",
    "digest",
    "planner",
    "brief",
    "combiner",
    "timeline",
    "wallet",
    "converter",
    "grader",
    "summarizer",
  ];

  if (hardSignals.some((signal) => hay.includes(signal))) return "Hard";
  if (mediumSignals.some((signal) => hay.includes(signal))) return "Medium";
  return "Easy";
}

function inferPracticeBuildStack(idea: IdeaSeed, difficulty: Opportunity["difficulty"]): Opportunity["build_stack_hint"] {
  const hay = `${idea.title} ${idea.niche} ${idea.summary}`.toLowerCase();
  const heavyIntegrationSignals = [
    "github",
    "gmail",
    "pdf",
    "oauth",
    "vector",
    "retriever",
    "citation",
    "issue",
    "invoice",
    "api",
    "context",
    "extract",
  ];

  if (difficulty === "Hard") return "Traditional engineering";
  if (heavyIntegrationSignals.some((signal) => hay.includes(signal))) return "Hybrid";
  return "AI-coded (Claude/Cursor/Codex)";
}

function inferPracticeStartingCapital(difficulty: Opportunity["difficulty"]): Opportunity["starting_capital"] {
  return difficulty === "Hard" ? "$1k-$10k" : "Under $1k";
}

function inferPracticeLaunchTime(difficulty: Opportunity["difficulty"]): Opportunity["time_to_launch"] {
  if (difficulty === "Hard") return "1-3 months";
  if (difficulty === "Medium") return "Weeks";
  return "Days";
}

const IDEAS_BY_THEME: Record<ThemeKey, SeedInput[]> = {
  accounting: [
    ["smallTeam", "Client onboarding OS for solo bookkeepers", "Bookkeeping onboarding", "A client-intake workspace for one- and two-person bookkeeping firms that still chase statements, portal access, and kickoff tasks across email and spreadsheets."],
    ["solo", "Tax organizer reminder autopilot for independent preparers", "Tax intake automation", "A reminder and status engine for independent tax preparers that automatically escalates missing documents before returns fall behind schedule."],
    ["smallTeam", "White-label portal for neighborhood accounting firms", "Client portal", "A branded portal small accounting firms can hand to clients for uploads, status updates, and recurring requests without buying enterprise practice software."],
    ["solo", "Practice migration assistant for spreadsheet-based firms", "Data migration", "A done-for-you migration and cleanup tool for small firms moving off shared drives and ad hoc spreadsheets into a repeatable workflow system."],
    ["domainExpert", "Cash-application copilot for outsourced CFO shops", "Receivables operations", "A workflow assistant for outsourced finance teams reconciling payments, follow-ups, and close tasks across multiple small-business clients."],
    ["smallTeam", "Recurring close tracker for fractional finance teams", "Monthly close ops", "A lightweight operating system for fractional controllers and outsourced close teams that need to run the same monthly sequence across dozens of clients."],
    ["solo", "Month-end close checklist vault for micro CPA firms", "Close checklists", "A simple vault of recurring close checklists, evidence links, and owner sign-offs for micro CPA firms that still run close work from memory."],
    ["smallTeam", "Accounts-payable inbox router for bookkeeping shops", "AP inbox triage", "An inbox and task router that turns vendor bills and approval requests into the right client workflow for small bookkeeping teams."],
    ["solo", "Bookkeeping cleanup scoping tool for messy client files", "Cleanup estimation", "A scoping tool that helps bookkeepers quote cleanup work based on file complexity, missing months, and likely reconciliation pain."],
    ["domainExpert", "Tax notice response tracker for local accounting firms", "Tax notice handling", "A tracker for local firms juggling IRS and state notices, client document requests, response drafts, and deadlines."],
    ["smallTeam", "Client KPI pack builder for fractional CFO teams", "Reporting packs", "A reporting-pack builder for fractional CFO teams that need to turn raw books into consistent monthly KPI decks for multiple clients."],
    {
      stage: "smallTeam",
      title: "Reconciliation exception inbox for outsourced bookkeeping teams",
      niche: "Reconciliation ops",
      summary: "A reconciliation exception inbox that routes unmatched transactions, stale rules, and missing-support requests across outsourced bookkeeping teams before month-end turns chaotic.",
      build_stack_hint: "Traditional engineering",
    },
    {
      stage: "solo",
      title: "Client document chase portal for tax and bookkeeping firms",
      niche: "Document chasing",
      summary: "A simple client portal that keeps recurring document requests, reminders, and upload status out of email threads for independent tax and bookkeeping firms.",
      model_type: "Productized Service",
    },
    {
      stage: "smallTeam",
      title: "Payroll-close blocker tracker for multi-client accounting shops",
      niche: "Payroll close ops",
      summary: "A blocker tracker for accounting shops that run payroll close across many clients and keep getting stuck on missing approvals, timecard edits, and last-minute corrections.",
      build_stack_hint: "Traditional engineering",
    },
    {
      stage: "smallTeam",
      title: "Sales-tax notice triage board for local accounting firms",
      niche: "Sales-tax notices",
      summary: "A triage board for local accounting firms handling state sales-tax notices, deadline tracking, and client follow-ups that otherwise disappear inside inboxes.",
      build_stack_hint: "AI-coded (Claude/Cursor/Codex)",
    },
    {
      stage: "solo",
      title: "Entity setup packet builder for solo CPA firms",
      niche: "Entity setup packets",
      summary: "A packet builder that helps solo CPA firms turn entity-setup requests into repeatable checklists, document requests, and client handoff packets.",
      model_type: "Productized Service",
    },
  ],
  industrialMro: [
    ["smallTeam", "Obsolescence alert feed for PLC-heavy plants", "Lifecycle intelligence", "A watchlist that flags end-of-life notices, secondary-market inventory changes, and replacement-risk signals for plants running aging PLC and HMI fleets."],
    ["smallTeam", "Compatibility ledger for legacy industrial boards", "Compatibility data", "A searchable compatibility ledger for legacy industrial boards and modules that records what worked, what failed, and what needed adaptation on real lines."],
    ["venture", "Estate-sale sourcing network for industrial spares", "Supply aggregation", "A sourcing marketplace that turns plant closures, auctions, and estate sales into structured supply for obsolete industrial spare parts."],
    ["domainExpert", "Return-grade verification service for surplus automation parts", "Quality assurance", "A verification workflow and certification layer for surplus automation parts so buyers can distinguish tested inventory from risky unknown stock."],
    ["smallTeam", "Shutdown parts war-room for maintenance teams", "Shutdown coordination", "A centralized war-room for planned shutdowns that tracks critical parts, backup vendors, courier chains, and last-minute substitutions."],
    ["solo", "BOM resurrection service for discontinued machine lines", "Bill-of-materials recovery", "A service-and-software hybrid that reconstructs missing bills of materials and replacement options for machine lines whose OEM support has disappeared."],
  ],
  syntheticData: [
    ["smallTeam", "FHIR sandbox data builder", "FHIR test data", "A synthetic-data builder for health-tech teams that need realistic FHIR bundles, linked patients, and edge cases in staging without touching production PHI."],
    ["smallTeam", "PCI-safe staging mirror for fintech apps", "Payments staging", "A staging-data layer that preserves transaction shapes and failure modes for fintech products without copying live PCI-sensitive records."],
    ["domainExpert", "Synthetic claims dataset exchange for health software vendors", "Claims simulation", "A licensed synthetic dataset exchange for health-tech vendors that need repeatable claims and reimbursement scenarios for product and QA teams."],
    ["smallTeam", "Schema drift detector for synthetic data pipelines", "Data pipeline QA", "A monitor that flags when schema or distribution drift makes previously generated synthetic datasets misleading or unusable for testing."],
    ["smallTeam", "Synthetic-data fidelity evaluation harness", "Quality benchmarking", "A benchmarking harness that compares synthetic-data outputs for fidelity, privacy, and edge-case coverage before teams trust them in test pipelines."],
    ["venture", "Vertical synthetic data warehouse for regulated AI teams", "Regulated AI infrastructure", "A managed warehouse of reusable synthetic datasets and generators tuned for healthcare, insurance, and financial AI product teams."],
    {
      stage: "smallTeam",
      title: "Masked Postgres refresh API for staging environments",
      niche: "Masked staging refresh",
      summary: "An API that refreshes staging databases with masked relational data so teams stop choosing between realistic testing and copying production records around.",
      model_type: "API / Usage-Based",
      build_stack_hint: "Traditional engineering",
    },
    {
      stage: "smallTeam",
      title: "Synthetic FHIR edge-case library for health-tech QA teams",
      niche: "FHIR edge cases",
      summary: "A library of synthetic FHIR edge cases for health-tech QA teams that need realistic coverage for referrals, claims, prior auth, and messy patient timelines.",
      model_type: "API / Usage-Based",
      build_stack_hint: "Traditional engineering",
    },
    {
      stage: "smallTeam",
      title: "Test-data approval workflow for privacy teams",
      niche: "Privacy approvals",
      summary: "A workflow that gives privacy and security teams a review queue for test-data requests instead of making them police ad hoc database copies after the fact.",
      build_stack_hint: "Hybrid",
    },
    {
      stage: "smallTeam",
      title: "Demo dataset generator for B2B SaaS sales engineers",
      niche: "Demo data generation",
      summary: "A generator that creates believable demo datasets and edge-case scenarios for sales engineers who keep hand-editing brittle fake accounts before every demo.",
      build_stack_hint: "AI-coded (Claude/Cursor/Codex)",
    },
    {
      stage: "venture",
      title: "Tenant-isolated sandbox data broker for multi-tenant SaaS",
      niche: "Tenant sandboxing",
      summary: "A broker that provisions tenant-isolated sandbox datasets for multi-tenant SaaS products where staging realism, customer privacy, and support access are in constant conflict.",
      model_type: "API / Usage-Based",
      build_stack_hint: "Traditional engineering",
    },
  ],
  complianceReadiness: [
    ["solo", "Security questionnaire answer base for early-stage SaaS teams", "Questionnaire workflows", "A structured answer bank that turns repeated enterprise security questionnaires into a reusable, reviewable knowledge base for lean startup teams."],
    ["smallTeam", "Control-evidence calendar for lean compliance teams", "Evidence operations", "A recurring calendar and task system that tells small teams exactly which controls, screenshots, exports, and approvals they need to gather each week."],
    ["solo", "Vendor policy pack generator for first enterprise deals", "Policy generation", "A productized workflow that assembles a startup’s first usable policy pack, security FAQ, and supporting trust documents for enterprise sales."],
    ["smallTeam", "Audit-request portal for startups selling to banks", "Audit intake", "A secure portal for handling customer audit requests, follow-ups, and document exchange when startups start selling into regulated buyers."],
    ["domainExpert", "SOC 2 to ISO 27001 gap mapper for growing SaaS companies", "Framework mapping", "A mapping workspace for companies graduating from SOC 2 into ISO 27001 and trying to reuse evidence instead of restarting compliance from scratch."],
    ["smallTeam", "Continuous evidence collector for human-heavy controls", "Manual control automation", "A lightweight evidence collector for controls that still rely on screenshots, approvals, interviews, and recurring human sign-offs rather than APIs."],
    ["solo", "Trust-center launch kit for AI startups", "Trust center setup", "A fixed-scope launch kit that gets AI startups from scattered docs to a usable trust center before enterprise buyers start asking hard questions."],
    ["smallTeam", "Customer security-review SLA tracker", "Review operations", "A tracker that keeps incoming customer security reviews from stalling in inboxes by assigning owners and deadlines to each request."],
    ["smallTeam", "AI vendor-risk response pack for procurement-heavy sales", "Vendor risk packets", "A response pack builder for startups that need to answer AI governance and vendor-risk questions before procurement will move forward."],
    ["domainExpert", "Access-review evidence workspace for lean IT teams", "Access reviews", "A workspace that helps lean IT and security teams collect, approve, and archive quarterly access review evidence without spreadsheet sprawl."],
    ["solo", "Pen-test remediation coordinator for first enterprise audits", "Remediation follow-up", "A remediation tracker that turns a first penetration test into owned fixes, proof links, and customer-facing closeout updates."],
    {
      stage: "solo",
      title: "Customer pen-test request intake desk for AI startups",
      niche: "Pen-test intake",
      summary: "A lightweight intake desk for AI startups that keep getting customer pen-test requests and security follow-ups with no clean place to track status or scope.",
      model_type: "Productized Service",
    },
    {
      stage: "smallTeam",
      title: "Subprocessor disclosure updater for fast-shipping SaaS teams",
      niche: "Subprocessor updates",
      summary: "A workflow that keeps subprocessor pages, customer notices, and internal approvals aligned for SaaS teams that change vendors faster than their trust docs update.",
      build_stack_hint: "AI-coded (Claude/Cursor/Codex)",
    },
    {
      stage: "smallTeam",
      title: "Security questionnaire evidence linker for revops teams",
      niche: "Evidence linking",
      summary: "A linker that attaches the right screenshots, policy sections, and proof exports to repeated security questionnaire answers so revops teams stop rebuilding the same packet each time.",
      build_stack_hint: "Traditional engineering",
    },
    {
      stage: "smallTeam",
      title: "Policy version history vault for enterprise-selling startups",
      niche: "Policy versioning",
      summary: "A vault that preserves policy history, approval trails, and customer-facing change records for startups whose security docs keep changing during sales cycles.",
      build_stack_hint: "AI-coded (Claude/Cursor/Codex)",
    },
    {
      stage: "domainExpert",
      title: "Access request attestation workflow for lean IT teams",
      niche: "Access attestations",
      summary: "An attestation workflow for lean IT teams that need managers to review, confirm, and archive access decisions without quarterly spreadsheet fire drills.",
      build_stack_hint: "Hybrid",
    },
  ],
  oncology: [
    ["smallTeam", "Pathology slide logistics coordinator for remote second opinions", "Slide logistics", "A coordination layer that handles consent, slide shipment, image requests, and receipt tracking for cancer patients seeking remote second opinions."],
    ["domainExpert", "Tumor board packet builder for community oncology clinics", "Tumor board prep", "A packet builder that assembles records, genomic highlights, imaging references, and treatment history for community oncology tumor boards."],
    ["smallTeam", "Trial-screening intake for rare-presentation oncology patients", "Trial intake", "A patient-intake and eligibility workflow for oncology cases that require structured trial-screening beyond a generic clinicaltrials.gov search."],
    ["smallTeam", "Genomics consent and record-chase concierge", "Consent and records", "A workflow service that obtains consents and chases pathology, imaging, and genomics files so precision-oncology opinions start with a complete packet."],
    ["venture", "Employer-sponsored oncology navigation layer", "Employer benefits", "A navigation platform for self-insured employers that routes cancer patients into second opinions, genomic review, and trial discussions earlier in care."],
    ["domainExpert", "Outcome-library tooling for subspecialty oncology networks", "Clinical outcomes knowledge", "A tooling layer for subspecialty oncology networks to maintain searchable outcomes libraries and case analogs for difficult treatment decisions."],
  ],
  counterUas: [
    ["domainExpert", "Drone-incursion evidence room for utilities", "Incident evidence", "A secure evidence room for utilities to log detections, incidents, site photos, law-enforcement handoffs, and post-event reporting around drone incursions."],
    ["smallTeam", "Site-readiness checklist platform for passive counter-UAS deployments", "Deployment readiness", "A checklist and commissioning workspace for facilities preparing to deploy passive detection or interception systems around critical sites."],
    ["venture", "Shared monitoring network for industrial drone incursions", "Threat intelligence", "A shared monitoring and intelligence network that lets industrial operators compare incident patterns and correlate drone threats across sites."],
    ["domainExpert", "Insurance underwriting pack for counter-UAS buyers", "Insurance workflows", "An underwriting and renewal pack that helps critical-infrastructure buyers document their counter-UAS posture for insurers and risk committees."],
    ["smallTeam", "Operator-in-the-loop decision console for passive intercept systems", "Decision support", "A console that structures the approval, escalation, and incident timeline around passive intercept or response actions at critical facilities."],
    ["venture", "Managed detection service for substations and storage terminals", "Managed security", "A managed service for utilities and fuel terminals that combines sensors, triage, and incident playbooks for persistent low-altitude drone threats."],
  ],
  agentInference: [
    ["domainExpert", "Speculative decoding profiler for enterprise agent teams", "Inference profiling", "A profiler that shows exactly where agent workloads lose time and cost to speculative decoding, retries, and tool-call stalls."],
    ["smallTeam", "Tool-call trace benchmark suite for inference vendors", "Benchmarking", "A benchmark suite built from real tool-calling traces so inference vendors can measure agent performance on something more realistic than chat prompts."],
    ["venture", "Low-latency tool memory module for agent appliances", "Tool-state hardware", "A hardware-aware memory module that keeps tool state and branch context hot for regulated on-prem agent deployments."],
    ["domainExpert", "Cost attribution layer for branchy agent workloads", "FinOps for agents", "A FinOps layer that assigns true cost to branching, tool retries, and long-context decisions in enterprise agent stacks."],
    ["smallTeam", "Enterprise agent load replay harness", "Load testing", "A replay harness that reproduces real agent traces for load testing, regression testing, and infrastructure planning."],
    ["venture", "On-prem agent inference box for regulated workloads", "Regulated deployment", "A bundled appliance for regulated teams that need predictable agent latency, local logs, and zero data egress for tool-heavy workflows."],
  ],
  agentOrchestration: [
    ["smallTeam", "Agent identity and secrets broker for mid-market companies", "Identity and secrets", "A shared broker that manages credentials, token scope, and agent identities across internal automation stacks."],
    ["smallTeam", "Cross-agent handoff audit log", "Handoff observability", "An audit log that records when one internal agent hands work, data, or authority to another so teams can reconstruct failures later."],
    ["domainExpert", "Permission graph for internal agents touching finance and HR", "Permission governance", "A permission graph that shows which agents can touch finance, HR, and customer systems and where risky overlaps exist."],
    ["smallTeam", "Fallback router for mixed-vendor internal agents", "Reliability routing", "A routing layer that decides when internal agents should retry, escalate, or fail over to a different model or workflow."],
    ["venture", "Shared policy engine for agent fleets", "Policy orchestration", "A central policy engine that enforces approved tools, escalation rules, and data boundaries across an enterprise’s agent fleet."],
    ["domainExpert", "Agent incident review workspace for compliance teams", "Incident review", "A workspace for compliance and ops teams to review agent incidents, attach evidence, and document corrective actions."],
    {
      stage: "smallTeam",
      title: "Scoped tool registry for internal agent teams",
      niche: "Tool registries",
      summary: "A registry that defines which tools each internal agent can call so platform teams stop hard-coding permission logic into every workflow separately.",
      build_stack_hint: "Traditional engineering",
    },
    {
      stage: "smallTeam",
      title: "Agent permission receipts for compliance-sensitive workflows",
      niche: "Permission receipts",
      summary: "A receipt layer that records what an internal agent was allowed to do at the moment it touched finance, HR, or customer data.",
      build_stack_hint: "Traditional engineering",
    },
    {
      stage: "smallTeam",
      title: "Human-approval checkpoint engine for tool-calling agents",
      niche: "Human checkpoints",
      summary: "An approval engine that inserts durable human checkpoints before tool-calling agents trigger expensive, risky, or customer-facing actions.",
      build_stack_hint: "Hybrid",
    },
    {
      stage: "smallTeam",
      title: "Cross-agent cost and token ledger for internal AI teams",
      niche: "Agent finops",
      summary: "A shared ledger that attributes token spend, retries, and tool costs across internal agents so teams can see which workflows are quietly getting expensive.",
      build_stack_hint: "Traditional engineering",
    },
    {
      stage: "venture",
      title: "Enterprise agent handoff replay console",
      niche: "Handoff replay",
      summary: "A replay console that reconstructs multi-agent handoffs and tool decisions so platform teams can debug failures after the fact instead of reading raw logs.",
      build_stack_hint: "Traditional engineering",
    },
  ],
  priorAuth: [
    ["smallTeam", "Specialty-clinic denial-reason normalizer", "Denial analytics", "A normalization layer that converts inconsistent payer denial language into a shared taxonomy specialty clinics can actually route and act on."],
    ["smallTeam", "Prior-auth appeal QA workspace", "Appeal workflows", "A pre-submission review workspace that catches missing evidence and weak packets before staff resubmit an appeal."],
    ["smallTeam", "DME order completeness checker", "DME order QA", "An intake checker that flags missing signatures, medical-necessity documents, and form gaps before a DME order leaves the provider."],
    ["smallTeam", "Home-health intake packet gap detector", "Referral completeness", "A referral-intake layer that scores incoming home-health packets for missing forms, missing signatures, and missing payer details."],
    ["domainExpert", "Infusion auth-renewal tracker", "Recurring approvals", "A renewal tracker for infusion centers handling recurring biologics where expiring approvals quietly break schedules and revenue."],
    ["domainExpert", "Payer API conformance test harness", "Payer integration QA", "A conformance harness that helps payers and vendors validate FHIR prior-auth behavior against realistic edge cases before production."],
    ["solo", "Benefit-verification back office for fertility clinics", "Benefit verification", "A recurring verification desk for fertility clinics that need cleaner benefit checks, payer notes, and auth handoffs before expensive cycles begin."],
    ["smallTeam", "Prior-auth status wall for orthopedic surgery schedulers", "Status visibility", "A live status wall for surgery schedulers who need one view of which cases are waiting on auth, peer review, or missing documents."],
    ["domainExpert", "Clinical-document request chaser for specialty referrals", "Document chasing", "A workflow assistant that chases chart notes, imaging, and lab records needed to support specialty prior-auth submissions."],
    ["smallTeam", "Peer-to-peer review prep packet for specialty practices", "Peer review prep", "A prep packet builder that assembles payer criteria, clinical history, and prior denials before physicians jump on peer-to-peer calls."],
    ["domainExpert", "Imaging order medical-necessity checker", "Imaging QA", "A preflight checker that flags missing diagnosis support and payer-specific criteria before advanced imaging orders get denied."],
    {
      stage: "smallTeam",
      title: "Prior-auth callback scheduler for specialty clinics",
      niche: "Callback scheduling",
      summary: "A callback scheduler for specialty clinics that keeps payer follow-ups, hold-time retries, and escalation windows from getting lost between staff members.",
      build_stack_hint: "AI-coded (Claude/Cursor/Codex)",
    },
    {
      stage: "smallTeam",
      title: "Denial-letter parser for imaging centers",
      niche: "Denial parsing",
      summary: "A parser that normalizes payer denial letters for imaging centers so staff can route follow-up work without reading every insurer format from scratch.",
      build_stack_hint: "Traditional engineering",
    },
    {
      stage: "solo",
      title: "Appeal template base for high-volume therapy practices",
      niche: "Appeal templates",
      summary: "A template base for therapy practices that submit the same appeal arguments repeatedly and still rebuild packets from old PDFs and shared drives.",
      model_type: "Productized Service",
    },
    {
      stage: "smallTeam",
      title: "Referral packet completeness check for cardiology groups",
      niche: "Referral completeness",
      summary: "A completeness checker that flags missing referral records, clinical notes, and plan details before cardiology staff start an authorization submission.",
      build_stack_hint: "Hybrid",
    },
    {
      stage: "domainExpert",
      title: "Authorization aging dashboard for infusion pharmacies",
      niche: "Authorization aging",
      summary: "An aging dashboard for infusion pharmacies that need to spot expiring approvals and stalled submissions before treatment schedules or revenue break.",
      build_stack_hint: "Hybrid",
    },
  ],
  accessibility: [
    ["solo", "EU accessibility evidence packs for Shopify merchants", "Merchant accessibility packs", "A fixed-scope evidence and remediation pack for merchants selling into Europe who need a credible accessibility story without a full internal team."],
    ["solo", "VPAT sprint for B2B SaaS companies", "VPAT delivery", "A fast-turn VPAT preparation workflow for B2B SaaS companies trying to survive procurement reviews and accessibility questionnaires."],
    ["solo", "Accessible PDF remediation for insurers and lenders", "Document accessibility", "A remediation service and workflow system for insurers and lenders whose recurring disclosures and statements still fail accessibility requirements."],
    ["smallTeam", "EAA regression monitor for B2B SaaS release teams", "Release QA", "A regression monitor that watches product releases for accessibility slips and turns them into engineering tickets with proof attached."],
    ["smallTeam", "Accessible-document QA API", "Document QA API", "An API that evaluates generated PDFs and customer notices for machine-readable accessibility issues before they are sent downstream."],
    ["domainExpert", "Municipal digital-accessibility procurement checker", "Procurement review", "A procurement-review workflow for municipalities and public contractors buying software, kiosks, and document-heavy services under accessibility obligations."],
    ["solo", "Accessibility statement and remediation tracker for ecommerce brands", "Statement and remediation", "A lightweight tracker for ecommerce brands that need a credible accessibility statement, an issue backlog, and proof that fixes are moving."],
    ["smallTeam", "Procurement accessibility response base for B2B SaaS", "Accessibility questionnaires", "A shared answer base for B2B SaaS teams repeatedly filling out accessibility questionnaires and VPAT follow-up requests."],
    ["domainExpert", "Call-center script accessibility QA for insurers", "Accessible scripts", "A QA layer that reviews call-center and support scripts for accessibility-related gaps that later become complaints or escalations."],
    ["solo", "Accessible lifecycle email review service for product teams", "Email accessibility", "A review service for transactional and lifecycle email flows that still fail basic accessibility checks despite shipping at scale."],
    ["smallTeam", "Design-system contrast regression monitor", "Design system QA", "A monitor that checks design-system tokens and component releases for contrast regressions before they spread across a product."],
  ],
  refrigerantTransition: [
    ["solo", "A2L retrofit photo-audit service for HVAC shops", "Install documentation", "A photo-audit and checklist workflow for HVAC shops that need better documentation and post-install evidence as A2L equipment rolls out."],
    ["solo", "Refrigerant-log backfill service for commercial HVAC contractors", "Record cleanup", "A backfill service that cleans up historical refrigerant logs and asset histories before contractors move into stricter transition-era documentation."],
    ["smallTeam", "A2L parts-compatibility checker for HVAC distributors", "Counter sales tooling", "A compatibility checker that helps distributor counter teams confirm refrigerant class, component fit, and install caveats in real time."],
    ["smallTeam", "Property-manager refrigerant transition reserve planner", "Capital planning", "A planning tool for multi-site property owners trying to prioritize which assets are most exposed to the refrigerant transition."],
    ["domainExpert", "Grocery cold-chain refrigerant conversion PM tool", "Portfolio retrofit management", "A program-management tool for regional grocery operators sequencing refrigerant conversions across dozens of stores."],
    ["venture", "Refrigerant recovery and resale exchange for retrofit contractors", "Recovery marketplace", "An exchange that tracks recovery, testing, and resale of refrigerant pulled from retrofit projects rather than leaving it as waste or chaos."],
    ["solo", "A2L permit packet prep for residential contractors", "Permit documentation", "A prep service that assembles the install documents, equipment details, and code notes contractors need for A2L-related permit submissions."],
    ["smallTeam", "Truck stock and tool readiness tracker for A2L crews", "Fleet readiness", "A readiness tracker for HVAC fleets that need to know which trucks, tools, and crew kits are actually ready for A2L jobs."],
    ["domainExpert", "Inspector code-variance evidence pack for distributors", "Inspection support", "An evidence pack that helps distributors and contractors answer inspector questions when local interpretations of A2L rules diverge."],
    ["smallTeam", "A2L training-proof wallet for field techs", "Training records", "A portable training wallet that keeps A2L certifications, toolbox talks, and refresher proof tied to the right technicians."],
    ["domainExpert", "Retrofit tenant-notice coordinator for property groups", "Tenant coordination", "A coordination layer for property groups that must notify tenants, sequence access, and document refrigerant-related retrofit work across occupied sites."],
  ],
  leadLine: [
    ["solo", "Lead-line homeowner outreach concierge for engineering firms", "Resident outreach", "A resident outreach and paperwork workflow for engineering firms running municipal lead-line replacement programs."],
    ["solo", "Water-utility public inventory publishing service", "Public inventory UX", "A public-facing publishing layer that turns ugly utility spreadsheets into resident-friendly lead-line inventories and notice pages."],
    ["smallTeam", "Lead-line private-side scheduling portal", "Scheduling", "A scheduling portal that coordinates homeowners, plumbers, utility crews, and inspectors around one lead-line replacement event."],
    ["smallTeam", "Replacement-contractor capacity board for municipal lead programs", "Capacity management", "A contractor-capacity board that shows which approved replacement crews still have room and where programs are stalled."],
    ["domainExpert", "Multi-site lead-replacement equity planner", "Program prioritization", "A planning tool for cities trying to prioritize replacements by risk, readiness, and response rates instead of pipe age alone."],
    ["venture", "Lead-line financing marketplace with municipal escrow", "Financing workflows", "A financing and escrow layer that connects residents, contractors, and municipal programs on the private-side replacement problem."],
  ],
  dairyBiosecurity: [
    ["solo", "Dairy biosecurity SOP builder for regional vet groups", "Biosecurity procedures", "A standardized SOP builder for veterinary groups and dairy networks trying to operationalize H5N1-era biosecurity practices across farms."],
    ["solo", "Milk-sample chain-of-custody setup for processors", "Sample handling", "A forms-and-operations workflow for processors that need cleaner chain-of-custody around milk testing and exception handling."],
    ["smallTeam", "Dairy visitor and vehicle biosecurity log app", "Farm logging", "A mobile-first logbook for farms to record visitors, vehicles, and sanitation checks in a way that survives audits and outbreaks."],
    ["smallTeam", "Bulk-milk pickup exception tracker", "Pickup exceptions", "An operations tool that tracks missed pickups, positive-sample escalations, and chain-of-custody breaks for regional dairy operators."],
    ["domainExpert", "Dairy interstate-movement testing scheduler", "Movement compliance", "A scheduler that coordinates the recurring testing and documentation needed when dairy cattle move across state lines."],
    ["domainExpert", "Dairy processor positive-sample escalation dashboard", "Escalation management", "A dashboard for processors and regulators to coordinate the downstream actions that follow positive milk or herd signals."],
  ],
  apprenticeship: [
    ["solo", "Registered Apprenticeship sponsor application service for school districts", "Sponsor launch", "A done-for-you sponsor application workflow for school districts entering apprenticeship structures for the first time."],
    ["solo", "Apprenticeship launch kit for small manufacturers", "Employer launch", "A launch kit for manufacturers who want apprenticeship programs but do not want to navigate sponsor paperwork from scratch."],
    ["smallTeam", "Apprenticeship supervisor text check-in app", "Field supervision", "A text-first check-in tool that helps supervisors confirm OJT progress and milestones without logging into a portal every day."],
    ["smallTeam", "OJT hour anomaly detector", "Hours QA", "A detector that flags missing, suspicious, or inconsistent on-the-job training hour logs before reporting deadlines arrive."],
    ["domainExpert", "Apprenticeship completion-risk dashboard", "Retention analytics", "A dashboard for intermediaries and sponsors to see which cohorts, employers, or programs are drifting toward non-completion."],
    ["domainExpert", "K-12 apprenticeship intermediary OS", "Intermediary operations", "A lightweight operating system for K-12 apprenticeship intermediaries managing employers, placements, paperwork, and compliance proof."],
  ],
  foodTraceability: [
    ["solo", "Food-traceability record-mapping sprint for berry, greens, and cheese brands", "Traceability mapping", "A productized sprint that maps how a traceability-covered brand currently stores key data elements and where its retrieval gaps still are."],
    ["solo", "Supplier document chase desk for food hubs", "Supplier coordination", "An outsourced workflow desk that keeps supplier certifications, lot-code rules, and key traceability contacts current."],
    ["smallTeam", "Food-traceability 24-hour retrieval layer", "Record retrieval", "A retrieval layer that assembles the right lot, supplier, and receiving records within the 24-hour response window buyers fear most."],
    ["smallTeam", "Supplier onboarding CRM for traceability-covered brands", "Supplier onboarding", "A CRM built around collecting traceability contacts, lot-code formats, and readiness status across fragmented supplier networks."],
    ["domainExpert", "Recall drill simulator for mid-market food brands", "Recall readiness", "A simulator that runs traceability and recall drills so brands can see where their record, contact, and lot-link failures still exist."],
    ["domainExpert", "Produce grower lot-code translation layer", "Code normalization", "A translation layer that normalizes lot-code conventions across growers, packers, and buyers during traceability events."],
    ["solo", "FSMA 204 spreadsheet rescue for specialty distributors", "Spreadsheet rescue", "A spreadsheet rescue service for specialty distributors whose traceability records still live in mismatched exports and ad hoc tabs."],
    ["smallTeam", "Lot-code intake translator for foodservice distributors", "Lot-code translation", "A translator that standardizes supplier lot-code formats before they break downstream receiving, retrieval, and recall workflows."],
    ["domainExpert", "Critical Tracking Event exception inbox", "Exception handling", "An inbox built around CTE/KDE exceptions so teams can resolve missing fields and bad partner data before an audit or recall exposes it."],
    ["smallTeam", "Buyer traceability questionnaire response base", "Buyer questionnaires", "A response base for brands and distributors answering the same traceability and recall-readiness questionnaires from retail buyers."],
    ["solo", "Retailer traceability readiness prep for emerging brands", "Retail readiness", "A prep service for emerging food brands that need to clean up records and partner data before a major retailer asks for traceability proof."],
    {
      stage: "smallTeam",
      title: "Lot-photo capture app for warehouse receivers",
      niche: "Receiving capture",
      summary: "A capture app that lets warehouse receivers snap lot labels and reconcile them to inbound records before someone has to decode bad handwriting during a recall.",
      build_stack_hint: "AI-coded (Claude/Cursor/Codex)",
    },
    {
      stage: "smallTeam",
      title: "Supplier KDE missing-field notifier",
      niche: "Missing KDE alerts",
      summary: "A notifier that tells suppliers exactly which KDE fields or lot references are missing before their records break a downstream traceability request.",
      build_stack_hint: "Traditional engineering",
    },
    {
      stage: "solo",
      title: "Recall drill evidence pack for regional food brands",
      niche: "Recall drill packs",
      summary: "An evidence pack service for regional food brands that want one repeatable way to run recall drills and show buyers what was actually tested.",
      model_type: "Productized Service",
    },
    {
      stage: "solo",
      title: "Receiving log cleanup desk for specialty importers",
      niche: "Receiving cleanup",
      summary: "A cleanup desk for specialty importers whose receiving logs, lot links, and supplier contact sheets are too messy to trust during a traceability event.",
      model_type: "Productized Service",
    },
    {
      stage: "domainExpert",
      title: "Retail buyer traceability timeline tracker",
      niche: "Buyer timeline tracking",
      summary: "A tracker for brands and distributors that need to answer retailer traceability deadlines, action items, and document requests without losing the chain of accountability.",
      build_stack_hint: "Hybrid",
    },
  ],
  droneCompliance: [
    ["solo", "Part 107 waiver packet service for inspection firms", "Waiver preparation", "A waiver packet service for drone inspection firms that need repeatable documentation for operations outside basic Part 107 limits."],
    ["solo", "Drone compliance back office for utility vegetation contractors", "Compliance admin", "A recurring admin workflow for utility vegetation contractors managing aircraft records, pilots, waivers, and policy documentation."],
    ["smallTeam", "Remote ID registry for local drone-service fleets", "Remote ID operations", "A registry and renewal tool for small commercial fleets that need to track aircraft, modules, and Remote ID compliance status."],
    ["smallTeam", "Drone waiver evidence locker", "Evidence management", "A locker that stores approvals, maps, mitigation plans, and prior mission evidence so operators can reuse strong submissions."],
    ["domainExpert", "Agricultural spray compliance logbook", "Ag operations compliance", "A logbook tuned for operators balancing drone rules, chemical records, and state or crop-specific requirements."],
    ["domainExpert", "Utility drone storm-response workpack generator", "Storm response", "A generator for pre-approved mission packets, assignments, and evidence sets used by utilities and contractors during storm response."],
    ["solo", "TRUST-to-Part 107 upgrade desk for local operators", "Pilot qualification", "A service that helps hobbyist drone operators stepping into paid work assemble the documents, study workflow, and operating basics needed for Part 107."],
    ["smallTeam", "Drone battery and maintenance log for inspection fleets", "Maintenance records", "A maintenance log that keeps battery cycles, repairs, firmware, and aircraft readiness tied together for small inspection fleets."],
    ["smallTeam", "Mission risk packet builder for roof and solar inspection crews", "Mission prep", "A packet builder that assembles airspace notes, site hazards, client contacts, and mission mitigations before commercial inspection flights."],
    ["solo", "Controlled-airspace request concierge for real-estate media shops", "Airspace authorizations", "A concierge service for small media operators who keep hitting controlled-airspace friction when trying to book paid shoots."],
    ["domainExpert", "Drone subcontractor credential wallet for utilities", "Subcontractor credentials", "A credential wallet that utility drone primes can use to verify insurance, pilot certs, and aircraft records across subcontractors."],
    {
      stage: "solo",
      title: "LAANC mission logbook for local inspection operators",
      niche: "LAANC logs",
      summary: "A mission logbook that ties LAANC approvals, site notes, and actual flight execution together for local inspection operators who need cleaner compliance records later.",
      model_type: "Productized Service",
    },
    {
      stage: "solo",
      title: "Drone insurance renewal wallet for subcontractors",
      niche: "Insurance renewals",
      summary: "A renewal wallet for subcontractor drone operators who keep resending the same insurance proofs and policy updates to primes and utilities.",
      model_type: "Productized Service",
    },
    {
      stage: "smallTeam",
      title: "Flight-permission packet builder for utility contractors",
      niche: "Permission packets",
      summary: "A packet builder for utility drone contractors that assembles site contacts, airspace notes, client approvals, and hazard summaries before field missions.",
      build_stack_hint: "AI-coded (Claude/Cursor/Codex)",
    },
    {
      stage: "smallTeam",
      title: "FAA record locker for multi-pilot drone shops",
      niche: "FAA recordkeeping",
      summary: "A record locker for multi-pilot drone shops that need one place for aircraft details, pilot certificates, waivers, incidents, and maintenance proof.",
      build_stack_hint: "Traditional engineering",
    },
    {
      stage: "domainExpert",
      title: "Recurrent training tracker for inspection fleets",
      niche: "Recurrent training",
      summary: "A tracker for inspection fleets that need to document recurrent training, SOP changes, and pilot sign-offs before customers or primes ask for proof.",
      build_stack_hint: "Hybrid",
    },
  ],
  gridInterconnection: [
    ["domainExpert", "Data-center interconnection document room", "Interconnection documentation", "A controlled document room for developers managing utility studies, queue paperwork, land, and power-delivery negotiations."],
    ["domainExpert", "Generator co-location diligence tracker for large-load developers", "Co-location diligence", "A tracker for the technical, tariff, and counterparty diligence around co-locating large loads with generation assets."],
    ["venture", "Brownfield data-center site aggregator with utility-readiness data", "Site aggregation", "A data product that packages substations, land status, water, and local utility-readiness signals for AI and inference site selection."],
    ["venture", "Behind-the-meter flexibility platform for secondary data centers", "Load flexibility", "A platform that helps smaller data-center operators use flexible load, backup generation, and market participation to lower grid dependence."],
    ["domainExpert", "Demand-response enrollment ops for C&I aggregators", "Enrollment operations", "An operating system for commercial aggregators that need to move sites through meter, contract, and readiness steps faster."],
    ["venture", "Large-load interconnection brokerage for industrial parks", "Brokerage", "A brokerage layer that helps industrial parks package load flexibility, generation, and queue strategy for power-hungry tenants."],
  ],
  freightTransparency: [
    ["solo", "Freight detention and TONU evidence assembly for small carriers", "Dispute evidence", "An evidence-assembly workflow that helps small carriers prove detention, TONU, and accessorial claims with cleaner documentation."],
    ["solo", "Broker-transparency request prep for small fleets", "Transparency requests", "A workflow that prepares and tracks broker transaction-record requests for fleets that lack a dedicated back office."],
    ["smallTeam", "Carrier onboarding reuse vault across freight brokers", "Onboarding reuse", "A reuse vault that lets carriers maintain one verified packet and push it to multiple brokers instead of rekeying the same data."],
    ["smallTeam", "Load-exception inbox for small importers", "Exception management", "A unified inbox for small importers handling ETA changes, customs holds, appointment shifts, and last-mile exceptions."],
    ["smallTeam", "Last-mile freight visibility for small importers", "Visibility", "A visibility layer for importers shipping too little to buy enterprise freight software but too much to manage from phone calls and spreadsheets."],
    ["domainExpert", "Margin and dispute analytics for owner-operator fleets", "Margin analytics", "A dashboard that ties broker opacity, accessorial disputes, and load-level margin erosion together for owner-operator fleets."],
    ["solo", "Rate-confirmation clause checker for owner-operators", "Contract review", "A clause checker that flags risky rate-confirmation language before an owner-operator accepts a load with expensive hidden terms."],
    ["smallTeam", "Broker onboarding fraud document pack for small carriers", "Fraud and onboarding", "A reusable document pack for carriers trying to survive strict broker onboarding without resending the same proofs every week."],
    ["domainExpert", "Lumper and accessorial recovery tracker for produce fleets", "Accessorial recovery", "A tracker that keeps lumper, detention, and other accessorial disputes from disappearing after the load is delivered."],
    ["smallTeam", "Appointment-change audit trail for drayage carriers", "Appointment disputes", "An audit trail for drayage carriers dealing with shifting appointments, gate holds, and finger-pointing over who caused delay."],
    ["solo", "Broker scorecard built from payouts and disputes", "Broker scorecards", "A scorecard system that lets small carriers rank brokers by payout behavior, dispute frequency, and accessorial friction."],
    {
      stage: "smallTeam",
      title: "Carrier packet autofill for repeat broker onboarding",
      niche: "Onboarding autofill",
      summary: "An autofill workflow that keeps small carriers from re-entering the same insurance, authority, and payment details every time a broker asks for onboarding again.",
      build_stack_hint: "AI-coded (Claude/Cursor/Codex)",
    },
    {
      stage: "solo",
      title: "Detention proof app for solo owner-operators",
      niche: "Detention proof",
      summary: "A simple proof app for solo owner-operators that timestamps arrival, delay, and release events so detention claims survive past the delivery.",
      model_type: "Productized Service",
    },
    {
      stage: "solo",
      title: "Signed POD and lumper chase desk for produce fleets",
      niche: "POD and lumper chasing",
      summary: "A chase desk for produce fleets that are constantly missing signed PODs, lumper receipts, and backup needed to invoice cleanly.",
      model_type: "Productized Service",
    },
    {
      stage: "smallTeam",
      title: "Broker contract exception classifier for small carriers",
      niche: "Contract exception review",
      summary: "A classifier that spots unusual broker contract clauses, payment exceptions, and dispute triggers before a small carrier signs away margin.",
      build_stack_hint: "Traditional engineering",
    },
    {
      stage: "domainExpert",
      title: "Spot-quote margin audit board for tiny fleets",
      niche: "Margin audit boards",
      summary: "An audit board that shows where spot-quote assumptions, accessorial misses, and delayed paperwork are eroding margin for tiny fleets load by load.",
      build_stack_hint: "Hybrid",
    },
  ],
  constructionSafety: [
    ["solo", "OSHA inspection document vault setup for specialty subcontractors", "Inspection readiness", "A document vault and operating checklist for specialty subcontractors that need their inspection materials organized before OSHA arrives."],
    ["solo", "Subcontractor training-proof concierge for mid-size GCs", "Training proof collection", "A concierge workflow that collects, verifies, and maintains training proof from the long tail of subs on a general contractor’s jobs."],
    ["smallTeam", "Walkaround inspection prep app for small GCs", "Walkaround prep", "An app that centralizes contacts, checklists, site maps, and representative designations for general contractors on inspection day."],
    ["smallTeam", "Near-miss voice-note triage for field crews", "Incident capture", "A voice-to-workflow tool that turns rough field notes into categorized near misses and follow-up tasks."],
    ["smallTeam", "Subcontractor credential wallet for construction subs", "Credential sharing", "A reusable credential wallet that small subs can send from job to job for insurance, training, and compliance proof."],
    ["domainExpert", "Construction-insurer underwriting data pack for specialty trades", "Insurance underwriting", "A data pack that helps specialty trade contractors present cleaner safety, workforce, and near-miss data during underwriting and renewal."],
    ["solo", "Toolbox talk evidence capture for small subcontractors", "Toolbox talks", "An evidence capture app for small subs that still run toolbox talks on paper and struggle to produce proof later."],
    ["smallTeam", "Safety-meeting attendance wallet across jobsites", "Attendance records", "A portable attendance wallet that follows workers across jobsites so crews stop losing safety-meeting proof in site-specific binders."],
    ["smallTeam", "Corrective-action tracker after near-miss reports", "Corrective actions", "A tracker that assigns, follows up, and closes corrective actions so near-miss reports do more than create paperwork."],
    ["domainExpert", "Equipment inspection log for rental-heavy crews", "Equipment inspections", "An inspection log built for crews that rotate rented lifts, loaders, and other gear across jobs without consistent records."],
    ["solo", "Subcontractor JHA review desk for specialty trades", "JHA review", "A review desk for specialty trade contractors who need cleaner job hazard analyses before stepping onto larger GC sites."],
    {
      stage: "solo",
      title: "Tailgate safety note transcriber for field foremen",
      niche: "Tailgate notes",
      summary: "A transcriber that turns rough tailgate and toolbox notes into searchable records so field foremen are not rewriting paper scribbles after the shift.",
      build_stack_hint: "AI-coded (Claude/Cursor/Codex)",
    },
    {
      stage: "smallTeam",
      title: "Subcontractor orientation proof wallet for small GCs",
      niche: "Orientation proof",
      summary: "A proof wallet for small GCs that need orientation sign-offs, site rules, and worker acknowledgements available before subs walk onto the jobsite.",
      build_stack_hint: "AI-coded (Claude/Cursor/Codex)",
    },
    {
      stage: "smallTeam",
      title: "Lift inspection reminder board for concrete crews",
      niche: "Lift inspections",
      summary: "A reminder board for concrete crews rotating lifts between jobsites and struggling to keep inspection proof attached to the right machine and date.",
      build_stack_hint: "Traditional engineering",
    },
    {
      stage: "solo",
      title: "Near-miss follow-up pack for safety coordinators",
      niche: "Near-miss follow-up",
      summary: "A follow-up pack that helps safety coordinators turn a near miss into assigned actions, closeout proof, and a reusable lesson for the next site meeting.",
      model_type: "Productized Service",
    },
    {
      stage: "domainExpert",
      title: "Foreman corrective-action closeout tracker",
      niche: "Corrective-action closeout",
      summary: "A closeout tracker for foremen and safety leads who need to prove that corrective actions were assigned, completed, and communicated back to the field.",
      build_stack_hint: "Hybrid",
    },
  ],
  shiftWork: [
    ["venture", "Multi-app schedule control for hourly workers", "Worker scheduling", "A worker-side scheduling app that unifies shifts, swaps, and availability across the multiple employer apps hourly workers already juggle."],
    ["smallTeam", "Shift-premium calculator for fair-workweek chains", "Premium-pay compliance", "A calculator and audit trail for multi-location chains that owe premium pay when managers edit schedules too late."],
    ["smallTeam", "Access-to-hours board for fast-food operators", "Hours allocation", "A board that helps operators offer new hours to current workers first and keep proof that they followed the rule."],
    ["smallTeam", "Clopening risk monitor for franchise groups", "Clopening compliance", "A monitor that flags risky close-open combinations and missing consent before schedules are posted."],
    ["smallTeam", "Worker-side schedule wallet across multiple employers", "Worker tooling", "A schedule wallet that gives hourly workers one place to track commitments, availability, and shift conflicts across multiple jobs."],
    ["domainExpert", "Fair-workweek evidence vault for large restaurant operators", "Employer evidence", "An evidence vault that stores notices, schedule versions, consent records, and premium-pay proof for restaurant operators under fair-workweek rules."],
    ["solo", "Availability-intake portal for independent restaurant groups", "Availability intake", "A portal that keeps employee availability changes out of text threads and turns them into something operators can actually schedule against."],
    ["smallTeam", "Text-to-schedule reconciliation layer for restaurants", "Schedule reconciliation", "A reconciliation layer that tracks schedule changes happening over text and pushes the final state back into the official schedule."],
    ["smallTeam", "Shift-swap approval log for franchise operators", "Swap approvals", "A log that records who requested, approved, and worked each swap so operators can defend the final schedule later."],
    ["domainExpert", "Predictable-scheduling audit pack for regional operators", "Audit prep", "An audit pack that assembles notice periods, premium-pay events, and consent records for operators facing labor scrutiny."],
    ["smallTeam", "Cross-location hours marketplace for hourly chains", "Hours marketplace", "A marketplace that lets workers pick up compliant open shifts across nearby locations while preserving access-to-hours proof for the operator."],
    {
      stage: "smallTeam",
      title: "Call-out replacement board for independent restaurants",
      niche: "Call-out replacements",
      summary: "A replacement board that helps independent restaurants fill same-day call-outs without losing the record of who was offered the shift and who accepted it.",
      build_stack_hint: "AI-coded (Claude/Cursor/Codex)",
    },
    {
      stage: "smallTeam",
      title: "Hourly-worker availability wallet across two jobs",
      niche: "Worker availability",
      summary: "An availability wallet for hourly workers juggling two jobs who need one reliable place to keep shift commitments from colliding.",
      build_stack_hint: "Traditional engineering",
    },
    {
      stage: "smallTeam",
      title: "Break-rule risk checker for cafe operators",
      niche: "Break-rule checks",
      summary: "A risk checker that flags break-rule and late-change problems before a cafe manager publishes a schedule that creates premium-pay exposure.",
      build_stack_hint: "Traditional engineering",
    },
    {
      stage: "solo",
      title: "Schedule change premium-pay explainer for workers",
      niche: "Premium-pay explainers",
      summary: "A worker-facing explainer that shows when a schedule change should trigger premium pay and helps hourly staff keep their own proof.",
      model_type: "Productized Service",
    },
    {
      stage: "venture",
      title: "Store-to-store shift marketplace for franchise groups",
      niche: "Franchise shift marketplace",
      summary: "A marketplace that lets franchise groups move workers between stores while preserving compliance, approval trails, and worker eligibility rules.",
      model_type: "Marketplace",
      build_stack_hint: "Traditional engineering",
    },
  ],
  openSourceMaintainers: [
    {
      stage: "practice",
      title: "Issue duplicate explainer for solo maintainers",
      niche: "Issue triage",
      summary: "A GitHub helper that compares new issues against old ones and drafts a polite duplicate explanation with the most relevant prior links attached.",
      build_stack_hint: "Traditional engineering",
    },
    ["practice", "Release note drafter from merged pull requests", "Release notes", "A small app that turns merged pull requests and labels into a first-pass changelog maintainers can edit instead of writing release notes from scratch."],
    ["practice", "Contributor onboarding quest board for first PRs", "Contributor onboarding", "A guided board that turns first-time contributor docs into a checklist with repo-specific context, setup steps, and links back to starter issues."],
    ["practice", "Stale issue reply composer with repo context", "Stale issue handling", "A triage tool that drafts maintainers a short, context-aware reply for stale issues instead of forcing them to write the same status request over and over."],
    {
      stage: "practice",
      title: "Good-first-issue matcher for open-source newcomers",
      niche: "Issue matching",
      summary: "A matcher that recommends beginner-friendly issues to new contributors based on language, setup friction, and prior repo activity.",
      build_stack_hint: "Traditional engineering",
    },
    ["practice", "Support inbox for GitHub Issues and Discussions", "Support triage", "A unified inbox that groups repeated support questions across Issues and Discussions so maintainers can answer once and reuse the answer later."],
    {
      stage: "practice",
      title: "AI-slop PR preflight checker for maintainers",
      niche: "PR quality gates",
      summary: "A preflight checker that flags suspiciously broad or low-context pull requests before maintainers sink review time into them.",
      build_stack_hint: "Traditional engineering",
    },
    ["practice", "Issue-form completeness scorer", "Issue forms", "A small validator that scores whether a bug report actually contains logs, repro steps, version details, and other fields maintainers keep having to ask for."],
    ["practice", "Sponsor update digest for open-source projects", "Sponsor communication", "A digest builder that summarizes notable releases, bugs fixed, and roadmap items so maintainers can send sponsor updates without assembling them manually."],
    ["practice", "Maintainer handoff notes pack", "Maintainer handoffs", "A handoff pack that bundles open incidents, fragile setup steps, and unwritten context when a project gains a new co-maintainer."],
  ],
  jobSearchOps: [
    ["practice", "Job application inbox organizer from confirmation emails", "Application tracking", "A personal dashboard that reads job-application confirmation emails and turns them into a clean timeline instead of a messy folder in Gmail."],
    ["practice", "Resume-tailoring diff viewer", "Resume tailoring", "A diff viewer that shows exactly how a tailored resume changed against your base resume so you stop losing track of which version said what."],
    ["practice", "Recruiter follow-up scheduler for ghosted applications", "Follow-up reminders", "A scheduler that tells job seekers when to follow up and drafts a short message from the original application thread details."],
    ["practice", "Interview research brief from a job description and company site", "Interview prep", "A brief generator that turns a saved job description and company URLs into a fast interview-prep sheet with likely themes and questions to research."],
    ["practice", "Portfolio bullet storyteller from past project notes", "Portfolio storytelling", "A storyteller that converts rough project notes into stronger portfolio bullets, impact statements, and talking points for interviews."],
    {
      stage: "practice",
      title: "ATS keyword gap checker for saved job posts",
      niche: "ATS prep",
      summary: "A checker that compares your resume against a saved job post and highlights missing skills or phrasing before you submit another application into the void.",
      build_stack_hint: "Traditional engineering",
    },
    ["practice", "Salary evidence notebook from saved job listings", "Salary tracking", "A notebook that saves salary ranges, titles, and level clues from job posts so you stop guessing what is normal across similar roles."],
    ["practice", "Networking CRM for coffee chats and referrals", "Networking follow-up", "A lightweight CRM that tracks who you talked to, what they said, and when you should follow up before warm leads go cold."],
    ["practice", "Post-application status timeline for job seekers", "Status tracking", "A clean timeline that shows where each application stands, which recruiter thread belongs to it, and what is still waiting on your action."],
    ["practice", "Interview question replay coach from your own notes", "Interview reflection", "A reflection tool that turns your raw interview notes into a personal question bank, weak-spot tracker, and practice prompts for the next round."],
  ],
  researchWorkflow: [
    ["practice", "Unread-paper queue planner for Zotero libraries", "Reading queue", "A planner that surfaces which unread papers are actually worth reading next based on tags, recency, and your current project focus."],
    ["practice", "Annotation-to-literature-note combiner", "Annotation synthesis", "A combiner that turns scattered PDF highlights into one usable note with themes, quotes, and citations still attached."],
    ["practice", "Related-work comparison matrix from tagged PDFs", "Paper comparison", "A matrix builder that compares papers by method, dataset, findings, and limitations without forcing researchers to maintain giant spreadsheets by hand."],
    ["practice", "Weekly lab reading recap generator", "Reading recaps", "A recap generator that summarizes what a lab group read that week and outputs discussion prompts before the meeting starts."],
    {
      stage: "practice",
      title: "Citation context finder across research notes",
      niche: "Citation lookup",
      summary: "A note-search tool that finds where you wrote about a paper, why you saved it, and which project it mattered to before you cite it again out of context.",
      build_stack_hint: "Traditional engineering",
    },
    ["practice", "Meeting prep brief from papers and advisor notes", "Meeting prep", "A prep brief that bundles unread papers, open questions, and last-meeting notes into something a student can review ten minutes before talking to their advisor."],
    ["practice", "Methods extraction table for small systematic reviews", "Methods extraction", "A table builder that extracts study methods, sample details, and measures into a structured grid for small review projects."],
    ["practice", "Figure explainer notebook for journal clubs", "Figure understanding", "A notebook that lets users annotate confusing figures, store explanations, and keep the interpretation attached to the original paper."],
    ["practice", "Paper scorecard for journal club voting", "Paper prioritization", "A scorecard that helps research groups rank which papers are worth discussing based on novelty, clarity, and relevance to the group."],
    ["practice", "Reviewer-response evidence retriever", "Revision support", "A retriever that helps authors find the exact note, quote, or experiment reference they need when responding to reviewer comments later."],
  ],
  teacherAdmin: [
    ["practice", "Parent email drafter from missing-work context", "Parent communication", "A teacher helper that drafts a parent email from missing assignments, rubric notes, and previous contact history without making the teacher start cold."],
    ["practice", "Rubric feedback comment bank tied to standards", "Rubric comments", "A comment bank that stores teacher-approved feedback snippets and maps them to rubric criteria and standards."],
    ["practice", "Progress report generator for missing and late work", "Progress reports", "A progress-report tool that pulls together missing work, current grade trends, and a few teacher notes into something sendable."],
    ["practice", "IEP accommodation reminder sheet for daily planning", "Accommodation reminders", "A planning view that shows a teacher the accommodations they need to remember for the next class without digging through separate documents."],
    ["practice", "Small-group rotation planner from roster notes", "Group planning", "A planner that suggests small-group rotations based on teacher notes, recent absences, and current support priorities."],
    ["practice", "Substitute lesson packet builder from classroom docs", "Sub plans", "A packet builder that assembles lesson steps, seating notes, and emergency context into a sub plan from files teachers already have."],
    ["practice", "Grading backlog planner by class and prep", "Grading planning", "A backlog planner that helps teachers see which class stack is becoming unmanageable and what can realistically be finished before the next deadline."],
    ["practice", "Behavior log summarizer for parent conferences", "Behavior summaries", "A summarizer that turns scattered behavior notes into a clear timeline before a parent or administrator meeting."],
    ["practice", "Assignment regrade request tracker", "Regrade requests", "A tracker that logs student regrade requests, the teacher response, and the final outcome so the same disputes do not keep restarting."],
    ["practice", "Reading-level quiz rewriter for classroom differentiation", "Differentiated materials", "A tool that rewrites quiz prompts or reading checks into simpler or more supported language while preserving the underlying standard."],
  ],
  freelancerBackOffice: [
    ["practice", "Scope change detector from client email threads", "Scope control", "A client-thread analyzer that flags when a request sounds outside scope before a freelancer quietly eats extra work."],
    ["practice", "Invoice follow-up scheduler for freelancers", "Invoice chasing", "A scheduler that watches invoice due dates and drafts escalating reminders so freelancers stop manually remembering who still owes money."],
    ["practice", "Discovery-call notes to proposal draft converter", "Proposal drafting", "A converter that turns messy discovery-call notes into a first proposal outline with scope, assumptions, and next steps."],
    ["practice", "Client onboarding packet builder from signed proposals", "Client onboarding", "A packet builder that turns a signed proposal into kickoff questions, asset requests, and timeline expectations without retyping everything."],
    ["practice", "Revision round tracker for creative freelancers", "Revision tracking", "A tracker that records what changed in each revision round so clients cannot keep relabeling new work as a minor tweak."],
    ["practice", "Monthly retainer summary generator", "Retainer reporting", "A generator that turns time logs, deliverables, and thread highlights into a clean monthly summary for retainer clients."],
    ["practice", "Freelancer contract clause explainer", "Contract review", "A clause explainer that highlights risky payment, revision, and scope terms in plain English before a freelancer signs."],
    ["practice", "Client asset request portal for solo freelancers", "Asset collection", "A tiny portal that collects logos, copy, credentials, and approvals so freelancers stop chasing the same files over email."],
    ["practice", "Testimonial chase reminder board", "Testimonials", "A reminder board that tells freelancers when a project is fresh enough to ask for a testimonial and gives them the right context to include."],
    ["practice", "Late-payment risk board from invoice history", "Payment risk", "A board that shows which clients regularly pay late and which invoices are following the same pattern again."],
  ],
};

function slugify(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function gapFor(summary: string) {
  return `${summary} Today the workflow usually lives in spreadsheets, shared drives, inboxes, and tribal knowledge rather than purpose-built software. That creates missed deadlines, weak audit trails, and manual follow-up work that is expensive enough for a narrow founder wedge to matter.`;
}

function playFor(stage: ResearchStage, modelType: Opportunity["model_type"]) {
  if (stage === "practice") {
    const packaging =
      modelType === "API / Usage-Based"
        ? "Pick one narrow input and one useful output, and let the API integration do most of the teaching."
        : modelType === "Productized Service"
          ? "Make the workflow feel complete end to end, even if some of the work still happens behind the scenes."
          : "Treat the first version like a polished utility rather than a platform and solve one repetitive workflow all the way through.";

    return `${packaging} Build it with one or two real integrations, a small amount of authentic sample data, and a result users can export, share, or act on immediately.`;
  }

  const packaging =
    modelType === "Productized Service"
      ? "Package the work first as a repeatable service with a clear deliverable and only productize the steps that repeat every week."
      : modelType === "API / Usage-Based"
        ? "Make the first wedge a small, opinionated API or developer workflow that plugs into an existing system instead of trying to replace it."
        : modelType === "Marketplace"
          ? "Win on supply or trust first, then turn the repeating transaction into software rather than starting with an empty marketplace."
          : "Own the narrow evidence, queue, or coordination layer where existing systems are weakest instead of pretending to be a full suite on day one.";

  const launch =
    stage === "venture"
      ? "The initial product should prove one high-value deployment or contract path before broadening into a platform."
      : "The product should land with design partners quickly and expand only after the first workflow is used every week.";

  return `${packaging} ${launch}`;
}

function buildPathFor(stage: ResearchStage) {
  if (stage === "practice") {
    return "Start with a workflow you can simulate yourself in a day: import a real document, email, PDF, or issue thread; transform it with one reliable AI step; and export the result in a form a user would actually keep. Use AI coding tools to scaffold auth, parsing, and UI, but force yourself to make one polished loop feel trustworthy before adding features.";
  }
  if (stage === "solo") {
    return "Start with one buyer profile and one deliverable. Sell 5 paid engagements manually, turn the recurring checklist into a lightweight portal or dashboard, and use that artifact to decide what deserves software. Ignore adjacent modules until the first service is repeatable without heroics.";
  }
  if (stage === "smallTeam") {
    return "Land 3-5 design partners with the narrowest version of the workflow. Handle edge cases manually behind the scenes, automate only the repeated path, and ship exports or proofs buyers can immediately use. Do not broaden into a full suite until the core job is used weekly.";
  }
  if (stage === "domainExpert") {
    return "Start with two or three domain-expert design partners and one operational surface that carries real compliance or financial pain. Expect some implementation work, but convert every repeated step into product quickly. The first milestone is a workflow teams trust in a live environment.";
  }
  return "Secure one anchor buyer, one deployment path, and one measurable proof point before building breadth. The first release should make a single high-value workflow materially faster, safer, or more auditable. Use that deployment to earn the right to expand into adjacent modules.";
}

function oneLiner(summary: string) {
  return summary.endsWith(".") ? summary : `${summary}.`;
}

const RESEARCH_IDEAS: IdeaSeed[] = Object.entries(IDEAS_BY_THEME).flatMap(([theme, inputs]) =>
  inputs.map((input) =>
    Array.isArray(input)
      ? {
          theme: theme as ThemeKey,
          stage: input[0],
          title: input[1],
          niche: input[2],
          summary: input[3],
          model_type: input[4],
        }
      : {
          theme: theme as ThemeKey,
          ...input,
        },
  ),
);

export const RESEARCH_OPPORTUNITIES: Opportunity[] = RESEARCH_IDEAS.map((idea, index) => {
  const theme = THEMES[idea.theme];
  const stage = STAGE_DEFAULTS[idea.stage];
  const model_type = idea.model_type ?? theme.model_type ?? stage.model_type;
  const practiceDifficulty = idea.stage === "practice" ? inferPracticeDifficulty(idea) : null;
  const difficulty = idea.difficulty ?? practiceDifficulty ?? stage.difficulty;
  const founder_path = idea.founder_path ?? stage.founder_path;
  const starting_capital =
    idea.starting_capital ??
    (idea.stage === "practice" ? inferPracticeStartingCapital(difficulty) : stage.starting_capital);
  const time_to_launch =
    idea.time_to_launch ??
    (idea.stage === "practice" ? inferPracticeLaunchTime(difficulty) : stage.time_to_launch);
  const build_stack_hint =
    idea.build_stack_hint ??
    (idea.stage === "practice"
      ? inferPracticeBuildStack(idea, difficulty)
      : model_type === "Productized Service"
      ? "No-code"
      : model_type === "API / Usage-Based"
        ? "Traditional engineering"
        : stage.build_stack_hint);

  return {
    id: slugify(idea.title),
    slug: slugify(idea.title),
    title: idea.title,
    one_liner: oneLiner(idea.summary),
    the_gap: gapFor(idea.summary),
    the_play: idea.the_play ?? playFor(idea.stage, model_type),
    market_size_summary: theme.market_size_summary,
    timing_rationale: theme.timing_rationale,
    build_path: idea.build_path ?? buildPathFor(idea.stage),
    model_type,
    audience: idea.audience ?? theme.audience,
    industry: theme.industry,
    niche: idea.niche,
    revenue_ceiling: idea.revenue_ceiling ?? theme.revenue_ceiling ?? stage.revenue_ceiling,
    founder_path,
    difficulty,
    starting_capital,
    time_to_launch,
    build_stack_hint,
    moat: idea.moat ?? theme.moat,
    distribution_play: idea.distribution_play ?? theme.distribution_play,
    demand_trend: idea.demand_trend ?? theme.demand_trend,
    featured: false,
    rank: BASE_RANK + index,
    cover_image_url: null,
    yc_rfs_slug: null,
    sources: theme.sources,
    created_at: BASE_DATE,
    updated_at: BASE_DATE,
  };
});

export const PRACTICE_OPPORTUNITY_SLUGS = new Set(
  RESEARCH_IDEAS
    .filter((idea) => PRACTICE_THEME_KEYS.has(idea.theme))
    .map((idea) => slugify(idea.title)),
);

export const PRACTICE_THEME_BY_SLUG = new Map(
  RESEARCH_IDEAS
    .filter((idea) => PRACTICE_THEME_KEYS.has(idea.theme))
    .map((idea) => [slugify(idea.title), idea.theme]),
);

export const PRACTICE_OPPORTUNITIES: Opportunity[] = RESEARCH_OPPORTUNITIES.filter((opp) =>
  PRACTICE_OPPORTUNITY_SLUGS.has(opp.slug),
);
