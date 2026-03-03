import { api } from './client';

export const beatmapAPI = {
  getBeatmapByBeatmapId: async (beatmapId: number) => {
    try {
      const response = await api.get(`/api/v2/beatmapsets/lookup?beatmap_id=${beatmapId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Beatmap not found');
      }
      throw error;
    }
  },

  getBeatmapset: async (beatmapsetId: number) => {
    try {
      const response = await api.get(`/api/v2/beatmapsets/${beatmapsetId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Beatmapset not found');
      }
      throw error;
    }
  },

  searchBeatmaps: async (params: {
    q?: string;
    m?: number;
    s?: string;
    g?: number;
    l?: number;
    nsfw?: boolean;
    sort?: string;
    is_local?: boolean;
    cursor?: Record<string, any>;
    page?: number;
  }) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.q) queryParams.append('q', params.q);
      if (params.m !== undefined) queryParams.append('m', params.m.toString());
      if (params.s) queryParams.append('s', params.s);
      if (params.g !== undefined) queryParams.append('g', params.g.toString());
      if (params.l !== undefined) queryParams.append('l', params.l.toString());
      if (params.nsfw !== undefined) queryParams.append('nsfw', params.nsfw.toString());
      if (params.is_local !== undefined) queryParams.append('is_local', params.is_local.toString());
      if (params.sort) queryParams.append('sort', params.sort);
      
      if (params.cursor) {
        Object.entries(params.cursor).forEach(([key, value]) => {
          queryParams.append(`cursor[${key}]`, value.toString());
        });
      }

      const response = await api.get(`/api/v2/beatmapsets/search?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  extractBeatmapIdFromUrl: (url: string): number | null => {
    const beatmapMatch = url.match(/\/beatmaps\/(\d+)/);
    if (beatmapMatch) {
      return parseInt(beatmapMatch[1], 10);
    }

    const beatmapsetMatch = url.match(/\/beatmapsets\/\d+#[^/]+\/(\d+)/);
    if (beatmapsetMatch) {
      return parseInt(beatmapsetMatch[1], 10);
    }

    return null;
  },

  extractBeatmapsetIdFromUrl: (url: string): number | null => {
    const match = url.match(/\/beatmapsets\/(\d+)/);
    if (match) {
      return parseInt(match[1], 10);
    }
    return null;
  },

  convertToInternalBeatmapUrl: (url: string): string | null => {
    const beatmapsetMatch = url.match(/\/beatmapsets\/(\d+)(?:#([^/]+)\/(\d+))?/);
    if (beatmapsetMatch) {
      const beatmapsetId = beatmapsetMatch[1];
      const mode = beatmapsetMatch[2] || 'osu';
      const beatmapId = beatmapsetMatch[3];

      if (beatmapId) {
        return `/beatmapsets/${beatmapsetId}#${mode}/${beatmapId}`;
      } else {
        return `/beatmapsets/${beatmapsetId}`;
      }
    }

    const beatmapMatch = url.match(/\/beatmaps\/(\d+)/);
    if (beatmapMatch) {
      return `/beatmaps/${beatmapMatch[1]}`;
    }

    return null;
  },

  parseUrlBeatmapInfo: (url: string): { beatmapsetId?: number; beatmapId?: number; mode?: string } => {
    const beatmapsetMatch = url.match(/\/beatmapsets\/(\d+)(?:#([^/]+)\/(\d+))?/);
    const beatmapMatch = url.match(/\/beatmaps\/(\d+)/);

    if (beatmapsetMatch) {
      const [, beatmapsetId, mode, beatmapId] = beatmapsetMatch;
      return {
        beatmapsetId: parseInt(beatmapsetId, 10),
        beatmapId: beatmapId ? parseInt(beatmapId, 10) : undefined,
        mode: mode || undefined,
      };
    } else if (beatmapMatch) {
      const [, beatmapId] = beatmapMatch;
      return {
        beatmapId: parseInt(beatmapId, 10),
      };
    }

    return {};
  },

  getBeatmapFromUrl: async (url: string): Promise<{ beatmapset: any; beatmap?: any }> => {
    const urlInfo = beatmapAPI.parseUrlBeatmapInfo(url);

    if (urlInfo.beatmapsetId) {
      const beatmapset = await beatmapAPI.getBeatmapset(urlInfo.beatmapsetId);
      const beatmap = urlInfo.beatmapId
        ? beatmapset.beatmaps.find((b: any) => b.id === urlInfo.beatmapId)
        : beatmapset.beatmaps[0];

      return { beatmapset, beatmap };
    } else if (urlInfo.beatmapId) {
      const beatmap = await beatmapAPI.getBeatmapByBeatmapId(urlInfo.beatmapId);
      const beatmapset = await beatmapAPI.getBeatmapset(beatmap.beatmapset_id);

      return { beatmapset, beatmap };
    }

    throw new Error('Invalid beatmap URL');
  },
};
