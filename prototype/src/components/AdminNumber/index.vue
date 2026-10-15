<template><el-input-number :key="String(actualDisabled)" :value="value" :disabled="actualDisabled" v-bind="$attrs" v-on="$listeners" controls-position="right" /></template>
<script>
// Element UI 2.15 sets InputNumber aria-disabled only on mount. The key keeps
// the accessibility state current when a form/conditional field is disabled.
export default {
  name: 'AdminNumber', inheritAttrs: false,
  inject: { elForm: { default: null } },
  props: { value: Number, disabled: Boolean },
  computed: { actualDisabled() { return this.disabled || !!(this.elForm && this.elForm.disabled) } }
}
</script>
