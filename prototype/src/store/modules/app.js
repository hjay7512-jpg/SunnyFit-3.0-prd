export default {
  namespaced: true,
  state: { sidebar: { opened: localStorage.getItem('sidebarStatus') !== '0' } },
  mutations: {
    TOGGLE_SIDEBAR(state) {
      state.sidebar.opened = !state.sidebar.opened
      localStorage.setItem('sidebarStatus', state.sidebar.opened ? '1' : '0')
    }
  },
  actions: { toggleSideBar({ commit }) { commit('TOGGLE_SIDEBAR') } }
}
