# V3.0.0 §4.1 · Subscription Guidance Admin Prototype

## Entry

`#/commercialization/subscription-guides` · **Commercialization → Subscription Guidance**

This is an **interactive admin prototype**, not a production configuration API. It shares the existing Vue 2 / Element UI administrative shell, and stores draft and published snapshots in browser `localStorage`. The page itself contains a mobile preview; **publishing does not update the live membership page or actual App Store / Google Play offers**.

## Requirements mapped

| PRD §4.1 | Prototype |
| --- | --- |
| Three fixed membership modules | Comparison, Benefits Details, Q&A tabs |
| Enable/disable, sort descending | Module toggle and integer Sort; preview displays only enabled modules in descending order |
| Comparison title and free/premium values | 30-character required title, row name up to 20, independent Free/Premium boolean and optional description |
| Four benefits | Fixed Content / Plan / AI Insights / AI Chat, required name, headline, description and 750 × 375 image |
| Q&A | Add/remove questions; 50-character question and 300-character answer; optional module title |
| Feature entitlement guidance | One banner (750 × 320, without copy overlay), required 30-character title and 120-character description per existing entitlement |
| Multilingual | English fallback, optional ES/FR/DE/IT/ZH-CN language activation, independent text per locale, publish-time validation |
| Operator workflow | Save draft, discard changes, publication validation and version indicator. The annotation panel uses exact Figma screenshots (Membership & Usage 9128:2550 and contextual Paywall 9156:3283), and is **collapsed by default**. |

Default images are **illustrative placeholders**, not endorsed production creative. Uploaded images are checked for MIME, exact pixel size and prototype storage size (350 KB per image); the production design must use a real media service and returned asset IDs.

English is the initial enabled language. Once another language is enabled, all required fields must be provided in that language to publish. Fallback to English applies to preview for missing translations, **not** to publication validation.

## Data contract boundary

`model.cjs` exports `seed`, `reconcile`, `validate`, `projectMembership`, and `projectScene`.

- The structured configuration contains `membership.comparison`, `membership.details`, `membership.faq` and `scenes[entitlementCode]`.
- `projectMembership` returns enabled modules ordered by descending `sort`; comparison descriptions are omitted when empty.
- `projectScene` returns only a banner, title, description and entitlement code, with English fallback for preview.
- Access eligibility, scope, credit balance, pricing, offers, trial selection, StoreKit / Google Play purchase parameters and effective entitlements **must not** be modified by this content configuration.

In a real implementation: move draft, version, publication, image storage and localization to server APIs; add role permission, audit log, optimistic concurrency, rollback, history and endpoint integration with the native membership/paywall UI. Do not infer purchase eligibility or entitlements from display copy.

## Verification

Run from `prototype/`:

```sh
node --test tests/subscription-guides.test.cjs
npm test
npm run build
```

The source change was prepared via the GitHub connector. Local builds/browser verification are **not asserted** unless separately run in a development environment.

## Figma reference screenshots

The previously generated `Draft Preview` phone mockup has been replaced with a read-only **UI Reference · Figma** panel. The panel is closed when the configuration page opens; clicking `Show UI reference` expands it. Numbered outlines mark which elements are configured by §4.1, with read-only store pricing and purchase areas clearly separated. The image assets are committed in `public/assets/figma/subscription-guidance/` so links do not expire. The editing workflow and browser-local draft/publication state are unchanged.

## Update · Membership entry and per-entry A/B creative groups (2026-11-24)

**Requirement grounding:** [V3.0.0 §4.1](https://sunnyfit.atlassian.net/wiki/spaces/SA/pages/2065661955/V3.0.0) specifies localized Banner (750 × 320), title (≤30) and description (≤120) for subscription guidance. §4.3 explicitly specifies that the Membership & Usage page's subscription CTA opens the *default* paywall. It is **not** an entitlement-gated feature, unlike course, program or AI Insights. The A/B group mechanics below are an **operations proposal added to the prototype**, not an approved rule from §4.1.

**New Feature Paywalls entry:**
- Membership Page Entry / entrySource: membership / entitlementCode: null.
- This is the generic member-upgrade paywall shown from Membership & Usage; it uses the same per-entry creative fields as other paywalls.
- The other seven entries remain. Unavailable Movement Access and Challenge Access remain excluded.
- The annotated Figma screenshot panel remains collapsed by default; the general paywall screenshot illustrates placement, not a production preview.

**Per-entry multi-group operations prototype:**
- Each entry owns one experiment configuration: immutable prototype experimentId, editable experimentName, enabled toggle, and **1–5 named creative groups**.
- Group A is the protected Control, created by default with 100% weight. Adding a group duplicates the currently selected group's images and all enabled locale copy into a distinct, editable group, then automatically balances allocations equally. B/C/D/E can be deleted.
- Group-level traffic is an integer from 0 to 100. When the experiment is enabled, there must be **at least two groups**, every group must have **positive** weight, and the sum must be **100%** to publish the browser prototype.
- Each group independently configures 750 × 320 banner, localized title (max 30), localized description (max 120), and a name (max 40). Global language activation and validation apply to **all groups**, not only the selected one.
- A local assignment simulator takes a sample key and produces a **stable** group choice from a deterministic hash. With experiment disabled or an invalid sample, it falls back to Control A; this **does not** assign real users.
- Existing v1 saved drafts with a single scene.banner/title/description migrate to v2 as Control A, preserving copy and image data. Browser-local saved and published snapshots remain separate; reloading the admin page uses the v2 reconciliation flow.

**Boundary to real A/B testing:**
- No production experiment is switched on; browser publication is still localStorage-only.
- Backend implementation must own experiment creation/version, audience and eligibility, persistent stable assignment (no rebucketing after exposure), allocation changes and experiment shutdown, as well as effective published snapshots and rollback.
- Client must request the server-assigned creative for its entry source; a subscription paywall event should include entry_source, config_version, experiment_id, and variant_id together with the §5.2 events where appropriate. Do not send personal identifiers to analytics, and avoid overlapping with existing events.
- Store pricing, free trial/offer eligibility, payment processing and **effective entitlements** remain owned by the existing §4.2 SDK/server integration and never vary as a side-effect of the creative A/B configuration.
