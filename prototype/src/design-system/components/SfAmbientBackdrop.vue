<template><div class="sf-ambient-backdrop" aria-hidden="true"><img :src="asset('imgEllipse401')" class="sf-ambient-backdrop__first" data-source-asset="true"><div class="sf-ambient-backdrop__second"><img :src="asset('imgEllipse402')" data-source-asset="true"></div><div class="sf-ambient-backdrop__third"><img :src="asset('imgEllipse403')" data-source-asset="true"></div><img :src="asset('imgEllipse404')" class="sf-ambient-backdrop__fourth" data-source-asset="true"><template v-if="extended"><img v-for="(name,i) in ['imgEllipse405','imgEllipse406','imgEllipse407']" :key="name" :src="asset(name)" class="sf-ambient-backdrop__lower" :style="{left:(-230.891+i*189.97)+'px'}" data-source-asset="true"></template></div></template>
<script>
import {homeAsset} from '../assets/v3-home'
export default {name:'SfAmbientBackdrop',props:{asset:{type:Function,default:homeAsset},extended:Boolean}}
</script>
