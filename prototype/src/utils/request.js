import axios from 'axios'
import { Message } from 'element-ui'

// Replace this adapter with the host project's request utility when migrating.
// Business components keep the normal request({ url, method, data }) contract.
const service = axios.create({ baseURL: process.env.VUE_APP_BASE_API || '/api', timeout: 15000 })
if (process.env.VUE_APP_DEMO_RUNTIME === 'browser') {
  service.defaults.adapter = config => import('@/demo/pages-adapter').then(module => module.default(config))
}
service.interceptors.response.use(response => response.data.data, error => {
  const body = error.response && error.response.data
  error.reason = body && body.reason
  error.fields = (body && body.fields) || []
  error.message = body && body.message ? body.message : 'Unable to reach the API. Check the local service and retry.'
  Message({ message: error.message, type: 'error', duration: 5000 })
  return Promise.reject(error)
})
export default service
