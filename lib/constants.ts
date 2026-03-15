import type { NarrativeTopic, NarrativeCategory } from "./types";

// Color palette for narrative categories
export const CATEGORY_COLORS: Record<NarrativeCategory, string> = {
  hate_speech: "#dc2626",
  violent_extremism: "#991b1b",
  rumor_misinfo: "#f59e0b",
  peace_counter: "#16a34a",
  cross_cutting: "#d97706",
};

export const CATEGORY_LABELS: Record<NarrativeCategory, string> = {
  hate_speech: "Hate Speech",
  violent_extremism: "Violent Extremism",
  rumor_misinfo: "Rumor & Misinfo",
  peace_counter: "Peace & Counter",
  cross_cutting: "Cross-cutting",
};

export const SEVERITY_COLORS: Record<string, string> = {
  watch: "#eab308",
  alert: "#f97316",
  action: "#dc2626",
};

// Full narrative topic taxonomy mapped to CSV columns
export const NARRATIVE_TOPICS: NarrativeTopic[] = [
  // Hate Speech - Identity Targeting
  { id: "hs_clan_targeting", label: "Clan Targeting", category: "hate_speech", subcategory: "Identity Targeting", csvColumn: "topic_HS_CLAN_TARGETING" },
  { id: "hs_ethnic_scapegoating", label: "Ethnic Scapegoating", category: "hate_speech", subcategory: "Identity Targeting", csvColumn: "topic_HS_ETHNIC_SCAPEGOATING_JIENGE_CLUSTER" },
  { id: "hs_anti_foreign", label: "Anti-Foreign", category: "hate_speech", subcategory: "Identity Targeting", csvColumn: "topic_HS_ANTI_FOREIGN" },
  { id: "hs_caste_racism", label: "Caste & Racism", category: "hate_speech", subcategory: "Identity Targeting", csvColumn: "topic_HS_CASTE_RACISM" },
  { id: "hs_clan_hierarchy", label: "Clan Hierarchy", category: "hate_speech", subcategory: "Identity Targeting", csvColumn: "topic_HS_CLAN_HIERARCHY" },

  // Hate Speech - Dehumanization
  { id: "hs_dehumanisation", label: "Dehumanisation", category: "hate_speech", subcategory: "Dehumanization", csvColumn: "topic_HS_DEHUMANISATION_TARGETING" },
  { id: "hs_coded_slurs", label: "Coded Slurs", category: "hate_speech", subcategory: "Dehumanization", csvColumn: "topic_coded_slurs_ethnic" },
  { id: "hs_identity_incitement", label: "Identity Incitement", category: "hate_speech", subcategory: "Dehumanization", csvColumn: "topic_identity_incitement_dehumanisation" },
  { id: "hs_hate_slurs", label: "Hate Slurs", category: "hate_speech", subcategory: "Dehumanization", csvColumn: "topic_hate_slurs_or_coded" },
  { id: "hs_dehumanise_media", label: "Dehumanise Media Trust", category: "hate_speech", subcategory: "Dehumanization", csvColumn: "topic_HS_DEHUMANISE_MEDIA_TRUST" },

  // Hate Speech - Political
  { id: "hs_factional", label: "Factional Attacks", category: "hate_speech", subcategory: "Political", csvColumn: "topic_HS_FACTIONAL_ATTACKS_AND_BETRAYAL" },
  { id: "hs_delegitimisation", label: "Delegitimisation", category: "hate_speech", subcategory: "Political", csvColumn: "topic_delegitimisation_anti_state" },
  { id: "hs_regionalism", label: "Regionalism (Kokora)", category: "hate_speech", subcategory: "Political", csvColumn: "topic_HS_REGIONALISM_KOKORA" },
  { id: "hs_coded_metaphor", label: "Coded Metaphors", category: "hate_speech", subcategory: "Political", csvColumn: "topic_HS_MTN_CODED_METAPHOR_REVIEW" },

  // Hate Speech - Gendered
  { id: "hs_gbov", label: "Gender-Based Violence", category: "hate_speech", subcategory: "Gendered", csvColumn: "topic_HS_GBOV_GENDERED" },
  { id: "hs_sexualised", label: "Sexualised Harm", category: "hate_speech", subcategory: "Gendered", csvColumn: "topic_sexualised_harm_or_humiliation" },
  { id: "hs_gendered_hate", label: "Gendered Hate", category: "hate_speech", subcategory: "Gendered", csvColumn: "topic_gendered_hate_or_humiliation" },

  // Hate Speech - Diaspora
  { id: "hs_diaspora_stigma", label: "Diaspora Stigma", category: "hate_speech", subcategory: "Diaspora", csvColumn: "topic_HS_RETURN_DIASPORA_STIGMA" },
  { id: "hs_national_identity", label: "Anti-Arab Framing", category: "hate_speech", subcategory: "Diaspora", csvColumn: "topic_HS_NATIONAL_IDENTITY_ANTI_ARAB_FRAMING" },
  { id: "hs_militarisation", label: "Militarisation Stereotype", category: "hate_speech", subcategory: "Diaspora", csvColumn: "topic_HS_MILITARISATION_STEREOTYPE_MATHIANG_ANYOR" },

  // Violent Extremism - Recruitment
  { id: "ve_recruitment", label: "Recruitment & Coercion", category: "violent_extremism", subcategory: "Recruitment", csvColumn: "topic_VE_RECRUITMENT_COERCION" },
  { id: "ve_propaganda", label: "Propaganda", category: "violent_extremism", subcategory: "Recruitment", csvColumn: "topic_ve_propaganda_recruitment" },
  { id: "ve_hijrah", label: "Hijrah (Migration)", category: "violent_extremism", subcategory: "Recruitment", csvColumn: "topic_ve_recruitment_or_hijrah" },
  { id: "ve_bayah", label: "Bayah (Allegiance)", category: "violent_extremism", subcategory: "Recruitment", csvColumn: "topic_ve_bayah_affiliation" },
  { id: "ve_youth", label: "Youth References", category: "violent_extremism", subcategory: "Recruitment", csvColumn: "topic_VE_CODED_YOUTH_REFERENCES" },
  { id: "ve_group_branding", label: "Group Branding", category: "violent_extremism", subcategory: "Recruitment", csvColumn: "topic_ve_group_branding" },
  { id: "ve_self_reference", label: "Self-Reference Terms", category: "violent_extremism", subcategory: "Recruitment", csvColumn: "topic_VE_SELF_REFERENCE_TERMS" },

  // Violent Extremism - Operations
  { id: "ve_mobilisation", label: "Militia Mobilisation", category: "violent_extremism", subcategory: "Operations", csvColumn: "topic_VE_MILITIA_MOBILISATION" },
  { id: "ve_escalation", label: "Operational Escalation", category: "violent_extremism", subcategory: "Operations", csvColumn: "topic_VE_OPERATIONAL_ESCALATION" },
  { id: "ve_attack_tactics", label: "Attack Tactics", category: "violent_extremism", subcategory: "Operations", csvColumn: "topic_ve_attack_tactics" },
  { id: "ve_atrocity", label: "Atrocity & Attacks", category: "violent_extremism", subcategory: "Operations", csvColumn: "topic_VE_ATROCITY_AERIAL_AND_ATTACKS" },
  { id: "ve_crossborder", label: "Cross-border/Diaspora", category: "violent_extremism", subcategory: "Operations", csvColumn: "topic_ve_crossborder_diaspora" },

  // Violent Extremism - Ideology
  { id: "ve_religious", label: "Religious Justification", category: "violent_extremism", subcategory: "Ideology", csvColumn: "topic_VE_RELIGIOUS_JUSTIFICATION" },
  { id: "ve_takfir", label: "Takfir & Dehumanise", category: "violent_extremism", subcategory: "Ideology", csvColumn: "topic_VE_TAKFIR_DEHUMANISE" },
  { id: "ve_religious_takfir", label: "Religious Takfir", category: "violent_extremism", subcategory: "Ideology", csvColumn: "topic_religious_justification_takfir" },
  { id: "ve_arabic_terms", label: "Arabic Peace/War Terms", category: "violent_extremism", subcategory: "Ideology", csvColumn: "topic_VE_ARABIC_PEACE_OR_WAR_TERMS_REVIEW" },
  { id: "ve_spy_claims", label: "Spy Claims", category: "violent_extremism", subcategory: "Ideology", csvColumn: "topic_VE_SECURITY_DELEGITIMATION_SPY_CLAIMS" },

  // Violent Extremism - Financing
  { id: "ve_financing_coord", label: "Financing Coordination", category: "violent_extremism", subcategory: "Financing", csvColumn: "topic_VE_FINANCING_COORDINATION" },
  { id: "ve_financing_req", label: "Financing Requests", category: "violent_extremism", subcategory: "Financing", csvColumn: "topic_RM_FINANCING_REQUESTS" },

  // Rumor & Misinfo
  { id: "rm_atrocity_rumours", label: "Atrocity Rumours", category: "rumor_misinfo", subcategory: "Rumor & Misinfo", csvColumn: "topic_RM_ATROCITY_PLANNING_RUMOURS" },
  { id: "rm_conspiracy", label: "Conspiracy & Disinfo", category: "rumor_misinfo", subcategory: "Rumor & Misinfo", csvColumn: "topic_misdisinfo_rumour_conspiracy" },

  // Peace & Counter
  { id: "peace_calls", label: "Calls for Peace", category: "peace_counter", subcategory: "Peace Building", csvColumn: "topic_PEACE_CALLS_FOR_PEACE" },
  { id: "peace_reconciliation", label: "Reconciliation", category: "peace_counter", subcategory: "Peace Building", csvColumn: "topic_PEACE_RECONCILIATION_FORGIVENESS" },
  { id: "peace_unity", label: "Unity & Healing", category: "peace_counter", subcategory: "Peace Building", csvColumn: "topic_PEACE_UNITY_HEALING" },
  { id: "peace_cohesion", label: "Peace Cohesion", category: "peace_counter", subcategory: "Peace Building", csvColumn: "topic_peace_cohesion_counter" },
  { id: "peace_reconciliation2", label: "Forgiveness", category: "peace_counter", subcategory: "Peace Building", csvColumn: "topic_reconciliation_forgiveness" },
  { id: "peace_indigenous", label: "Indigenous Mechanisms", category: "peace_counter", subcategory: "Mechanisms", csvColumn: "topic_PEACE_INDIGENOUS_MECHANISMS" },
  { id: "peace_traditional", label: "Traditional Mediation", category: "peace_counter", subcategory: "Mechanisms", csvColumn: "topic_PEACE_TRADITIONAL_MEDIATION" },
  { id: "peace_women", label: "Women & Survivor Voices", category: "peace_counter", subcategory: "Mechanisms", csvColumn: "topic_PEACE_WOMEN_VICTIM_SURVIVOR_VOICES" },
  { id: "peace_media_literacy", label: "Media Literacy", category: "peace_counter", subcategory: "Counter", csvColumn: "topic_PEACE_MEDIA_LITERACY_COUNTER_RUMOUR" },
  { id: "peace_counter_disinfo", label: "Counter Disinfo", category: "peace_counter", subcategory: "Counter", csvColumn: "topic_counter_disinfo_correction" },
  { id: "peace_counter_ve", label: "Counter VE Labels", category: "peace_counter", subcategory: "Counter", csvColumn: "topic_COUNTER_VE_LABELS" },
  { id: "peace_hashtag", label: "Hashtag Campaigns", category: "peace_counter", subcategory: "Counter", csvColumn: "topic_PEACE_HASHTAG_CAMPAIGNS" },
  { id: "peace_org_refs", label: "Org References", category: "peace_counter", subcategory: "Counter", csvColumn: "topic_PEACE_ORG_REFERENCES" },
  { id: "peace_symbolic", label: "Symbolic Slogans", category: "peace_counter", subcategory: "Counter", csvColumn: "topic_PEACE_SYMBOLIC_SLOGANS" },
  { id: "peace_interfaith", label: "Interfaith Peace", category: "peace_counter", subcategory: "Counter", csvColumn: "topic_interfaith_peace" },

  // Cross-cutting
  { id: "cc_direct_threats", label: "Direct Threats", category: "cross_cutting", subcategory: "Threats", csvColumn: "topic_direct_threats_intimidation" },
  { id: "cc_explicit_violence", label: "Explicit Violence", category: "cross_cutting", subcategory: "Threats", csvColumn: "topic_explicit_violence_or_attack" },
  { id: "cc_expulsion", label: "Expulsion/Cleansing Cues", category: "cross_cutting", subcategory: "Threats", csvColumn: "topic_expulsion_or_ethnic_cleansing_cues" },
  { id: "cc_grievance", label: "Grievance & Victimhood", category: "cross_cutting", subcategory: "Grievance", csvColumn: "topic_grievance_victimhood" },
  { id: "cc_retaliation", label: "Retaliation & Mobilisation", category: "cross_cutting", subcategory: "Grievance", csvColumn: "topic_retaliation_mobilisation" },
  { id: "cc_sectarian", label: "Sectarian Incitement", category: "cross_cutting", subcategory: "Grievance", csvColumn: "topic_sectarian_or_religious_incitement" },
  { id: "cc_doxxing", label: "Doxxing & Data Cues", category: "cross_cutting", subcategory: "Other", csvColumn: "topic_doxxing_or_personal_data_cues" },
  { id: "cc_nonviolence", label: "Nonviolence", category: "cross_cutting", subcategory: "Other", csvColumn: "topic_nonviolence_deescalation" },
  { id: "cc_unity", label: "Unity & Cohesion", category: "cross_cutting", subcategory: "Other", csvColumn: "topic_unity_cohesion" },
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
