export default {
  namespaced: true,
  state: { visitedViews: [] },
  mutations: {
    ADD_VIEW(state, view) {
      if (!view.name || state.visitedViews.some(entry => entry.fullPath === view.fullPath)) return
      state.visitedViews.push({ fullPath: view.fullPath, title: view.meta.title || view.name })
    },
    DELETE_VIEW(state, view) { state.visitedViews = state.visitedViews.filter(entry => entry.fullPath !== view.fullPath) }
  },
  actions: {
    addView({ commit }, view) { commit('ADD_VIEW', view) },
    deleteView({ commit, state }, view) { commit('DELETE_VIEW', view); return state.visitedViews }
  }
}
