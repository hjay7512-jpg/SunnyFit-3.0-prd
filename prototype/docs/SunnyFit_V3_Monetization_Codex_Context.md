# SunnyFit V3.0 Monetization — Codex CLI Prototype Context

Status: Working Context / Prototype Brief (NOT Approved Product Truth)
Prepared: 2026-10-09
Purpose: Build a runnable frontend + backend prototype to validate commercialization behavior, not a static UI slideshow or a production payment system.

## 0. Authority and source precedence
- Canonical V3.0 root: https://sunnyfit.atlassian.net/wiki/spaces/SA/folder/1952120834
- Canonical Business Context: https://sunnyfit.atlassian.net/wiki/spaces/SA/pages/1957691601
- Main Figma: https://www.figma.com/design/94S2EVx6mOkJRj8P0VyRLx/V3.0-MVP
- Alpha Figma: https://www.figma.com/design/t7g261XYs61EdvYzIZn5YL/V3.0-Alpha?node-id=221-1177
- Current UX styling and interactions must be read from Figma; this document is not a substitute for Figma.
- The currently found commercialization PRDs are in a PERSONAL Confluence space, marked Working Definition rather than approved canonical SA PRDs. Use as referenced working specifications pending canonical confirmation.
- Product decisions: conversation history = Working Context; Owner confirmation + SA Confluence recording = Approved Truth.
- Do NOT assume proposed credits strategy, prices, grants, consumption, or migration behaviors are approved.

### Source links (retrieved 2026-10-09)
1. Commercialization Management (Working Definition v0.5): https://sunnyfit.atlassian.net/wiki/spaces/~63b7cf11b790087ed712d207/pages/1979908100/Commercialization+Management
2. Entitlement Management (Working Definition v0.3): https://sunnyfit.atlassian.net/wiki/spaces/~63b7cf11b790087ed712d207/pages/1980366856/Entitlement+Management
3. MVP Entitlement Item List: https://sunnyfit.atlassian.net/wiki/spaces/~63b7cf11b790087ed712d207/pages/1981415433/Entitlement+Item+List
4. Entitlement Management - Backend: https://sunnyfit.atlassian.net/wiki/spaces/~63b7cf11b790087ed712d207/pages/1982791683/Entitlement+Management+-+Backend
5. Product Management: https://sunnyfit.atlassian.net/wiki/spaces/~63b7cf11b790087ed712d207/pages/1983676417/Product+Management
6. Product discussion, 2026-09-21: membership unlocks relatively low marginal-cost capabilities; Credits pay for valuable personalized services; member plan may gift Credits; proposed content tiers Free / Premium / Featured; Featured redeemed with Credits; grandfather previously redeemed Star content.
7. Prior discussions, 2026-09-18 and 2026-09-16: user-facing monetization touchpoints; backend suit, entitlement, product, SKU management.

## 1. Product intent (product discussion, not canonical decision)
- Membership: low-price recurring entitlement for features/capabilities whose marginal cost decreases with scale.
- Credits: consumable value for personalized services that meaningfully help users train better. Members may receive bundled credits, yet continued voluntary credit spending must be justified by real value.
- Free should preserve core training value and opportunities to experience personalization; paywalls should deepen experience, not break the workout loop.
- Content taxonomy candidate:
  - Free: accessible without Premium
  - Premium: requires membership access
  - Featured: editorial selection unlocked by Credits; potentially successor to legacy Star course redemption
- Previously redeemed Star content should stay available to users who have redeemed it (compatibility intention; exact migration/data model needs confirmation).
- This is a MODEL TO VALIDATE, not live product behavior, confirmed price list, or approved policy.

## 2. Baseline domain model supported by Working Definition PRDs
Three separate layers:
A. Entitlement = Entitlement Item + Entitlement Suit
B. Commerce = Product + SKU + Order
C. Fulfillment = Entitlement Grant + Effective Entitlement

Flow:
  Entitlement Item -> Suit
  Product (references Suit) -> SKU -> Order -> Grant -> Effective Entitlement
  Free account / Device / Campaign / Compensation -> Grant -> Effective Entitlement

Key rules:
- Item is a minimal separately checkable right.
- Spec has Scope + Quota; Access is NOT a separate Spec. Presence of Item in Suit grants access.
- Scope defaults to ALL; Scope supports multiple concrete selections; ALL is mutually exclusive with other choices.
- Quota is product-consumption limit per defined period, not model tokens or tool calls.
- Exactly 1 Base Suit per user, + 0..N Additional Suits.
- Base membership upgrades replace previous Base Suit, not stack two Base Suits.
- Free Suit is system default, cannot be deleted; its item configuration may change.
- Catalog Item definitions are initialized by backend/code and read-only in admin.
- Entitlement Suits are admin-configurable; Catalog is not admin-editable.
- Client and business services consume Effective Entitlement, NEVER infer access from SKU/Order/isMember boolean.
- Order != Entitlement Grant. A nonpurchase source may issue a Grant.
- Upgrading commercial semantics in baseline: close old membership + start new membership with new billing cycle; settlement of remaining old value remains undefined.
- Disabling Product/SKU stops new sale/display but does not revoke issued Orders/Grants.

### Current MVP entitlement items recorded in Working Definition
- Course Access: scope YouTube / Free Content / ALL; checked when Start clicked.
- World Tour Access: Free Content / ALL; checked at Start.
- Training Program Access: Free Content / ALL; checked at Select.
- Dynamic Plan: ALL; check at Activate Plan, NOT at discussion/preview.
- AI Coach Chat: Text / Image / Live; measured by user-visible User Turn / Cycle; all user-initiated requests consume one user-turn quota, regardless of AI intent; do not count internal LLM/tool calls.
- Workout Result AI Insight: separately gated AI analysis; base workout data + RPE remain available.
- Weekly Report AI Insight: separately gated AI analysis; base week data and fixed-format summary remain available.

### Current admin IA from Working Definition
SunnyFit Admin
  Commercialization
    Entitlement Management
      Entitlement Catalog (READ ONLY)
      Entitlement Suits (CRUD/configure, subject to system constraints)
    Product Management
      Products
        Product Detail
          Basic Information
          Upgrade Rule
          SKUs (nested, no separate first-level SKU menu)
    Order Management (concept; detail not yet formally specified)

Entitlement Suit list: name/code, type Base|Additional, item count, Used By, status Active|Disabled, updated, Configure; search/filter.
Suit form: name, immutable code, type, status, description, add/remove item, multiselect Scope, Quota per item's definition. Disable save for invalid combinations; preserve Free Suit.
Product: name, immutable code, linked Suit, active/disabled, description, allowed upgrade-from products.
SKU: name/code, channel Apple|Google|Web, store product ID, billing period, price/currency, effective duration, gift duration (only extends same Suit), active/disabled.

## 3. Explicitly separate newer Credits strategy from the baseline
Do NOT overload Entitlement Quota to pretend it IS a Credits wallet. Credits are a potential separate value balance and spending ledger, with their own issuance, consumption, adjustments and refund events. This is a PROPOSED architecture for prototyping and requires Owner confirmation.

Recommended prototype interfaces (provisional):
- CreditWallet: user, balances by credit category/expiration bucket if later needed, summary.
- CreditTransaction: id, user, type GRANT|SPEND|REFUND|ADJUST|EXPIRE, amount, source, service/event ref, timestamp, idempotency key.
- CreditServiceCatalog: a configurable demonstration list of personalized services with prices in Credits (prices are SAMPLE values, no approved production prices).
- Access decision: entitlement-based feature permission and consumable-credit affordability must be evaluated independently.
- Subscription purchase: issues/replaces Base Suit via Grant; optionally issues complimentary Credits through an auditable transaction.
- Paid personalized service: check eligibility + Credits balance, confirm price, spend exactly once (idempotency), generate demo output and record transaction.
- Featured content: confirm Credits cost; redemption makes durable user-content access record; do not accidentally consume Credits again when replaying an already redeemed item.
- Legacy Star redemption: seed a fixture with a previously redeemed item; continue access without re-purchase; exact migration mapping unapproved.
- Cancellation/expiration: demonstrate switch to Free Base Suit while existing separately acquired Featured access remains in fixture; precise real policy still open.

## 4. Frontend prototype focus — realistic V3.0 style
Reuse Figma style, not invent a replacement design language. In the prototype, use mobile-responsive English UI following existing card hierarchy, fonts, spacing, CTA behavior where observable. Document deviations when Figma cannot be read.

Primary screens/states:
1. Profile / Account: current Free or Premium tier, current credit balance, membership/access summary, upgrade/manage entry. Show entitlement and wallet as different concepts.
2. Course/World Tour/Training Program cards: Free/Premium/Featured labels as applicable; no mismatched badges. Detail and Start/Select paths must perform appropriate checks. Featured redemption has price, confirmation, successful unlock, already-unlocked states.
3. Membership comparison + upgrade screen: Free vs Premium capability distinction; bundled Credits only shown as configured sample; simulated purchase, success, expiration/upgrade outcomes; never imply real Apple/Google billing.
4. AI Chat: user-turn entitlement quota path; insufficient-turn state; separate proposed Credits service call insufficiency state; show proper Upgrade or Get Credits CTA depending on which check failed.
5. Dynamic Plan: preview remains possible when applicable; Activate Plan checks entitlement; Free gate + Upgrade CTA per discussion. Do not falsely treat preview as activation.
6. Weekly Report and Workout Result: base stats remain, AI Insight block may be access-gated, with meaningful explanation of added value.
7. Credits wallet / history: balance, spending, grants and redemptions, insufficient balance, duplicate-click protection.
8. Demo control panel (developer-only): switch users, change current membership, seed credit balance/legacy redemptions, trigger expiration and reproduce edge cases. This is test tooling, not product UI.

Prototype scenarios to verify:
- Free user starts free course successfully.
- Free user opens Premium course: sees rationale + upgrade, no access on Start.
- Premium user accesses Premium course.
- Free user or member redeems Featured course with sufficient Credits; replay is free after redemption.
- Insufficient Credits blocks Featured redemption and shows replenishment path.
- Old Star redeemed user can access grandfathered item.
- AI Chat quota uses user turns, internal tool calls do not multiply quota.
- Dynamic Plan preview != Activate Plan.
- Workout Result / Weekly Report base data works without AI Insight.
- Membership upgraded: Base Suit replaced, Additional Suit remains; Effective Entitlement recalculated.
- Expiration: downgrade to Free while preserving durable independent redemptions.
- Duplicate POST retries never double-spend Credits or double-grant subscription benefits.

## 5. Backend mock service recommended design
Goal: runnable end-to-end local demo with durable, inspectable state, NOT checkout production infrastructure.
Suggested stack: Vite + React + TypeScript frontend; Node.js + TypeScript API (Fastify or Express); SQLite with ORM or simple persistence; shared TypeScript schemas; pnpm/npm install and run scripts. Framework can be adapted to repository constraints.

Core entities:
- User / UserMembership
- EntitlementItem / EntitlementSuit / SuitItemSpec / EntitlementGrant
- EffectiveEntitlement (computed read-model)
- Product / SKU / Order (simulated)
- Content / ContentTier / ContentRedemption
- CreditWallet / CreditTransaction / CreditServiceCatalog (PROPOSAL)
- UsageLedger for User Turn quotas
- FeatureAccessDecision/AuditEvent for traceability

Minimum API families:
GET /api/demo/users; POST /api/demo/select-user; POST /api/demo/reset
GET /api/entitlements/catalog; GET/POST/PUT /api/entitlements/suits; GET /api/users/:id/effective-entitlements
GET/POST/PUT /api/products; GET/POST/PUT /api/products/:id/skus
POST /api/demo/purchase (simulated order -> grant); POST /api/demo/expire-membership
GET /api/content; GET /api/content/:id; POST /api/content/:id/access-check; POST /api/content/:id/redeem
GET /api/users/:id/credits; GET /api/users/:id/credit-transactions; POST /api/credits/services/:id/purchase
POST /api/ai-chat/turn; POST /api/plans/:id/activate; GET /api/reports/weekly; GET /api/workout-results/:id

State-changing actions should all be backend-authoritative, idempotent and transactional where relevant. Validate amounts, enforce access checks, produce readable reason codes and simulated audit logs. Never treat the frontend state as authoritative.

## 6. Known open points — do not silently decide product policy
- Has the Credits-based model been approved and written to SA Canonical PRD/Decision Log? Not verified.
- Is Credits a distinct currency from legacy Points/Stars? Conversion, balances, pricing, legal expiry/refund rules unspecified.
- Exact Premium price, subscription periods, gifted Credits volume and cadence: not confirmed.
- Exact AI personalized services priced in Credits vs included by membership: not confirmed.
- Whether Premium grants all Premium content and Featured always costs Credits: discussion candidate.
- Existing Star redemptions: historic storage, mapping, grandfathering horizon and entitlement representation: not defined.
- Dynamic Plan Free/Premium behavior, expiration behavior and entitlement policy: not finalized for new commercial scheme.
- Quota reset, additional Suit merging, active Grant when Suit changes, refunds, settlement, store channel of record: explicitly open in PRDs.
- Real API implementation, current production capability, and launch status NOT established by these documents.

For prototype: create clearly named configurable DEMO ASSUMPTIONS in seed/config file; label all fake numeric prices, Credit amounts, expiry durations, quota thresholds as SAMPLE ONLY. Put them in one place and add a list of unapproved decisions to README. Don't hardcode hypotheses across frontend/backend.

## 7. Delivery & acceptance criteria for Codex
Deliver an actual executable code repository with:
- frontend + backend + shared schemas; dependency lockfile, .env.example, README, seed/reset scripts
- example seed personas: Free, Premium, low-Credits, insufficient Chat quota, Featured redeemed, legacy Star redeemed
- real HTTP APIs for every user-facing action; no decorative buttons
- admin console connected to same API/state as mobile UI
- state machine/decision explanation and robust failure/loading/empty states
- focused unit/integration tests for entitlement resolver, Base Suit replacement, Scope ALL mutual exclusion, grant vs order, credit idempotency, redemption persistence, quota counting, and expiration
- demo walkthrough and test commands
- no production payments, no real credential handling, no real AI model required. Stub AI services with realistic mock results, not hallucinated backend integration.

Suggested execution stages:
A. Inspect existing repo, relevant Figma nodes, authoritative documentation and identify contradictions; report a short plan.
B. Implement backend entities, seeded fixtures, access evaluator, mutation endpoints and tests.
C. Build the admin pages and verify configuration influences Effective Entitlement.
D. Build the consumer app screens based on V3.0 Figma and wire real API.
E. Test all defined end-to-end scenarios, repair, and document demo constraints.

Keep prototype practical. Prioritize fidelity of business state transitions over decorative UI or premature large architecture.
