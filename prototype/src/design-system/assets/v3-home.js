import manifest from '../../../public/assets/figma/v3/home/manifest.json'
export function homeAsset(name) {
  if (!manifest[name]) throw Error('Unknown formal Home asset: '+name)
  return '/assets/figma/v3/home/'+manifest[name].file
}
export const homeNavigation = [
  {value:'home',label:'Home',action:'home',icon:homeAsset('imgFrame')},
  {value:'workout',label:'Workout',action:'workout',icon:homeAsset('imgFrame1')},
  {value:'challenge',label:'Challenge',action:'existing-challenge',icon:homeAsset('imgGroup')},
  {value:'social',label:'Social',action:'existing-social',icon:homeAsset('imgFrame2')}
]
