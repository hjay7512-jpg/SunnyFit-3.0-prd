const item = (code, name, category, scopes, checkAt, description, metering = 'none') => ({
  code, name, category, scopes, checkAt, description, metering,
  quotaDefinition: { type: 'unlimited', label: metering === 'credits' ? 'Credits consumption; no separate turn quota' : 'Unlimited' },
  status: 'supported'
})
const all = [{ code: 'all', label: 'ALL' }]
module.exports = [
  item('course_access', 'Course Access', 'Content Access', [{ code: 'youtube', label: 'YouTube' }, { code: 'free_content', label: 'Free Content' }, ...all], 'Start', 'Access enabled courses within the configured content pool. Featured redemption is checked independently.'),
  item('world_tour_access', 'World Tour Access', 'Content Access', [{ code: 'free_content', label: 'Free Content' }, ...all], 'Start', 'Access enabled World Tour workouts within the configured scope.'),
  item('training_program_access', 'Training Program Access', 'Content Access', [{ code: 'free_content', label: 'Free Content' }, ...all], 'Select', 'Select enabled Training Programs within the configured scope.'),
  item('dynamic_plan', 'Dynamic Plan', 'Personalized / AI', all, 'Activate Plan', 'Activation checks this entitlement. Reading an existing plan is a separate operation; new LLM work consumes Credits.', 'credits'),
  item('ai_coach_chat', 'AI Coach Chat', 'Personalized / AI', [{ code: 'text', label: 'Text' }, { code: 'image', label: 'Image' }, { code: 'live', label: 'Live' }, ...all], 'Send', 'Scope controls chat capabilities. New LLM requests consume Credits; reading saved conversations does not.', 'credits'),
  item('workout_result_ai_insight', 'Workout Result AI Insight', 'Personalized / AI', all, 'Generate / Regenerate', 'Base workout results remain available. New AI analysis requires feature access and Credits; saved insight remains readable.', 'credits'),
  item('weekly_report_ai_insight', 'Weekly Report AI Insight', 'Personalized / AI', all, 'Generate / Regenerate', 'Base weekly statistics remain available. New AI analysis requires feature access and Credits; saved reports remain readable.', 'credits')
]
