import { api } from './client';

export const scoreAPI = {
  // 获取谱面排行榜（按PP排序）
  getBeatmapScores: async (beatmapId: number, limit: number = 50, mode?: string) => {
    try {
      // Try to include Authorization header explicitly as a fallback in case
      // the request interceptor doesn't attach it in some runtime cases
      // Read token for diagnostic and as header fallback
      const token = localStorage.getItem('access_token');
      const hasToken = !!token;

      const headers: Record<string, string> = {};
      if (hasToken && token) {
        headers.Authorization = `Bearer ${token}`;
      }

      // Backend expects a GameMode value for `mode`
      const modeParam = mode || 'osu';

      // Debug (do not log token value)
      // eslint-disable-next-line no-console
      console.debug('[scoreAPI] getBeatmapScores', { beatmapId, limit, mode: modeParam, hasToken });

      const response = await api.get(`/api/v2/beatmaps/${beatmapId}/scores`, {
        params: {
          limit,
          mode: modeParam,
        },
        headers,
      });
      
      // 确保scores数组存在
      if (!response.data.scores) {
        return {
          scores: [],
          userScore: response.data.userScore || null,
        };
      }

      // 按PP降序排序
      const sortedScores = Array.isArray(response.data.scores)
        ? [...response.data.scores].sort((a, b) => (b.pp || 0) - (a.pp || 0))
        : [];
      
      return {
        scores: sortedScores,
        userScore: response.data.userScore || null,
      };
    } catch (error) {
      console.error('Failed to fetch beatmap scores:', error);
      throw error;
    }
  },

  getScoreById: async (scoreId: number) => {
    const response = await api.get(`/api/v2/scores/${scoreId}`);
    return response.data;
  },

  // 置顶成绩
  pinScore: async (scoreId: number) => {
    console.log('置顶成绩:', scoreId);
    const response = await api.put(`/api/v2/score-pins/${scoreId}`);
    return response.data;
  },

  // 取消置顶成绩
  unpinScore: async (scoreId: number) => {
    console.log('取消置顶成绩:', scoreId);
    const response = await api.delete(`/api/v2/score-pins/${scoreId}`);
    return response.data;
  },

  // 调整置顶成绩顺序
  reorderPinnedScore: async (
    scoreId: number,
    options: {
      after_score_id?: number;
      before_score_id?: number;
    }
  ) => {
    console.log('调整置顶成绩顺序:', scoreId, options);
    const response = await api.post(`/api/v2/score-pins/${scoreId}/reorder`, options);
    return response.data;
  },

  // 下载成绩回放
  downloadReplay: async (scoreId: number) => {
    console.log('下载成绩回放:', scoreId);
    const response = await api.get(`/api/v2/scores/${scoreId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

