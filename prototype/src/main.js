import Vue from 'vue'
import ElementUI from 'element-ui'
import locale from 'element-ui/lib/locale/lang/en'
import 'element-ui/lib/theme-chalk/index.css'
import './styles/index.css'
import App from './App.vue'
import router from './router'
import store from './store'
import {initializeDemoAiMotion} from './demo/ai-motion'

Vue.use(ElementUI, { locale, size: 'small' })
Vue.config.productionTip = false
if (process.env.VUE_APP_DEMO_RUNTIME === 'browser') document.documentElement.classList.add('pages-review-host')
initializeDemoAiMotion()
new Vue({ router, store, render: h => h(App) }).$mount('#app')
