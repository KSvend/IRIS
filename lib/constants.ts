import type { NarrativeTopic, NarrativeCategory } from "./types";

// Color palette for narrative categories — desaturated for light backgrounds
export const CATEGORY_COLORS: Record<NarrativeCategory, string> = {
  hate_speech: "#C93545",
  violent_extremism: "#8B3A3A",
  rumor_misinfo: "#D4922A",
  peace_counter: "#2E8B57",
  cross_cutting: "#B07D2B",
};

export const CATEGORY_LABELS: Record<NarrativeCategory, string> = {
  hate_speech: "Hate Speech",
  violent_extremism: "Violent Extremism",
  rumor_misinfo: "Rumor & Misinfo",
  peace_counter: "Peace & Counter",
  cross_cutting: "Cross-cutting",
};

export const SEVERITY_COLORS: Record<string, string> = {
  watch: "#D4922A",
  alert: "#E07B39",
  action: "#D05454",
};

// Full narrative topic taxonomy mapped to CSV columns
export const NARRATIVE_TOPICS: NarrativeTopic[] = [
  // Hate Speech - Identity Targeting
  { id: "hs_clan_targeting", label: "Clan Targeting", category: "hate_speech", subcategory: "Identity Targeting", csvColumn: "topic_HS_CLAN_TARGETING", description: "Posts singling out specific clans (e.g. Darood, Hawiye) with hostile rhetoric, blame, or calls for exclusion. Common in Somalia and parts of Kenya." },
  { id: "hs_ethnic_scapegoating", label: "Ethnic Scapegoating", category: "hate_speech", subcategory: "Identity Targeting", csvColumn: "topic_HS_ETHNIC_SCAPEGOATING_JIENGE_CLUSTER", description: "Blaming an ethnic group for political or economic problems. Includes Jienge cluster narratives in South Sudan attributing crises to Dinka or Nuer communities." },
  { id: "hs_anti_foreign", label: "Anti-Foreign", category: "hate_speech", subcategory: "Identity Targeting", csvColumn: "topic_HS_ANTI_FOREIGN", description: "Xenophobic rhetoric targeting refugees, migrants, or foreign nationals. Often spikes around resource competition or labour disputes." },
  { id: "hs_caste_racism", label: "Caste & Racism", category: "hate_speech", subcategory: "Identity Targeting", csvColumn: "topic_HS_CASTE_RACISM", description: "Caste-based discrimination (e.g. Somali minority clans) and racial slurs framing groups as inherently inferior." },
  { id: "hs_clan_hierarchy", label: "Clan Hierarchy", category: "hate_speech", subcategory: "Identity Targeting", csvColumn: "topic_HS_CLAN_HIERARCHY", description: "Claims of clan superiority or inferiority used to justify exclusion from power, land, or services." },

  // Hate Speech - Dehumanization
  { id: "hs_dehumanisation", label: "Dehumanisation", category: "hate_speech", subcategory: "Dehumanization", csvColumn: "topic_HS_DEHUMANISATION_TARGETING", description: "Language comparing targeted groups to animals, insects, or diseases. A key early warning indicator — dehumanisation often precedes violence." },
  { id: "hs_coded_slurs", label: "Coded Slurs", category: "hate_speech", subcategory: "Dehumanization", csvColumn: "topic_coded_slurs_ethnic", description: "Ethnic slurs disguised through coded language, transliterations, or euphemisms to evade platform moderation while targeting specific groups." },
  { id: "hs_identity_incitement", label: "Identity Incitement", category: "hate_speech", subcategory: "Dehumanization", csvColumn: "topic_identity_incitement_dehumanisation", description: "Direct calls to action against identity groups combined with dehumanising framing. High-severity indicator when paired with location cues." },
  { id: "hs_hate_slurs", label: "Hate Slurs", category: "hate_speech", subcategory: "Dehumanization", csvColumn: "topic_hate_slurs_or_coded", description: "Explicit hate slurs and coded variants targeting ethnic, clan, or national identity. Includes regional-specific terminology." },
  { id: "hs_dehumanise_media", label: "Dehumanise Media Trust", category: "hate_speech", subcategory: "Dehumanization", csvColumn: "topic_HS_DEHUMANISE_MEDIA_TRUST", description: "Attacks on journalists and media institutions using dehumanising language, often framing them as traitors or foreign agents to erode public trust." },

  // Hate Speech - Political
  { id: "hs_factional", label: "Factional Attacks", category: "hate_speech", subcategory: "Political", csvColumn: "topic_HS_FACTIONAL_ATTACKS_AND_BETRAYAL", description: "Hateful rhetoric between political factions, framing opponents as betrayers of the nation or community. Common during electoral periods." },
  { id: "hs_delegitimisation", label: "Delegitimisation", category: "hate_speech", subcategory: "Political", csvColumn: "topic_delegitimisation_anti_state", description: "Narratives undermining state institutions, peace processes, or international actors (UN, AU) as illegitimate or corrupt conspirators." },
  { id: "hs_regionalism", label: "Regionalism (Kokora)", category: "hate_speech", subcategory: "Political", csvColumn: "topic_HS_REGIONALISM_KOKORA", description: "South Sudan-specific separatist rhetoric invoking 'Kokora' (1983 expulsion policy), calling for regional division along ethnic lines." },
  { id: "hs_coded_metaphor", label: "Coded Metaphors", category: "hate_speech", subcategory: "Political", csvColumn: "topic_HS_MTN_CODED_METAPHOR_REVIEW", description: "Political hate speech using metaphors, proverbs, or coded language (e.g. 'cut the tall trees') to advocate harm while maintaining deniability." },

  // Hate Speech - Gendered
  { id: "hs_gbov", label: "Gender-Based Violence", category: "hate_speech", subcategory: "Gendered", csvColumn: "topic_HS_GBOV_GENDERED", description: "Posts inciting or normalising gender-based violence, including threats of sexual violence as a weapon of conflict or political intimidation." },
  { id: "hs_sexualised", label: "Sexualised Harm", category: "hate_speech", subcategory: "Gendered", csvColumn: "topic_sexualised_harm_or_humiliation", description: "Sexualised language used to degrade or humiliate individuals based on gender, often targeting women in public life or peace activism." },
  { id: "hs_gendered_hate", label: "Gendered Hate", category: "hate_speech", subcategory: "Gendered", csvColumn: "topic_gendered_hate_or_humiliation", description: "Hate speech specifically targeting individuals based on gender identity, including misogynistic attacks on women leaders or activists." },

  // Hate Speech - Diaspora
  { id: "hs_diaspora_stigma", label: "Diaspora Stigma", category: "hate_speech", subcategory: "Diaspora", csvColumn: "topic_HS_RETURN_DIASPORA_STIGMA", description: "Stigmatisation of returning diaspora communities, framing them as outsiders, spies, or undeserving of land and political rights." },
  { id: "hs_national_identity", label: "Anti-Arab Framing", category: "hate_speech", subcategory: "Diaspora", csvColumn: "topic_HS_NATIONAL_IDENTITY_ANTI_ARAB_FRAMING", description: "Narratives framing Arab-identifying communities as foreign infiltrators, particularly in Somalia and coastal Kenya contexts." },
  { id: "hs_militarisation", label: "Militarisation Stereotype", category: "hate_speech", subcategory: "Diaspora", csvColumn: "topic_HS_MILITARISATION_STEREOTYPE_MATHIANG_ANYOR", description: "Stereotyping ethnic groups as inherently militaristic, referencing formations like Mathiang Anyor to frame communities as threats." },

  // Violent Extremism - Recruitment
  { id: "ve_recruitment", label: "Recruitment & Coercion", category: "violent_extremism", subcategory: "Recruitment", csvColumn: "topic_VE_RECRUITMENT_COERCION", description: "Active recruitment messaging for armed groups, including coercion, promises of belonging, or financial incentives targeting vulnerable youth." },
  { id: "ve_propaganda", label: "Propaganda", category: "violent_extremism", subcategory: "Recruitment", csvColumn: "topic_ve_propaganda_recruitment", description: "Organised propaganda materials glorifying armed groups, their victories, or martyrdom. Often includes professional media production." },
  { id: "ve_hijrah", label: "Hijrah (Migration)", category: "violent_extremism", subcategory: "Recruitment", csvColumn: "topic_ve_recruitment_or_hijrah", description: "Calls to migrate to territories controlled by armed groups, framed as religious obligation (hijrah). Key indicator of recruitment pipelines." },
  { id: "ve_bayah", label: "Bayah (Allegiance)", category: "violent_extremism", subcategory: "Recruitment", csvColumn: "topic_ve_bayah_affiliation", description: "Pledges of allegiance (bayah) to armed group leaders or declarations of affiliation. Indicates formalised extremist commitment." },
  { id: "ve_youth", label: "Youth References", category: "violent_extremism", subcategory: "Recruitment", csvColumn: "topic_VE_CODED_YOUTH_REFERENCES", description: "Coded references to youth involvement in armed groups (e.g. 'al-Shabaab' literally meaning 'the youth'). Tracks recruitment-adjacent language." },
  { id: "ve_group_branding", label: "Group Branding", category: "violent_extremism", subcategory: "Recruitment", csvColumn: "topic_ve_group_branding", description: "Use of armed group names, logos, slogans, or nasheed references as identity markers and recruitment signals." },
  { id: "ve_self_reference", label: "Self-Reference Terms", category: "violent_extremism", subcategory: "Recruitment", csvColumn: "topic_VE_SELF_REFERENCE_TERMS", description: "In-group terminology used by extremist communities (e.g. 'mujahideen', 'brothers') indicating radicalised self-identification." },

  // Violent Extremism - Operations
  { id: "ve_mobilisation", label: "Militia Mobilisation", category: "violent_extremism", subcategory: "Operations", csvColumn: "topic_VE_MILITIA_MOBILISATION", description: "Calls to mobilise armed groups or militias, including assembly instructions, rally points, or coordination signals." },
  { id: "ve_escalation", label: "Operational Escalation", category: "violent_extremism", subcategory: "Operations", csvColumn: "topic_VE_OPERATIONAL_ESCALATION", description: "Signals of escalating operational tempo — increased threat specificity, countdown language, or pre-attack communication patterns." },
  { id: "ve_attack_tactics", label: "Attack Tactics", category: "violent_extremism", subcategory: "Operations", csvColumn: "topic_ve_attack_tactics", description: "Discussion of attack methods, tactical planning, or weapons. Immediate escalation concern when combined with location specifics." },
  { id: "ve_atrocity", label: "Atrocity & Attacks", category: "violent_extremism", subcategory: "Operations", csvColumn: "topic_VE_ATROCITY_AERIAL_AND_ATTACKS", description: "Reporting or glorification of atrocities and attacks, including aerial bombardment narratives used to justify retaliatory violence." },
  { id: "ve_crossborder", label: "Cross-border/Diaspora", category: "violent_extremism", subcategory: "Operations", csvColumn: "topic_ve_crossborder_diaspora", description: "Cross-border movement coordination, diaspora financing of operations, or narratives framing regional conflicts as unified struggle." },

  // Violent Extremism - Ideology
  { id: "ve_religious", label: "Religious Justification", category: "violent_extremism", subcategory: "Ideology", csvColumn: "topic_VE_RELIGIOUS_JUSTIFICATION", description: "Use of religious scripture or theology to justify violence, framing armed action as divine duty or religious obligation." },
  { id: "ve_takfir", label: "Takfir & Dehumanise", category: "violent_extremism", subcategory: "Ideology", csvColumn: "topic_VE_TAKFIR_DEHUMANISE", description: "Declaring Muslims as apostates (takfir) to justify targeting them. Combines religious excommunication with dehumanisation." },
  { id: "ve_religious_takfir", label: "Religious Takfir", category: "violent_extremism", subcategory: "Ideology", csvColumn: "topic_religious_justification_takfir", description: "Broader religious takfir narratives using theological arguments to exclude and target communities deemed insufficiently devout." },
  { id: "ve_arabic_terms", label: "Arabic Peace/War Terms", category: "violent_extremism", subcategory: "Ideology", csvColumn: "topic_VE_ARABIC_PEACE_OR_WAR_TERMS_REVIEW", description: "Arabic terminology (jihad, fitna, dar al-harb) used in ideological framing. Requires context review — some terms have peaceful meanings." },
  { id: "ve_spy_claims", label: "Spy Claims", category: "violent_extremism", subcategory: "Ideology", csvColumn: "topic_VE_SECURITY_DELEGITIMATION_SPY_CLAIMS", description: "Accusations of espionage against community members, journalists, or officials to delegitimise them and justify targeted violence." },

  // Violent Extremism - Financing
  { id: "ve_financing_coord", label: "Financing Coordination", category: "violent_extremism", subcategory: "Financing", csvColumn: "topic_VE_FINANCING_COORDINATION", description: "Coordination of financial support for armed groups, including hawala networks, cryptocurrency, or coded fundraising drives." },
  { id: "ve_financing_req", label: "Financing Requests", category: "violent_extremism", subcategory: "Financing", csvColumn: "topic_RM_FINANCING_REQUESTS", description: "Direct requests for financial contributions to armed groups, often framed as charity (zakat/sadaqah) or community support." },

  // Rumor & Misinfo
  { id: "rm_atrocity_rumours", label: "Atrocity Rumours", category: "rumor_misinfo", subcategory: "Rumor & Misinfo", csvColumn: "topic_RM_ATROCITY_PLANNING_RUMOURS", description: "Unverified claims of planned or occurring atrocities designed to inflame tensions. Often fabricated to trigger retaliatory mobilisation." },
  { id: "rm_conspiracy", label: "Conspiracy & Disinfo", category: "rumor_misinfo", subcategory: "Rumor & Misinfo", csvColumn: "topic_misdisinfo_rumour_conspiracy", description: "Conspiracy theories and deliberate disinformation targeting institutions, ethnic groups, or peace processes. Amplified during crises." },

  // Peace & Counter
  { id: "peace_calls", label: "Calls for Peace", category: "peace_counter", subcategory: "Peace Building", csvColumn: "topic_PEACE_CALLS_FOR_PEACE", description: "Explicit appeals for peace, ceasefire, or dialogue. Tracks positive counter-narratives emerging from communities and leaders." },
  { id: "peace_reconciliation", label: "Reconciliation", category: "peace_counter", subcategory: "Peace Building", csvColumn: "topic_PEACE_RECONCILIATION_FORGIVENESS", description: "Narratives promoting reconciliation between conflicting communities, including forgiveness frameworks and transitional justice." },
  { id: "peace_unity", label: "Unity & Healing", category: "peace_counter", subcategory: "Peace Building", csvColumn: "topic_PEACE_UNITY_HEALING", description: "Messages emphasising shared national identity, collective healing, and moving beyond ethnic or clan divisions." },
  { id: "peace_cohesion", label: "Peace Cohesion", category: "peace_counter", subcategory: "Peace Building", csvColumn: "topic_peace_cohesion_counter", description: "Counter-speech promoting social cohesion, intergroup cooperation, and peaceful coexistence narratives." },
  { id: "peace_reconciliation2", label: "Forgiveness", category: "peace_counter", subcategory: "Peace Building", csvColumn: "topic_reconciliation_forgiveness", description: "Forgiveness-centred messaging encouraging communities to release grievances as a path toward sustainable peace." },
  { id: "peace_indigenous", label: "Indigenous Mechanisms", category: "peace_counter", subcategory: "Mechanisms", csvColumn: "topic_PEACE_INDIGENOUS_MECHANISMS", description: "References to indigenous conflict resolution (e.g. Somali xeer, Dinka monyomiji) as alternatives to formal processes." },
  { id: "peace_traditional", label: "Traditional Mediation", category: "peace_counter", subcategory: "Mechanisms", csvColumn: "topic_PEACE_TRADITIONAL_MEDIATION", description: "Advocacy for traditional mediation by elders, chiefs, or religious leaders as trusted community-level peacebuilding." },
  { id: "peace_women", label: "Women & Survivor Voices", category: "peace_counter", subcategory: "Mechanisms", csvColumn: "topic_PEACE_WOMEN_VICTIM_SURVIVOR_VOICES", description: "Amplification of women's peace activism and survivor testimony as powerful counter-narratives to violence." },
  { id: "peace_media_literacy", label: "Media Literacy", category: "peace_counter", subcategory: "Counter", csvColumn: "topic_PEACE_MEDIA_LITERACY_COUNTER_RUMOUR", description: "Efforts to build media literacy and critical thinking to counter rumour spread and disinformation." },
  { id: "peace_counter_disinfo", label: "Counter Disinfo", category: "peace_counter", subcategory: "Counter", csvColumn: "topic_counter_disinfo_correction", description: "Active debunking and correction of false claims, fact-checking initiatives, and rumour response by trusted voices." },
  { id: "peace_counter_ve", label: "Counter VE Labels", category: "peace_counter", subcategory: "Counter", csvColumn: "topic_COUNTER_VE_LABELS", description: "Counter-narratives specifically targeting violent extremism recruitment, including de-radicalisation messaging and alternative pathways." },
  { id: "peace_hashtag", label: "Hashtag Campaigns", category: "peace_counter", subcategory: "Counter", csvColumn: "topic_PEACE_HASHTAG_CAMPAIGNS", description: "Organised peace hashtag campaigns and coordinated positive messaging initiatives on social media platforms." },
  { id: "peace_org_refs", label: "Org References", category: "peace_counter", subcategory: "Counter", csvColumn: "topic_PEACE_ORG_REFERENCES", description: "References to peace organisations, NGOs, and civil society actors working on conflict resolution and prevention." },
  { id: "peace_symbolic", label: "Symbolic Slogans", category: "peace_counter", subcategory: "Counter", csvColumn: "topic_PEACE_SYMBOLIC_SLOGANS", description: "Symbolic peace slogans, unity phrases, and rallying cries (e.g. 'One Sudan', 'Wamoja') used to build collective identity." },
  { id: "peace_interfaith", label: "Interfaith Peace", category: "peace_counter", subcategory: "Counter", csvColumn: "topic_interfaith_peace", description: "Interfaith dialogue and cooperation messaging, emphasising shared values across religious communities." },

  // Cross-cutting
  { id: "cc_direct_threats", label: "Direct Threats", category: "cross_cutting", subcategory: "Threats", csvColumn: "topic_direct_threats_intimidation", description: "Explicit threats of violence or intimidation against individuals, groups, or locations. Highest-priority escalation indicator." },
  { id: "cc_explicit_violence", label: "Explicit Violence", category: "cross_cutting", subcategory: "Threats", csvColumn: "topic_explicit_violence_or_attack", description: "Graphic descriptions of violence or celebration of attacks. May indicate operational planning or serve as intimidation." },
  { id: "cc_expulsion", label: "Expulsion/Cleansing Cues", category: "cross_cutting", subcategory: "Threats", csvColumn: "topic_expulsion_or_ethnic_cleansing_cues", description: "Language advocating forced removal or ethnic cleansing ('go back', 'clear them out'). Critical early warning signal." },
  { id: "cc_grievance", label: "Grievance & Victimhood", category: "cross_cutting", subcategory: "Grievance", csvColumn: "topic_grievance_victimhood", description: "Victimhood narratives framing one's own group as under existential threat, often used to justify pre-emptive aggression." },
  { id: "cc_retaliation", label: "Retaliation & Mobilisation", category: "cross_cutting", subcategory: "Grievance", csvColumn: "topic_retaliation_mobilisation", description: "Calls for retaliatory action framed as self-defence. Often the bridge between grievance narratives and actual violence." },
  { id: "cc_sectarian", label: "Sectarian Incitement", category: "cross_cutting", subcategory: "Grievance", csvColumn: "topic_sectarian_or_religious_incitement", description: "Incitement along sectarian or religious fault lines, exploiting theological differences to deepen communal divisions." },
  { id: "cc_doxxing", label: "Doxxing & Data Cues", category: "cross_cutting", subcategory: "Other", csvColumn: "topic_doxxing_or_personal_data_cues", description: "Sharing personal information (names, locations, photos) of targeted individuals to enable harassment or physical harm." },
  { id: "cc_nonviolence", label: "Nonviolence", category: "cross_cutting", subcategory: "Other", csvColumn: "topic_nonviolence_deescalation", description: "Advocacy for nonviolent approaches, de-escalation, and peaceful protest. Positive indicator tracked across all categories." },
  { id: "cc_unity", label: "Unity & Cohesion", category: "cross_cutting", subcategory: "Other", csvColumn: "topic_unity_cohesion", description: "Cross-cutting messages promoting unity and social cohesion that span multiple narrative categories." },
];

// Alert thresholds
export const THRESHOLDS = {
  watch: { eaHsHate: 0.5, countryModelConf: 0.6 },
  alert: { eaHsHate: 0.7 },
  action: { eaHsHate: 0.85 },
};

// Escalation indicators from monitoring rules
export const ESCALATION_INDICATORS = [
  "Revenge framing + explicit target group + time/place cue",
  "Calls to join + contact channel (Telegram/WhatsApp) + ideological framing",
  "Dehumanization label + location + imperative verbs (burn, clear, wipe)",
  "Rumour/breaking marker + atrocity claim + share spike",
  "Delegitimization of UN/peace actors + collusion accusation + action framing",
  "Coordinated phrasing across multiple actors (near-identical slogans)",
  "Explicit naming of sites alongside threat verbs",
  "Religious excommunication + directive to attack/expel",
  "Fundraising cues paired with militant symbolism",
  "Cross-platform jump: same narrative X → Facebook within 6-24h",
  "Sudden emergence of new coded label used by multiple accounts",
  "High-volume replies around one rumour actor (orchestration)",
  "Targeted harassment pile-on against peace actor with dehumanizing memes",
  "Spike in self-defence rhetoric after disinformation incident",
  "Explicit instructions to meet/march with date/time",
];

// Country map coordinates (centroids)
export const COUNTRY_COORDS: Record<string, [number, number]> = {
  KE: [37.9, 0.02],
  SO: [46.2, 5.15],
  SS: [31.3, 6.88],
};
