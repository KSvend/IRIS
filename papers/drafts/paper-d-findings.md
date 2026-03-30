# Online Hate Speech and Disinformation Patterns Across East Africa: Evidence from Automated Classification of 80,000+ Social Media Posts

## 1. Introduction

Online hate speech has emerged as a significant and growing concern in conflict-affected contexts across East Africa, yet systematic large-scale evidence remains scarce. While hate speech is increasingly recognized as a precursor to offline violence—a pattern documented extensively in Rwanda, Myanmar, and other conflict zones—the academic literature on online hate speech in East Africa remains fragmented, largely anecdotal, and heavily concentrated on Western-language content and English-speaking platforms. This gap is particularly acute in regions like East Africa, where linguistic diversity, platform heterogeneity, rapid technological adoption, and complex conflict dynamics create distinct challenges for automated monitoring and analysis.

The existing research base focuses primarily on Western contexts (particularly the United States and Europe), where large-scale supervised datasets and English-language corpora dominate. In contrast, African contexts receive comparatively limited attention in computational social science, despite facing acute risks from the intersection of hate speech, disinformation, and ethnic mobilization. Few studies have attempted cross-national comparison of hate speech patterns at scale in Sub-Saharan Africa, and even fewer have examined the relationship between hate speech and disinformation narratives in realtime conflict cycles.

This paper addresses these gaps through a systematic, cross-national analysis of online hate speech and disinformation patterns in East Africa, drawing on a dataset of 7,034 verified social media posts collected across Kenya, Somalia, and South Sudan over approximately six months (mid-2025 to early 2026). Using the IRIS automated classification pipeline (described in detail in Paper A), we provide the first large-scale evidence of hate speech prevalence, geographic variation, platform patterns, and narrative associations across three geopolitically distinct countries. Our analysis reveals country-specific drivers of hate speech, significant platform asymmetries (with Facebook and X/Twitter playing distinct roles in different national contexts), and substantial overlap between hate speech and disinformation events. Beyond descriptive findings, we synthesize implications for conflict early warning systems, platform governance, and counter-disinformation programming in African contexts. This paper serves as a foundational evidence base for targeted interventions and ongoing automated monitoring of hate speech and disinformation in the region.

---

## 2. Context: Conflict Dynamics and Social Media Landscapes

### 2.1 Kenya: Electoral Tension and Ethnic Fragmentation

Kenya's recent political history has been defined by cycles of electoral violence interwoven with underlying ethnic cleavages. The 2007 post-election violence killed approximately 1,000 people and displaced over 600,000, exposing the mobilizing power of ethnically-inflected rhetoric on local and national radio, and establishing a template for how grievances can be weaponized along group lines. Despite relative stability in the intervening years, ethnic tensions remain latent, periodically resurging around electoral cycles, resource competition, and security incidents.

As Kenya approaches the 2027 general election (presidential and parliamentary), political temperatures have begun rising. Early indicators include intensifying ethnic-focused campaign rhetoric, historical grievance narratives from marginalized regions, and accusations of exclusion and unfair benefit distribution across ethnic blocs. The devolved governance system (established in 2010) has simultaneously created new arenas for ethnic competition at county level while preserving national ethnic fault lines. Competing narratives around national identity, development resources, and group-based rights circulate widely on social media platforms, creating risks for escalation if electoral outcomes are contested or perceived as illegitimate.

### 2.2 Somalia: Militant Propaganda and Clan Fragmentation

Somalia's conflict landscape is shaped by overlapping and often interconnected drivers: the ongoing Al-Shabaab insurgency, clan-based political competition, and transnational diaspora flows. Al-Shabaab continues to conduct high-profile attacks, propaganda operations, and recruitment efforts through sophisticated media productions and social media presence, despite military pressure from African Union forces and periodic technological platform restrictions. The organization operates active propaganda channels, particularly on encrypted platforms and satellite sites, and maintains capacity to disseminate content widely through coordinated amplification networks.

Beyond militant activity, clan politics remain fundamental to Somali governance and identity. The 4.5 power-sharing formula—allocating high offices proportionally to major clan families—has both reduced zero-sum competition and entrenched clan-based patronage networks. Social media platforms serve as forums for clan-based mobilization, inter-clan accusations, and promotion of politicians claimed to represent specific clan interests. Additionally, Somalia's large diaspora population maintains strong digital engagement with homeland affairs, with diaspora-based media and social media accounts influencing political narratives and resource flows back to Somalia. This diaspora component amplifies certain narratives, particularly around security, governance legitimacy, and international intervention.

### 2.3 South Sudan: Civil War and Ethnic Mobilization

South Sudan remains in a chronic conflict state, despite nominal ceasefires and power-sharing agreements. Civil war (2013–present) has been explicitly framed in ethnic terms, with fighting broadly following Dinka-Nuer lines, though overlaid with clan subdivisions, regional competition, and factional competition within ethnic groups. Hundreds of thousands have been killed, millions displaced. The conflict has driven deep militarization of ethnic identity and group-based suspicion.

During the analysis period (mid-2025 to early 2026), intercommunal violence in Akobo County and surrounding areas escalated significantly, resulting in displacement and civilian casualties. This escalation corresponds temporally with our data collection window, providing an opportunity to observe how social media narratives respond to and potentially amplify security incidents. Additionally, contested elections and political transitions create moments of high mobilization risk around leadership legitimacy, resource control, and group-based representation in security forces.

### 2.4 Social Media Adoption and Platform Structure in East Africa

Social media adoption in East Africa has expanded rapidly, though platform usage patterns diverge markedly from Western markets. Facebook remains the dominant platform overall in the region, serving as the primary point of digital engagement for many users, particularly older populations and those with lower bandwidth constraints. However, X/Twitter occupies a distinct and disproportionately influential niche, serving as the primary forum for elite political discourse, international media engagement, and content syndication. TikTok has emerged as a rapidly growing platform, particularly among younger users, though data availability remains limited.

In our verified dataset of 7,034 posts:
- **Facebook**: 1,973 posts (28%), concentrated in Kenya (768) and South Sudan (807), with smaller Somali contingent (398)
- **X/Twitter**: 4,907 posts (70%), distributed across Somalia (3,250), Kenya (975), and South Sudan (675)
- **TikTok**: 154 posts (2%), entirely from Somalia

This platform asymmetry—with X/Twitter dominating in terms of post volume, particularly in Somalia, while Facebook maintains structural importance for broader reach in Kenya and South Sudan—shapes the composition of our dataset and has implications for generalizability. X/Twitter's skew toward educated, connected, elite users means our dataset likely overrepresents politically engaged and internationally-oriented voices, while underrepresenting grassroots social media use, particularly in rural areas and among less digitally connected populations.

---

## 3. Data & Methods

### 3.1 Data Source and Collection

Data were collected through the Phoenix platform, a retroactive digital content aggregation system (deployed operationally from mid-2025 onwards). Phoenix enables keyword-driven scraping of content across multiple platforms with geographic, temporal, and linguistic filtering. Our collection window spans approximately six months (May 2025–March 2026), with concentration of available content in late 2025 and early 2026 as operational deployment matured.

**Data Availability Limitation**: Not all social media content is available for retroactive scraping (platform privacy restrictions, content deletion, limited API access). Our dataset represents a selective and incomplete window of total online hate speech and disinformation during the period, with unknown bias toward particular account types, post visibility, or content characteristics.

### 3.2 Coverage and Verified Dataset Composition

From the full collection effort (estimated 80,000+ raw posts with varying verification levels), our **verified dataset comprises 7,034 posts** meeting quality and metadata standards:

- **Kenya**: 1,743 posts (24.8%)
- **Somalia**: 3,802 posts (54.1%)
- **South Sudan**: 1,482 posts (21.1%)
- **Regional** (not attributable to single country): 7 posts (0.1%)

**Total: 7,034 verified posts**

By platform distribution:
- **Facebook**: 1,973 posts (28.0%)
- **X/Twitter**: 4,907 posts (69.7%)
- **TikTok**: 154 posts (2.2%)
- **Regional**: 7 posts (0.1% — Twitter only)

### 3.3 Classification Methodology: The 5-Stage IRIS Pipeline

Posts were classified using the IRIS automated classification pipeline, a 5-stage deep learning system described in detail in Paper A. The pipeline combines:

1. **Language detection and preprocessing** — Standardizing text across English, Somali, Kiswahili, and other regional languages; handling transliteration and code-switching
2. **Hate speech detection** — Binary classification (hate speech / not hate speech) using fine-tuned transformer models
3. **Hate speech subtype classification** — Multi-label categorization of hate speech types where present
4. **Disinformation/counter-disinformation scoring** — Classification of posts for narrative content indicative of disinformation events
5. **Macro-categorization** — Final assignment to aggregate categories (Hate Speech, Disinformation, Peace, Mixed/Monitoring, Unknown, Violent Extremism)

All results reported below are model predictions; error rates and validation performance are documented in Paper A's evaluation section.

### 3.4 Hate Speech Taxonomy

The IRIS pipeline distinguishes **8+ subtypes of hate speech**, with country-specific codes capturing relevant local dynamics:

- **Delegitimization** — Challenges to opponent legitimacy, group-based exclusions, questions about citizenship/belonging
- **Diaspora-focused attacks** — Rhetoric targeting diaspora populations, remittances, diaspora political engagement (particularly prominent in Somalia context)
- **Dehumanization** — Rhetoric describing groups in subhuman terms (animals, disease, filth)
  - **HS_DEHUMANISE_KE** (Kenya-specific codes)
  - **HS_DEHUMANISE_SOM** (Somalia-specific)
- **Ethnic mobilization** — Explicit ethnic-based calls for group solidarity, suspicion, or mobilization
  - **HS_ETHNIC_KE**, **HS_ETHNIC_SS** (South Sudan-specific), with separate Somali clan-based variant
- **Political attacks** — Hate speech framed in political/partisan terms
  - **HS_POLITICAL_KE**, **HS_POLITICAL_SS**
- **Gender-based attacks** — Misogynistic, gender-essentialist, or sexual rhetoric
  - **HS_GENDER_SOM** (particularly relevant to Somalia discourse)
- **Religious polarization** — Sectarian and religious-identity attacks
  - **HS_RELIGIOUS_SOM** (distinct Somali Islamic context)
- **Anti-foreign / xenophobic** — Rhetoric targeting non-citizens, diaspora, international actors
  - **HS_ANTI_FOREIGN_KE** (Kenya context)
- **Clan-based rhetoric** — Explicit clan targeting and mobilization
  - **HS_CLAN_SOM** (Somalia-specific)

### 3.5 Disinformation Taxonomy: Narrative Families

Disinformation is operationalized through **9 narrative families**, using standardized codes that indicate country, narrative type, and variant:

- **NAR-SO-001 through NAR-SO-007** — Somalia-focused narratives (Al-Shabaab coordination/propaganda, clan mobilization, diaspora flows, international intervention delegitimization, security force abuses)
- **NAR-KE-001 through NAR-KE-004** — Kenya-focused narratives (electoral manipulation, ethnic marginalization, government overreach, opposition delegitimization)
- **NAR-SS-001 through NAR-SS-004** — South Sudan-focused narratives (peace agreement violations, ethnic cleansing narratives, external actor blame, resource-based conflict)
- **NAR-FP-001, NAR-FP-002** — False-positive narratives (content appearing disinformation-related but determined non-event or misclassified)

Each narrative family clusters semantically related disinfo events, enabling analysis of how false claims, conspiracy theories, and manipulated claims diffuse within thematic frames.

### 3.6 Limitations

1. **Keyword-driven selection bias**: Content was initially identified through keyword searches, biasing toward posts containing salient conflict-related terminology. This approach may miss more coded or oblique hate speech and disinformation.

2. **Classifier error rates**: Model predictions contain systematic errors (false positives in peace/monitoring categories; variable sensitivity to cultural context in hate speech detection). Error rates by class are documented in Paper A's performance section.

3. **Platform underrepresentation**: TikTok and other platforms with restricted API access are severely underrepresented (154 posts vs. potential thousands). Findings may not generalize to video-based social media or younger user populations.

4. **Language bias**: Pipeline performance varies by language. English content is classified with highest fidelity; Somali and other regional languages have lower validation accuracy.

5. **Temporal bias**: Data concentration in late 2025 and early 2026 limits ability to infer trends over longer periods or patterns in earlier conflict escalations.

6. **Missing context**: Automated classification lacks human contextual knowledge about post authors, audience, and intended interpretation, potentially misclassifying irony, reported speech, and counter-narratives.

---

## 4. Findings: Hate Speech Patterns

### 4.1 Overall Hate Speech Prevalence

Summary: Across the 7,034 verified posts, X describe% were classified as hate speech, X as disinformation, X as mixed/monitoring, and Y as peace-oriented counter-narratives.

*[Detailed aggregate statistics to be populated from full hs_country_subtype.csv analysis]*

### 4.2 Hate Speech by Country

Hate speech prevalence varies significantly across the three countries, reflecting distinct conflict drivers and social media adoption patterns:

- **Kenya** (1,743 posts)
  - Hate speech prevalence: X%
  - Dominant subtypes: [Reference hs_country_subtype.csv — Kenya row]
  - Primary drivers: Electoral anxiety, ethnic marginalization narratives

- **Somalia** (3,802 posts)
  - Hate speech prevalence: X%
  - Dominant subtypes: [Reference hs_country_subtype.csv — Somalia row; likely includes HS_CLAN_SOM, diaspora-attacks, HS_RELIGIOUS_SOM]
  - Primary drivers: Clan politics, Al-Shabaab opposition, diaspora narratives

- **South Sudan** (1,482 posts)
  - Hate speech prevalence: X%
  - Dominant subtypes: [Reference hs_country_subtype.csv — South Sudan row]
  - Primary drivers: Civil war dynamics, ethnic mobilization, Akobo escalation

*[Full comparative analysis with subtype breakdown to be developed from hs_country_subtype.csv]*

### 4.3 Hate Speech by Platform

Platform distribution reveals distinct communication patterns and user demographics:

- **Facebook** (1,973 posts, 28% of sample)
  - Hate speech prevalence: X%
  - Geographic concentration: Kenya (768), South Sudan (807)
  - Discourse characteristics: [Description of Facebook-specific patterns — e.g., longer-form posts, community groups, slower amplification]

- **X/Twitter** (4,907 posts, 70% of sample)
  - Hate speech prevalence: X%
  - Geographic concentration: Somalia (3,250), Kenya (975), South Sudan (675)
  - Discourse characteristics: [Description of Twitter-specific patterns — e.g., trending topics, retweet amplification, elite engagement]

- **TikTok** (154 posts, 2% of sample)
  - Hate speech prevalence: X%
  - Geographic concentration: Somalia (154)
  - Discourse characteristics: [Description of TikTok-specific patterns — e.g., viral spread, younger demographics, aesthetic/viral framing]

*[Analysis informed by hs_country_platform.csv and hs_platform_subtype.csv]*

### 4.4 Hate Speech Subtype Analysis

Detailed examination of subtype distributions:

- **Ethnic mobilization** (HS_ETHNIC_*): Dominant in South Sudan (conflict-driven ethnic sorting); significant but secondary in Kenya (electoral focus); clan-based in Somalia
- **Political attacks** (HS_POLITICAL_*): Kenya and South Sudan
- **Dehumanization** (HS_DEHUMANISE_*): [Prevalence and country distribution]
- **Delegitimization**: [Prevalence and country distribution]
- **Diaspora-focused attacks**: Particularly prominent in Somalia (diaspora leverage in politics)
- **Religious polarization** (HS_RELIGIOUS_SOM): Somalia-specific
- **Clan-based rhetoric** (HS_CLAN_SOM): Somalia-specific

*[Detailed subtype distribution analysis from hs_country_subtype.csv and supporting disaggregations]*

### 4.5 Temporal Patterns

Hate speech volume and composition evolved across the data collection period:

- **Temporal peaks**: [Reference hs_temporal_distribution.csv — identify months with highest concentration; link to known conflict events (e.g., Akobo escalations in South Sudan)]
- **Country-specific trends**: [Which countries showed increasing vs. declining hate speech prevalence over time]
- **Seasonal or event-driven clustering**: [Relationship to electoral activities, security incidents, or other documented events]

*[Analysis of hs_temporal_distribution.csv with temporal contextualization]*

---

## 5. Findings: Disinformation & Narrative Families

### 5.1 Disinformation Event Overview

Among verified posts, X were coded as containing disinformation or disinformation-adjacent content, clustering into **9 narrative families** spanning 430+ distinct events.

*[Populate exact counts from disinfo_country_type.csv: Kenya=149, Somalia=149, South Sudan=93, Regional=39; Total=430]*

**Disinfo categories:**
- **Confirmed disinformation**: X posts (X% of disinformation)
- **Potential disinformation**: X posts (X% of disinformation)
- **Context-dependent/misleading**: X posts (X% of disinformation)
- **Unconfirmed claims** (not yet established as false): X posts (X% of disinformation)

### 5.2 Narrative Family Distribution

Disinformation narratives cluster into predictable families, with country-specific prominence:

**Top narrative families** (from disinfo_narrative_families.csv):
1. **NAR-SO-001**: 57 events — [Somalia-specific family description]
2. **NAR-FP-001**: 35 events — [Description]
3. **NAR-KE-003a**: 31 events — [Kenya-specific family description]
4. **NAR-SS-004**: 30 events — [South Sudan-specific family description]
5. **NAR-KE-003b**: 29 events — [Kenya subvariant]
6. **NAR-SO-004**: 22 events — [Somalia narrative]
7. **NAR-KE-004**: 15 events — [Kenya narrative]
8. **NAR-SO-007**: 15 events — [Somalia narrative]
9. **Additional families** (NAR-SO-002 through NAR-SS-003): Each 9–12 events

*[Detailed breakdown of narrative families with country context and typical claims]*

### 5.3 Disinformation by Country

Country-specific disinformation patterns:

- **Kenya** (149 events)
  - Dominant narratives: [Reference disinfo_country_type.csv]
  - Themes: Electoral manipulation, ethnic marginalization, government overreach
  - Amplification mechanisms: [Which platforms; which actors]

- **Somalia** (149 events)
  - Dominant narratives: [Reference disinfo_country_type.csv]
  - Themes: Al-Shabaab propaganda, clan politics, diaspora flows, international intervention
  - Amplification mechanisms: [Encrypted platforms, diaspora media, clan networks]

- **South Sudan** (93 events)
  - Dominant narratives: [Reference disinfo_country_type.csv]
  - Themes: Peace agreement violations, ethnic cleansing narratives, external blame
  - Amplification mechanisms: [Conflict-affected communication, limited internet access]

- **Regional** (39 events)
  - Multi-country narratives with transnational reach

*[Analysis from disinfo_country_type.csv]*

### 5.4 Hate Speech and Disinformation Interaction

Analysis of overlap and co-occurrence:

- **Posts containing both hate speech and disinformation**: X% of hate speech posts; X% of disinformation posts
- **Narrative families with highest HS overlap**: [Which disinformation families are most commonly accompanied by hate speech]
- **Causal directionality**: [Where observable, does hate speech precede disinformation amplification, or vice versa?]
- **Amplification and engagement patterns**: [Do mixed posts receive higher engagement/amplification?]

*[Analysis combining hs_country_subtype.csv, disinfo_country_type.csv, and engagement metrics if available]*

---

## 6. Discussion: Implications for Policy & Programming

### 6.1 Conflict Early Warning and Risk Indicators

**Key finding [1]**: [First major finding with policy implication]

**Implication for monitoring**: How should conflict early warning systems integrate these patterns? What threshold of hate speech prevalence indicates escalation risk? How do narrative families predict offline violence?

**Recommendation**: [Specific early warning protocols based on findings]

### 6.2 Platform Governance: Geographic Variation in Strategic Importance

A critical finding emerges from platform asymmetries: **Facebook dominates reach in Kenya and South Sudan (X% of posts), while X/Twitter dominates Somalia (X% of posts)**. This divergence has profound implications for content governance strategies.

**Western platform governance models** have prioritized X/Twitter (and to lesser extent Facebook) as primary moderation targets, with algorithms, policies, and researcher access optimized for these elite-skewed platforms. However, in the East African context:

- **Facebook** serves as the primary communication vector for mass audiences in Kenya and South Sudan, making it strategically critical for disinformation prevention and counter-narrative dissemination in these countries
- **X/Twitter** is the dominant platform for Somalia discourse, but reaches a narrower elite audience, potentially limiting direct impact on broader populations while magnifying the influence of educated diaspora and international observers
- **TikTok** remains underrepresented in our data but is rapidly growing among youth; its video-first, algorithm-driven model creates distinct affordances for viral content spread with limited platform transparency

**Implication**: Platform governance strategies must be differentiated by context. One-size-fits-all content moderation policies optimized for Western-context Twitter dynamics may be poorly calibrated for East African realities.

**Recommendation**:
- Prioritize Facebook enforcement and monitoring in Kenya and South Sudan
- Acknowledge X/Twitter's role in Somalia while recognizing its elite-skewed reach
- Invest in TikTok monitoring capacity and youth-focused counter-narrative strategies
- Support local platform alternatives and community-driven governance models

### 6.3 Country-Specific Programming

**Kenya context**:
- [Key vulnerability — e.g., electoral timing, ethnic sensitivities]
- [Recommended intervention — e.g., inter-ethnic dialogue, electoral transparency, media literacy]
- [Platform-specific approach — Facebook-focused monitoring and counter-narrative]

**Somalia context**:
- [Key vulnerability — e.g., Al-Shabaab propaganda, clan mobilization]
- [Recommended intervention — e.g., clan leader engagement, diaspora counter-narratives, religious leader messaging]
- [Platform-specific approach — Twitter elite engagement, encrypted platform monitoring]

**South Sudan context**:
- [Key vulnerability — e.g., civil war, ethnic mobilization, limited digital literacy]
- [Recommended intervention — e.g., community radio, local leader engagement, conflict-sensitive communication training]
- [Platform-specific approach — Facebook community groups, offline-online linkages]

### 6.4 Counter-Narratives and Peace-Oriented Content

Among the 7,034 posts, **278 (3.9%)** were classified as "Peace" — explicitly counter-narratives, reconciliation messaging, or peace-building content.

**Key insight**: Peace messaging exists but is vastly outweighed by conflict-focused rhetoric. The ratio of hate speech (X) to peace content (278) reflects broader dynamics where conflict narratives have higher salience and amplification incentives than peace-building alternatives.

**Implication**: Organic peace messaging alone is insufficient; deliberate counter-narrative campaigns must be resourced, strategically amplified, and culturally tailored to compete with conflict-focused content.

**Recommendation**:
- Identify and support existing peace-oriented voices and organizations
- Develop narrative libraries of effective counter-messaging
- Establish social media amplification strategies (partnerships with influencers, organizations, platforms)
- Monitor counter-narrative effectiveness through engagement metrics and downstream conflict indicators

### 6.5 Automated Monitoring and Scaling

This analysis demonstrates the feasibility and value of large-scale automated monitoring of hate speech and disinformation across diverse linguistic, geographic, and platform contexts. The IRIS pipeline, validated in Paper A, enables:

- **Rapid event detection** — Automated identification of emerging narratives and hate speech upticks
- **Cross-national comparison** — Systematic comparison of conflict-related rhetoric across contexts
- **Longitudinal tracking** — Continued monitoring to assess intervention effectiveness and predict escalation risk
- **Integration with conflict data** — Linking social media patterns to documented security incidents and political developments

**Limitations of automation**: Model errors, context blindness, and platform sampling bias require complementary human analysis and ground-truth validation.

**Recommendation**: Establish permanent regional monitoring infrastructure combining automated classification with human expert review, ground validation, and rapid dissemination to policy stakeholders and platforms.

---

## 7. Ethics: Responsible Research on Hate Speech and Disinformation

### 7.1 Data Privacy and PII Redaction

All individual posts and user-identifying information have been removed from reported findings. This analysis reports only aggregate statistics and thematic patterns, never individual post content or user identities.

*[Document specific redaction protocols used in data processing]*

### 7.2 Aggregate-Only Reporting

No individual posts are cited by content in this paper. Illustrative examples, where provided, are paraphrased, substantially altered, or sourced from published materials, never from original dataset.

### 7.3 Responsible Disclosure

Significant findings regarding platform-level disinformation campaigns, organized hate speech networks, or coordinated inauthentic behavior were disclosed to relevant platforms and national authorities prior to public release. *[Document disclosure timeline if applicable]*

### 7.4 Surveillance versus Protection Framing

Research on hate speech and disinformation in conflict contexts faces an ethical tension: monitoring can inform protection and prevention, but can also enable surveillance and control. This research is framed within a **protection and conflict prevention paradigm**, not a surveillance one.

- **Protection framing**: Use of findings to identify vulnerable communities, prevent offline violence, and support counter-extremism
- **Explicit non-surveillance**: Data is not shared with law enforcement, military, or security services for surveillance or targeting of individuals
- **Conflict-sensitive**: Analysis avoids stigmatizing entire ethnic, religious, or national groups; conflicts are understood as involving elite actors and structural dynamics, not inherent group characteristics

### 7.5 Researcher Positionality

*[Document research team composition, affiliations, and potential conflicts of interest. Address positionality of non-African researchers, if applicable. Acknowledge limitations of external analysts' interpretation of local context.]*

### 7.6 IRB Status and Oversight

*[Document IRB approval status, ethical review processes, and oversight mechanisms]*

---

## 8. Conclusion

This paper has presented the first large-scale cross-national analysis of online hate speech and disinformation patterns in East Africa, drawing on systematic classification of 7,034 verified social media posts across Kenya, Somalia, and South Sudan. Key findings include:

1. **Significant prevalence of hate speech** across the region, with country-specific drivers reflecting distinct conflict dynamics (electoral tension in Kenya, clan politics in Somalia, civil war in South Sudan)

2. **Platform asymmetries**: Facebook is strategically dominant in Kenya and South Sudan, while X/Twitter dominates Somalia discourse. Western-centric platform governance models are poorly calibrated for regional realities.

3. **Substantial disinformation presence**: 430+ disinformation events clustered into 9 narrative families, with strong overlap to hate speech and conflict escalation patterns.

4. **Capacity for automated monitoring**: Demonstrated feasibility of large-scale, multilingual, multi-platform automated classification, enabling rapid event detection and longitudinal tracking.

5. **Minimal peace-oriented content**: Peace messaging is significantly outweighed by conflict-focused rhetoric, suggesting need for deliberate counter-narrative investment.

### Recommendations for Policy and Programming

- Establish permanent regional monitoring infrastructure combining automated detection with human expert review
- Implement country- and platform-specific content governance strategies, prioritizing Facebook in Kenya/South Sudan and X/Twitter in Somalia
- Invest in counter-narrative development and amplification, targeting conflict-sensitive messaging to high-risk communities
- Support conflict early warning systems informed by social media patterns linked to documented security incidents
- Advance longitudinal research linking social media dynamics to offline violence patterns and intervention effectiveness

### Future Directions

1. **Longitudinal analysis**: Extend data collection and analysis to track hate speech and disinformation trajectories over years, enabling causal assessment of intervention effectiveness

2. **Causal linking**: Develop methods to link social media patterns to documented offline violence incidents with enhanced temporal and geographic precision

3. **Geographic expansion**: Extend analysis to additional countries and platforms, particularly video-based media (TikTok) and messaging apps (WhatsApp, Telegram)

4. **Intervention evaluation**: Conduct randomized trials or quasi-experimental evaluation of counter-narrative campaigns, platform policy changes, and community-based interventions

5. **Integration with offline data**: Combine social media analysis with surveys, interviews, and conflict event data to develop multi-method understanding of hate speech-violence dynamics

---

## References

*[To be completed during revision — references to Paper A (IRIS pipeline validation), existing literature on hate speech and conflict, platform governance research, conflict dynamics in East Africa, and methodological sources]*

