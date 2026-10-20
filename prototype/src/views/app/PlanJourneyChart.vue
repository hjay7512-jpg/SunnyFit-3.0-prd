<template>
  <figure class="plan-journey">
    <svg viewBox="0 0 300 238" role="img" :aria-label="'Training stages: '+stages.map(stage=>stage.name+', '+stage.period).join('; ')">
      <path d="M8 174C50 173 73 166 102 145V220H8Z" fill="#f8eddb"/>
      <path d="M102 145C134 120 156 111 200 106V220H102Z" fill="#e5eafa"/>
      <path d="M200 106C229 102 263 85 287 57V220H200Z" fill="#fce4e1"/>
      <path d="M8 220V35m-2 3 2-3 2 3M8 220H292m-3-2 3 2-3 2" stroke="#b0b7c4" stroke-width="1" fill="none"/>
      <path d="M102 145V220" stroke="#cfb58a" stroke-width="1" stroke-dasharray="2 3"/>
      <path d="M200 106V220" stroke="#a0afd3" stroke-width="1" stroke-dasharray="2 3"/>
      <path d="M8 174C50 173 73 166 102 145" stroke="#e4c79c" stroke-width="3.2" fill="none" stroke-linecap="round"/>
      <path d="M102 145C134 120 156 111 200 106" stroke="#586fae" stroke-width="3.2" fill="none" stroke-linecap="round"/>
      <path d="M200 106C229 102 263 85 287 57" stroke="#ef242b" stroke-width="3.2" fill="none" stroke-linecap="round"/>
      <path d="m-4-4 9 4-9 4Z" transform="translate(102 145) rotate(-33)" stroke="#d3b489" stroke-width="1.5" fill="#fff" stroke-linejoin="round"/>
      <path d="m-4-4 9 4-9 4Z" transform="translate(200 106) rotate(-12)" stroke="#586fae" stroke-width="1.5" fill="#fff" stroke-linejoin="round"/>
      <path d="m-5-4 10 4-10 4Z" transform="translate(287 57) rotate(-43)" stroke="#ef242b" stroke-width="1.5" fill="#fff" stroke-linejoin="round"/>
      <text x="23" y="134" class="plan-journey__name">{{ stages[0].name }}</text>
      <text x="126" y="92" class="plan-journey__name">{{ stages[1].name }}</text>
      <text x="248" y="38" text-anchor="middle" class="plan-journey__name"><tspan x="248">{{ lastName[0] }}</tspan><tspan v-if="lastName[1]" x="248" dy="16">{{ lastName[1] }}</tspan></text>
      <text x="54" y="190" text-anchor="middle" class="plan-journey__period plan-journey__period--first"><tspan x="54">3–7</tspan><tspan x="54" dy="17">days</tspan></text>
      <text x="151" y="190" text-anchor="middle" class="plan-journey__period plan-journey__period--second"><tspan x="151">2–3</tspan><tspan x="151" dy="17">weeks</tspan></text>
      <text x="248" y="190" text-anchor="middle" class="plan-journey__period plan-journey__period--last"><tspan x="248">From</tspan><tspan x="248" dy="17">week 4</tspan></text>
    </svg>
  </figure>
</template>
<script>
export default {name:'PlanJourneyChart',props:{stages:{type:Array,required:true}},computed:{lastName(){return this.stages[2].name.split(' ')}}}
</script>
<style scoped>
.plan-journey{margin:4px 0 0}.plan-journey svg{display:block;width:100%;overflow:visible}.plan-journey text{font-family:var(--sf-font-family)}.plan-journey__name{font-size:15px;font-weight:600;fill:var(--sf-text)}.plan-journey__period{font-size:14px;font-weight:450}.plan-journey__period--first{fill:#a5793e}.plan-journey__period--second{fill:#4c6196}.plan-journey__period--last{fill:#d82631}
</style>
