// Sample policy values only; the six owner-confirmed rules are enforced in services.
module.exports = {
  quoteMinutes: 5,
  reservationMinutes: 10,
  // Demo quantities only. These are service actions, separate from the Credits wallet.
  includedServices: [
    { serviceId: 'ai_chat', amount: 30, period: 'monthly', allowOverage: true },
    { serviceId: 'deep_analysis', amount: 2, period: 'monthly', allowOverage: true },
    { serviceId: 'weekly_insight', amount: 1, period: 'weekly', allowOverage: false },
    { serviceId: 'plan_preview', amount: 2, period: 'monthly', allowOverage: true }
  ],
  products: [
    { id: 'premium_monthly', name: 'Premium · Monthly', code: 'premium_monthly', kind: 'membership', suitId: 'premium', upgradeRule: 'next_cycle', credits: { amount: 0, validityDays: 30 }, skus: [{ id: 'premium_monthly_web', channel: 'web_demo', storeCode: 'sunnyfit.premium.monthly', priceCents: 999, currency: 'USD', durationDays: 30, billingPeriod: 'monthly', status: 'active' }] },
    { id: 'premium_annual', name: 'Premium · Annual', code: 'premium_annual', kind: 'membership', suitId: 'premium', upgradeRule: 'next_cycle', credits: { amount: 0, validityDays: 30 }, skus: [{ id: 'premium_annual_web', channel: 'web_demo', storeCode: 'sunnyfit.premium.annual', priceCents: 7999, currency: 'USD', durationDays: 365, billingPeriod: 'annual', status: 'active' }] },
    { id: 'credits_starter', name: '40 Credits', code: 'credits_starter', kind: 'credits', suitId: null, upgradeRule: 'not_allowed', credits: { amount: 40, validityDays: null }, skus: [{ id: 'credits_starter_web', channel: 'web_demo', storeCode: 'sunnyfit.credits.40', priceCents: 499, currency: 'USD', durationDays: 0, status: 'active' }] },
    { id: 'credits_value', name: '100 Credits', code: 'credits_value', kind: 'credits', suitId: null, upgradeRule: 'not_allowed', credits: { amount: 100, validityDays: null }, skus: [{ id: 'credits_value_web', channel: 'web_demo', storeCode: 'sunnyfit.credits.100', priceCents: 999, currency: 'USD', durationDays: 0, status: 'active' }] }
  ],
  services: [
    { id: 'ai_chat', name: 'AI Coach · Text', code: 'ai_chat', entitlementCode: 'ai_coach_chat', scope: 'text', credits: 2 },
    { id: 'ai_image', name: 'AI Coach · Image', code: 'ai_image', entitlementCode: 'ai_coach_chat', scope: 'image', credits: 4 },
    { id: 'deep_analysis', name: 'Deep Data Analysis', code: 'deep_analysis', entitlementCode: 'workout_result_ai_insight', scope: 'all', credits: 8 },
    { id: 'weekly_insight', name: 'Weekly Report AI Insight', code: 'weekly_insight', entitlementCode: 'weekly_report_ai_insight', scope: 'all', credits: 6 },
    { id: 'plan_preview', name: 'Plan Discussion / Preview', code: 'plan_preview', entitlementCode: 'ai_coach_chat', scope: 'text', credits: 3 },
    { id: 'plan_activate', name: 'Activate Saved Plan', code: 'plan_activate', entitlementCode: 'dynamic_plan', scope: 'all', credits: 0 }
  ],
  contents: [
    { id: 'course_free', name: 'Morning Mobility', code: 'morning_mobility', contentType: 'course', tier: 'free', entitlementCode: 'course_access', redemptionCredits: 0, redemptionValidityDays: null, durationMinutes: 15, members: [], description: 'A gentle mobility course in the Free content pool.' },
    { id: 'course_premium', name: 'Strength Foundations', code: 'strength_foundations', contentType: 'course', tier: 'premium', entitlementCode: 'course_access', redemptionCredits: 0, redemptionValidityDays: null, durationMinutes: 25, members: [], description: 'Premium training. Access is checked each time a new workout starts.' },
    { id: 'course_featured', name: 'The Signature Strength Session', code: 'signature_strength', contentType: 'course', tier: 'featured', entitlementCode: 'course_access', redemptionCredits: 30, redemptionValidityDays: null, durationMinutes: 30, members: [], description: 'A curated session unlocked separately with Credits.' },
    { id: 'world_free', name: 'California Coast', code: 'california_coast', contentType: 'world_tour', tier: 'free', entitlementCode: 'world_tour_access', redemptionCredits: 0, redemptionValidityDays: null, durationMinutes: 20, members: [], description: 'A scenic ride available in the Free pool.' },
    { id: 'world_premium', name: 'Alpine Sunrise', code: 'alpine_sunrise', contentType: 'world_tour', tier: 'premium', entitlementCode: 'world_tour_access', redemptionCredits: 0, redemptionValidityDays: null, durationMinutes: 35, members: [], description: 'Premium scenic workout; an eligible Additional suit can also grant access.' },
    { id: 'world_featured', name: 'Northern Lights Ride', code: 'northern_lights', contentType: 'world_tour', tier: 'featured', entitlementCode: 'world_tour_access', redemptionCredits: 35, redemptionValidityDays: null, durationMinutes: 30, members: [], description: 'Featured scenic content with an independent redemption.' },
    { id: 'program_starter', name: 'Getting Started Program', code: 'starter_program', contentType: 'training_program', tier: 'free', entitlementCode: 'training_program_access', redemptionCredits: 0, redemptionValidityDays: null, durationMinutes: 40, members: ['course_free', 'course_premium'], description: 'Start your included workouts through this Program with no additional unlock.' },
    { id: 'program_featured', name: 'Signature Training Program', code: 'signature_program', contentType: 'training_program', tier: 'featured', entitlementCode: 'training_program_access', redemptionCredits: 50, redemptionValidityDays: null, durationMinutes: 65, members: ['course_featured', 'course_premium'], description: 'Unlock this Program and follow all included workouts without another course purchase.' }
  ]
}
