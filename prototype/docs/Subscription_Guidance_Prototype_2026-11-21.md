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
