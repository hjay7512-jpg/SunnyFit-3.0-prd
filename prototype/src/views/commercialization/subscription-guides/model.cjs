// Prototype-only subscription guidance model. Contract: V3.0.0 §4.1.
// This content is display configuration, not an entitlement or store-offer source.
const LOCALES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'it', label: 'Italiano' },
  { code: 'zh-CN', label: '简体中文' }
]
const BENEFITS = [
  { id: 'content', label: 'Content', headline: 'More ways to move', description: 'Explore more workouts, World Tours, and Training Programs.' },
  { id: 'plan', label: 'Plan', headline: 'A plan that moves with you', description: 'Activate a personalized Dynamic Plan and build your routine.' },
  { id: 'ai_insight', label: 'AI Insights', headline: 'Understand your progress', description: 'Get personalized insights from workouts and weekly reports.' },
  { id: 'ai_chat', label: 'AI Chat', headline: 'Your coach, always in reach', description: 'Talk to AI Coach with the credits available on your account.' }
]
const SECTION_IDS = ['comparison', 'details', 'faq']
const IMAGE_SIZES = { detail: { width: 750, height: 375 }, banner: { width: 750, height: 320 } }
const clone = value => JSON.parse(JSON.stringify(value))
const languageText = (value, locale = 'en') => value && (value[locale] || value.en || '') || ''
const textMap = en => ({ en })
const escapeXml = value => String(value || '').replace(/[<>&"']/g, letter => ({ '<':'&lt;', '>':'&gt;', '&':'&amp;', '"':'&quot;', "'":'&apos;' }[letter]))
function placeholder(kind, label, index = 0) {
  const { width, height } = IMAGE_SIZES[kind]
  const shades = [['#223b67','#6487b2'],['#344f63','#7caea8'],['#473a69','#9385c1'],['#66514c','#c4988b']]
  const colors = shades[index % shades.length]
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + height + '" viewBox="0 0 ' + width + ' ' + height + '"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="' + colors[0] + '"/><stop offset="1" stop-color="' + colors[1] + '"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><circle cx="' + Math.round(width * .83) + '" cy="' + Math.round(height * .33) + '" r="' + Math.round(height * .48) + '" fill="#ffffff" fill-opacity=".09"/><circle cx="' + Math.round(width * .68) + '" cy="' + Math.round(height * .75) + '" r="' + Math.round(height * .45) + '" fill="#ffffff" fill-opacity=".06"/><text x="36" y="' + Math.round(height * .78) + '" fill="#fff" font-family="Arial,sans-serif" font-size="23" opacity=".9">' + escapeXml(label) + '</text></svg>'
  return { src: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg), width, height, demo: true }
}
const exampleRow = (id, title, freeOn, premiumOn, freeDesc = '', premiumDesc = '') => ({
  id, name: textMap(title),
  free: { enabled: freeOn, description: textMap(freeDesc) },
  premium: { enabled: premiumOn, description: textMap(premiumDesc) }
})
function seed(catalog = []) {
  const scenes = {}
  catalog.filter(item => item.type !== 'consumable_credits' && item.category !== 'Consumable Credits').forEach((item, index) => {
    scenes[item.code] = {
      banner: placeholder('banner', 'SunnyFit Premium', index),
      title: textMap('Unlock more with Premium'),
      description: textMap('Get more from ' + item.name + ' with a SunnyFit Premium subscription.')
    }
  })
  return {
    schemaVersion: 1,
    enabledLocales: ['en'],
    membership: {
      comparison: {
        enabled: true, sort: 300, title: textMap('Compare Free & Premium'),
        rows: [
          exampleRow('content', 'Workout content', true, true, 'Selected free workouts', 'More workouts and programs'),
          exampleRow('plan', 'Dynamic Plan', false, true, '', 'Personalized plan activation'),
          exampleRow('insight', 'AI Insights', false, true, '', 'Workout and weekly insights'),
          exampleRow('chat', 'AI Coach Chat', true, true, 'Available credits', 'Available Premium credits')
        ]
      },
      details: {
        enabled: true, sort: 200, title: textMap('Explore your Premium benefits'),
        benefits: BENEFITS.map((item, index) => ({
          id: item.id,
          name: textMap(item.label), headline: textMap(item.headline),
          description: textMap(item.description),
          image: placeholder('detail', item.label, index)
        }))
      },
      faq: {
        enabled: true, sort: 100, title: textMap('Questions & Answers'),
        rows: [
          { id: 'cancel', question: textMap('Can I cancel anytime?'), answer: textMap('Manage your subscription through the App Store or Google Play.') },
          { id: 'restore', question: textMap('How do I restore a purchase?'), answer: textMap('Use Restore Purchases on the membership page.') }
        ]
      }
    },
    scenes
  }
}
function reconcile(snapshot, catalog = []) {
  const target = snapshot && snapshot.schemaVersion === 1 ? clone(snapshot) : seed(catalog)
  if (!Array.isArray(target.enabledLocales)) target.enabledLocales = ['en']
  target.enabledLocales = ['en', ...target.enabledLocales.filter(code => code !== 'en' && LOCALES.some(locale => locale.code === code))]
  const initial = seed(catalog)
  if (!target.membership) target.membership = initial.membership
  for (const id of SECTION_IDS) if (!target.membership[id]) target.membership[id] = initial.membership[id]
  if (!target.scenes) target.scenes = {}
  for (const [code, value] of Object.entries(initial.scenes)) if (!target.scenes[code]) target.scenes[code] = value
  return target
}
function checkText(errors, path, value, max, required) {
  const content = typeof value === 'string' ? value.trim() : ''
  if (required && !content) errors.push(path + ': required')
  else if (content.length > max) errors.push(path + ': exceeds ' + max + ' characters')
}
function checkImage(errors, path, image, expected) {
  if (!image || !image.src) { errors.push(path + ': image required'); return }
  if (image.width !== expected.width || image.height !== expected.height) {
    errors.push(path + ': required dimensions ' + expected.width + ' × ' + expected.height)
  }
}
function validate(input) {
  const errors = []
  const data = input || {}
  const locales = Array.isArray(data.enabledLocales) ? data.enabledLocales : ['en']
  if (!locales.includes('en')) errors.push('Languages: English is the required base locale')
  for (const section of SECTION_IDS) {
    const module = data.membership && data.membership[section]
    if (!module) { errors.push(section + ': missing section'); continue }
    if (!Number.isInteger(module.sort)) errors.push(section + ' sort: integer required')
    if (!module.enabled) continue
    for (const locale of locales) {
      checkText(errors, section + ' / ' + locale + ' / title', module.title && module.title[locale], 30, section !== 'faq')
      if (section === 'comparison') {
        ;(module.rows || []).forEach((row, index) => {
          checkText(errors, 'comparison row ' + (index + 1) + ' / ' + locale + ' / name', row.name && row.name[locale], 20, true)
        })
      }
      if (section === 'details') {
        for (const definition of BENEFITS) {
          const item = (module.benefits || []).find(benefit => benefit.id === definition.id)
          if (!item) { errors.push('details / ' + definition.id + ': required fixed benefit'); continue }
          checkText(errors, 'details / ' + definition.id + ' / ' + locale + ' / name', item.name && item.name[locale], 20, true)
          checkText(errors, 'details / ' + definition.id + ' / ' + locale + ' / headline', item.headline && item.headline[locale], 30, true)
          checkText(errors, 'details / ' + definition.id + ' / ' + locale + ' / description', item.description && item.description[locale], 120, true)
        }
      }
      if (section === 'faq') {
        ;(module.rows || []).forEach((row, index) => {
          const question = row.question && row.question[locale]
          const answer = row.answer && row.answer[locale]
          checkText(errors, 'Q&A ' + (index + 1) + ' / ' + locale + ' / question', question, 50, !!(answer || '').trim())
          checkText(errors, 'Q&A ' + (index + 1) + ' / ' + locale + ' / answer', answer, 300, !!(question || '').trim())
        })
      }
    }
    if (section === 'details') for (const definition of BENEFITS) {
      const item = (module.benefits || []).find(benefit => benefit.id === definition.id)
      if (item) checkImage(errors, 'details / ' + definition.id, item.image, IMAGE_SIZES.detail)
    }
  }
  for (const [code, scene] of Object.entries(data.scenes || {})) {
    checkImage(errors, 'scenario / ' + code + ' / banner', scene.banner, IMAGE_SIZES.banner)
    for (const locale of locales) {
      checkText(errors, 'scenario / ' + code + ' / ' + locale + ' / title', scene.title && scene.title[locale], 30, true)
      checkText(errors, 'scenario / ' + code + ' / ' + locale + ' / description', scene.description && scene.description[locale], 120, true)
    }
  }
  return errors
}
function projectMembership(config, locale = 'en') {
  const membership = config.membership
  return SECTION_IDS.map(id => ({ id, ...membership[id] }))
    .filter(section => section.enabled)
    .sort((a, b) => b.sort - a.sort || SECTION_IDS.indexOf(a.id) - SECTION_IDS.indexOf(b.id))
    .map(section => {
      if (section.id === 'comparison') return { id: section.id, title: languageText(section.title, locale), rows: section.rows.map(row => ({
        id: row.id, name: languageText(row.name, locale),
        free: { enabled: !!row.free.enabled, ...(languageText(row.free.description, locale) ? { description: languageText(row.free.description, locale) } : {}) },
        premium: { enabled: !!row.premium.enabled, ...(languageText(row.premium.description, locale) ? { description: languageText(row.premium.description, locale) } : {}) }
      })) }
      if (section.id === 'details') return { id: section.id, title: languageText(section.title, locale), benefits: BENEFITS.map(item => {
        const value = section.benefits.find(benefit => benefit.id === item.id)
        return { id: item.id, name: languageText(value.name, locale), headline: languageText(value.headline, locale), description: languageText(value.description, locale), image: value.image && value.image.src }
      }) }
      return { id: section.id, title: languageText(section.title, locale), rows: section.rows.filter(row => languageText(row.question, locale) && languageText(row.answer, locale)).map(row => ({
        id: row.id, question: languageText(row.question, locale), answer: languageText(row.answer, locale)
      })) }
    })
}
function projectScene(config, code, locale = 'en') {
  const scene = config.scenes[code]
  return scene ? { entitlementCode: code, banner: scene.banner && scene.banner.src, title: languageText(scene.title, locale), description: languageText(scene.description, locale) } : null
}
module.exports = { LOCALES, BENEFITS, SECTION_IDS, IMAGE_SIZES, clone, languageText, seed, reconcile, validate, projectMembership, projectScene }
