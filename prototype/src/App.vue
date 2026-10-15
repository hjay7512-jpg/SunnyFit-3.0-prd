<template><div><component :is="reviewBar" v-if="reviewBar" /><router-view /></div></template>
<script>
export default { name: 'App', computed: { reviewBar() { return process.env.VUE_APP_DEMO_RUNTIME === 'browser' ? () => import('./demo/PagesReviewBar') : null } } }
</script>
