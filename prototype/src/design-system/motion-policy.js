import Vue from 'vue'

// Components follow the system unless their host explicitly chooses a preview policy.
export const aiMotionPolicy = Vue.observable({value: 'system'})
export function setAiMotionPolicy(value) {
  aiMotionPolicy.value = ['system', 'full', 'reduce'].includes(value) ? value : 'system'
}
