// Menu labels come from the existing designs. This module defines navigation only.
const formal = node => 'https://www.figma.com/design/2AT0tm9mkFhes8T81YzA2L/V3.0?node-id='+node.replace(':','-')
const alpha = node => 'https://www.figma.com/design/t7g261XYs61EdvYzIZn5YL/V3.0-Alpha?node-id='+node.replace(':','-')
const original = (id,label,nodeId,extra={}) => ({id,label,nodeId,url:alpha(nodeId),...extra})
const setting = (id,label,nodeId) => ({id,label,nodeId,url:formal(nodeId)})

export const profileScreens = ['devices','community','settings','support','invite','equipment-shop']
export const profileMenus = {
  devices:[original('my-equipment','My Equipment','243:662'),original('health-app','Health App','243:673'),original('shop','Shop Sunny Equipment','243:687',{target:'equipment-shop'})],
  community:[original('snaps','Snaps','243:631'),original('ranking','Ranking','243:627'),setting('privacy','Privacy Settings','6977:11276')],
  support:[original('guide','Beginner Guide','243:702'),original('faq','FAQs','243:715'),original('supported-equipment','Support Equipment','243:733'),original('contact','Contact Us','243:742')],
  // Complete existing Settings variant, verified by its screenshot. Home's
  // 7694:8502 variant has an overlapping “Share your week” button; do not mix it in.
  settings:[setting('my-profile','My Profile','6977:11273'),setting('my-account','My Account','6977:11274'),setting('preferences','My Preferences','6977:11275'),setting('privacy','Privacy Settings','6977:11276'),setting('language','Language','6977:11277'),setting('units','Unit Setting','6977:11278'),setting('notifications','Push Notification Setting','6977:11279'),setting('legal','User Agreement and Privacy Policy','6977:11280'),setting('cache','Clear Cache','6977:11281'),setting('update','Update','6977:11282'),setting('about','About','6977:11283')],
  preferences:[setting('fitness-goal','My Fitness Goal','6977:11124'),setting('max-heart-rate','My Max Heart Rate','6977:11125')]
}
export const profileTitles = {devices:'Devices & Health',community:'Community & Privacy',settings:'Settings',support:'Help & Support',invite:'Invite friends, earn rewards','equipment-shop':'Shop Sunny Equipment'}
export function profileTitle(screen,section,item){
  const menu=profileMenus[section==='preferences'?'preferences':screen]||[]
  return (menu.find(row=>row.id===item)||{}).label||(section==='preferences'?'My Preferences':profileTitles[screen])
}
export const fitnessGoals = ['Weight Loss','Build Muscle','Health & Vitality','Rehab & Stretch']
export const profileResources = {
  app:'https://sunnyhealthfitness.com/pages/app',
  shop:'https://sunnyhealthfitness.com',
  guide:'https://support.sunnyhealthfitness.com/hc/en-us/sections/8381492734619-SunnyFit-App',
  faq:'https://sunnyhealthfitness.com/pages/sunnyfit-app-faq',
  equipment:'https://cdn.shopify.com/s/files/1/0052/7043/7978/files/SunnyBT_compatible_products.pdf',
  privacy:'https://sunnyhealthfitness.com/pages/privacy-policy',
  terms:'https://sunnyhealthfitness.com/pages/terms-of-use',
  contact:'mailto:support@sunnyfit.com'
}
