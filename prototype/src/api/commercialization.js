import request from '@/utils/request'
const base = '/commercialization'
export const getCatalog = () => request({ url: `${base}/catalog`, method: 'get' })
export const getCatalogItem = code => request({ url: `${base}/catalog/${encodeURIComponent(code)}`, method: 'get' })
export const getSuits = params => request({ url: `${base}/suits`, method: 'get', params })
export const getSuit = id => request({ url: `${base}/suits/${id}`, method: 'get' })
export const createSuit = data => request({ url: `${base}/suits`, method: 'post', data })
export const saveSuit = (id, config, revision) => request({ url: `${base}/suits/${id}`, method: 'put', data: { config, revision } })
export const previewSuit = (id, config) => request({ url: `${base}/suits/${id}/preview`, method: 'post', data: { config } })
export const publishSuit = (id, revision) => request({ url: `${base}/suits/${id}/publish`, method: 'post', data: { revision } })
export const discardSuit = (id, revision) => request({ url: `${base}/suits/${id}/discard`, method: 'post', data: { revision } })
export const deleteSuit = (id, revision) => request({ url: `${base}/suits/${id}`, method: 'delete', data: { revision } })
export const getSuitHistory = id => request({ url: `${base}/suits/${id}/history`, method: 'get' })
export const getSuitImpact = id => request({ url: `${base}/suits/${id}/impact`, method: 'get' })
