const state = {
  // 已访问的标签视图（显示在标签栏）
  visitedViews: [],
  // 已缓存的视图名称（用于组件缓存）
  cachedViews: []
}

const mutations = {
  // 添加已访问标签（避免重复添加）
  ADD_VISITED_VIEW: (state, view) => {
    if (state.visitedViews.some(v => v.path === view.path)) return
    state.visitedViews.push(
      Object.assign({}, view, {
        title: view.meta.title || 'no-name' // 标签标题，默认"no-name"
      })
    )
  },
  // 添加缓存视图（需开启缓存且名称存在）
  ADD_CACHED_VIEW: (state, view) => {
    if (state.cachedViews.includes(view.name)) return
    if (!view.meta.noCache) { // 未设置 noCache 才缓存
      state.cachedViews.push(view.name)
    }
  },

  // 删除指定已访问标签
  DEL_VISITED_VIEW: (state, view) => {
    for (const [i, v] of state.visitedViews.entries()) {
      if (v.path === view.path) {
        state.visitedViews.splice(i, 1)
        break
      }
    }
  },
  // 删除指定缓存视图
  DEL_CACHED_VIEW: (state, view) => {
    const index = state.cachedViews.indexOf(view.name)
    index > -1 && state.cachedViews.splice(index, 1)
  },

  // 删除其他已访问标签（保留固定标签和当前标签）
  DEL_OTHERS_VISITED_VIEWS: (state, view) => {
    state.visitedViews = state.visitedViews.filter(v => {
      return v.meta.affix || v.path === view.path
    })
  },
  // 删除其他缓存视图（仅保留当前标签的缓存）
  DEL_OTHERS_CACHED_VIEWS: (state, view) => {
    const index = state.cachedViews.indexOf(view.name)
    if (index > -1) {
      state.cachedViews = state.cachedViews.slice(index, index + 1)
    } else {
      state.cachedViews = []
    }
  },

  // 删除所有已访问标签（保留固定标签）
  DEL_ALL_VISITED_VIEWS: state => {
    const affixTags = state.visitedViews.filter(tag => tag.meta.affix)
    state.visitedViews = affixTags
  },
  // 删除所有缓存视图
  DEL_ALL_CACHED_VIEWS: state => {
    state.cachedViews = []
  },

  // 更新已访问标签的信息（如标题、参数变化）
  UPDATE_VISITED_VIEW: (state, view) => {
    for (let v of state.visitedViews) {
      if (v.path === view.path) {
        v = Object.assign(v, view)
        break
      }
    }
  },

  /**
   * 删除当前标签左侧所有非固定已访问标签
   * @param {Object} state - 状态对象
   * @param {Object} view - 当前选中的标签对象
   */
  DEL_LEFT_VISITED_VIEWS: (state, view) => {
    // 找到当前标签在数组中的索引
    const currentIndex = state.visitedViews.findIndex(v => v.path === view.path)
    if (currentIndex === -1) return

    // 筛选保留的标签：固定标签 + 当前标签及右侧所有标签
    state.visitedViews = state.visitedViews.filter((v, index) => {
      return v.meta.affix || index >= currentIndex
    })
  },

  /**
   * 删除当前标签左侧所有缓存视图
   * @param {Object} state - 状态对象
   * @param {Object} view - 当前选中的标签对象
   */
  DEL_LEFT_CACHED_VIEWS: (state, view) => {
    // 找到当前标签在已访问列表中的索引
    const currentIndex = state.visitedViews.findIndex(v => v.path === view.path)
    if (currentIndex === -1) {
      state.cachedViews = []
      return
    }

    // 筛选出当前标签及右侧的已访问标签
    const keepVisitedViews = state.visitedViews.filter((v, index) => {
      return v.meta.affix || index >= currentIndex
    })
    // 仅保留这些标签对应的缓存
    state.cachedViews = state.cachedViews.filter(name => {
      return keepVisitedViews.some(v => v.name === name)
    })
  },

  /**
   * 删除当前标签右侧所有非固定已访问标签
   * @param {Object} state - 状态对象
   * @param {Object} view - 当前选中的标签对象
   */
  DEL_RIGHT_VISITED_VIEWS: (state, view) => {
    // 找到当前标签在数组中的索引
    const currentIndex = state.visitedViews.findIndex(v => v.path === view.path)
    if (currentIndex === -1) return

    // 筛选保留的标签：固定标签 + 当前标签及左侧所有标签
    state.visitedViews = state.visitedViews.filter((v, index) => {
      return v.meta.affix || index <= currentIndex
    })
  },

  /**
   * 删除当前标签右侧所有缓存视图
   * @param {Object} state - 状态对象
   * @param {Object} view - 当前选中的标签对象
   */
  DEL_RIGHT_CACHED_VIEWS: (state, view) => {
    // 找到当前标签在已访问列表中的索引
    const currentIndex = state.visitedViews.findIndex(v => v.path === view.path)
    if (currentIndex === -1) {
      state.cachedViews = []
      return
    }

    // 筛选出当前标签及左侧的已访问标签
    const keepVisitedViews = state.visitedViews.filter((v, index) => {
      return v.meta.affix || index <= currentIndex
    })
    // 仅保留这些标签对应的缓存
    state.cachedViews = state.cachedViews.filter(name => {
      return keepVisitedViews.some(v => v.name === name)
    })
  }
}

const actions = {
  // 同时添加已访问标签和缓存视图
  addView({ dispatch }, view) {
    dispatch('addVisitedView', view)
    dispatch('addCachedView', view)
  },
  addVisitedView({ commit }, view) {
    commit('ADD_VISITED_VIEW', view)
  },
  addCachedView({ commit }, view) {
    commit('ADD_CACHED_VIEW', view)
  },

  // 同时删除指定的已访问标签和缓存视图
  delView({ dispatch, state }, view) {
    return new Promise(resolve => {
      dispatch('delVisitedView', view)
      dispatch('delCachedView', view)
      resolve({
        visitedViews: [...state.visitedViews],
        cachedViews: [...state.cachedViews]
      })
    })
  },
  delVisitedView({ commit, state }, view) {
    return new Promise(resolve => {
      commit('DEL_VISITED_VIEW', view)
      resolve([...state.visitedViews])
    })
  },
  delCachedView({ commit, state }, view) {
    return new Promise(resolve => {
      commit('DEL_CACHED_VIEW', view)
      resolve([...state.cachedViews])
    })
  },

  // 同时删除其他已访问标签和缓存视图
  delOthersViews({ dispatch, state }, view) {
    return new Promise(resolve => {
      dispatch('delOthersVisitedViews', view)
      dispatch('delOthersCachedViews', view)
      resolve({
        visitedViews: [...state.visitedViews],
        cachedViews: [...state.cachedViews]
      })
    })
  },
  delOthersVisitedViews({ commit, state }, view) {
    return new Promise(resolve => {
      commit('DEL_OTHERS_VISITED_VIEWS', view)
      resolve([...state.visitedViews])
    })
  },
  delOthersCachedViews({ commit, state }, view) {
    return new Promise(resolve => {
      commit('DEL_OTHERS_CACHED_VIEWS', view)
      resolve([...state.cachedViews])
    })
  },

  // 同时删除所有已访问标签和缓存视图
  delAllViews({ dispatch, state }, view) {
    return new Promise(resolve => {
      dispatch('delAllVisitedViews', view)
      dispatch('delAllCachedViews', view)
      resolve({
        visitedViews: [...state.visitedViews],
        cachedViews: [...state.cachedViews]
      })
    })
  },
  delAllVisitedViews({ commit, state }) {
    return new Promise(resolve => {
      commit('DEL_ALL_VISITED_VIEWS')
      resolve([...state.visitedViews])
    })
  },
  delAllCachedViews({ commit, state }) {
    return new Promise(resolve => {
      commit('DEL_ALL_CACHED_VIEWS')
      resolve([...state.cachedViews])
    })
  },

  // 更新已访问标签信息
  updateVisitedView({ commit }, view) {
    commit('UPDATE_VISITED_VIEW', view)
  },

  // ---------------------- 新增：删除左边标签（action） ----------------------
  /**
   * 统一调度：删除当前标签左侧的已访问标签和缓存视图
   * @param {Object} dispatch - 分发函数
   * @param {Object} state - 状态对象
   * @param {Object} view - 当前选中的标签对象
   * @returns {Promise} - 包含更新后标签列表的Promise
   */
  delLeftViews({ dispatch, state }, view) {
    return new Promise(resolve => {
      dispatch('delLeftVisitedViews', view)
      dispatch('delLeftCachedViews', view)
      resolve({
        visitedViews: [...state.visitedViews],
        cachedViews: [...state.cachedViews]
      })
    })
  },

  /**
   * 删除左侧已访问标签
   * @param {Object} commit - 提交mutation函数
   * @param {Object} state - 状态对象
   * @param {Object} view - 当前选中的标签对象
   * @returns {Promise} - 包含更新后已访问标签列表的Promise
   */
  delLeftVisitedViews({ commit, state }, view) {
    return new Promise(resolve => {
      commit('DEL_LEFT_VISITED_VIEWS', view)
      resolve([...state.visitedViews])
    })
  },

  /**
   * 删除左侧缓存视图
   * @param {Object} commit - 提交mutation函数
   * @param {Object} state - 状态对象
   * @param {Object} view - 当前选中的标签对象
   * @returns {Promise} - 包含更新后缓存视图列表的Promise
   */
  delLeftCachedViews({ commit, state }, view) {
    return new Promise(resolve => {
      commit('DEL_LEFT_CACHED_VIEWS', view)
      resolve([...state.cachedViews])
    })
  },

  // ---------------------- 新增：删除右边标签（action） ----------------------
  /**
   * 统一调度：删除当前标签右侧的已访问标签和缓存视图
   * @param {Object} dispatch - 分发函数
   * @param {Object} state - 状态对象
   * @param {Object} view - 当前选中的标签对象
   * @returns {Promise} - 包含更新后标签列表的Promise
   */
  delRightViews({ dispatch, state }, view) {
    return new Promise(resolve => {
      dispatch('delRightVisitedViews', view)
      dispatch('delRightCachedViews', view)
      resolve({
        visitedViews: [...state.visitedViews],
        cachedViews: [...state.cachedViews]
      })
    })
  },

  /**
   * 删除右侧已访问标签
   * @param {Object} commit - 提交mutation函数
   * @param {Object} state - 状态对象
   * @param {Object} view - 当前选中的标签对象
   * @returns {Promise} - 包含更新后已访问标签列表的Promise
   */
  delRightVisitedViews({ commit, state }, view) {
    return new Promise(resolve => {
      commit('DEL_RIGHT_VISITED_VIEWS', view)
      resolve([...state.visitedViews])
    })
  },

  /**
   * 删除右侧缓存视图
   * @param {Object} commit - 提交mutation函数
   * @param {Object} state - 状态对象
   * @param {Object} view - 当前选中的标签对象
   * @returns {Promise} - 包含更新后缓存视图列表的Promise
   */
  delRightCachedViews({ commit, state }, view) {
    return new Promise(resolve => {
      commit('DEL_RIGHT_CACHED_VIEWS', view)
      resolve([...state.cachedViews])
    })
  }
}

export default {
  namespaced: true, // 启用命名空间，避免模块间冲突
  state,
  mutations,
  actions
}
