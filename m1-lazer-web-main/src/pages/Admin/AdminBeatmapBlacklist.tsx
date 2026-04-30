import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../utils/api';
import toast from 'react-hot-toast';

interface BlacklistedBeatmap {
  id: number;
  beatmapset_id: number;
  beatmap_id: number;
  beatmapset?: {
    id: number;
    title: string;
    artist: string;
  };
}

const AdminBeatmapBlacklist: React.FC = () => {
  const [blacklistedBeatmaps, setBlacklistedBeatmaps] = useState<BlacklistedBeatmap[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [addByBeatmapId, setAddByBeatmapId] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    loadBlacklist();
  }, []);

  const loadBlacklist = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getBlacklistedBeatmaps();
      setBlacklistedBeatmaps(data || []);
    } catch (error) {
      console.error('Failed to load blacklist:', error);
      toast.error('Failed to load blacklisted beatmaps');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = parseInt(inputValue);

    if (isNaN(id) || id <= 0) {
      toast.error(addByBeatmapId ? 'Please enter a valid beatmap ID' : 'Please enter a valid beatmapset ID');
      return;
    }

    setAdding(true);
    try {
      if (addByBeatmapId) {
        await adminAPI.addBlacklistedBeatmapById(id);
        toast.success('Beatmap added to blacklist');
      } else {
        await adminAPI.addBlacklistedBeatmapSet(id);
        toast.success('Beatmapset added to blacklist');
      }
      setInputValue('');
      loadBlacklist();
    } catch (error) {
      console.error('Failed to add to blacklist:', error);
      toast.error(addByBeatmapId ? 'Failed to add beatmap to blacklist' : 'Failed to add beatmapset to blacklist');
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (beatmapsetId: number) => {
    if (!confirm('Are you sure you want to remove this beatmapset from the blacklist?')) return;

    try {
      await adminAPI.removeBlacklistedBeatmap(beatmapsetId);
      toast.success('Beatmapset removed from blacklist');
      loadBlacklist();
    } catch (error) {
      console.error('Failed to remove from blacklist:', error);
      toast.error('Failed to remove beatmapset from blacklist');
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Beatmap Blacklist</h2>

      {/* Toggle and Add Form */}
      <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Add to Blacklist
          </h3>
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-500">Add by:</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={addByBeatmapId}
                onChange={(e) => setAddByBeatmapId(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-500">
                <div className="inline-block h-5 w-5 rounded-full bg-white shadow translate-x-0.5 peer-checked:translate-x-5 transition"></div>
              </div>
            </label>
            <span className="ml-2 text-sm font-medium">{addByBeatmapId ? 'Beatmap ID' : 'Beatmapset ID'}</span>
          </div>
        </div>
        <form onSubmit={handleAdd} className="flex gap-3">
          <input
            type="number"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={addByBeatmapId ? 'Enter Beatmap ID' : 'Enter Beatmapset ID'}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-white dark:bg-slate-700 text-gray-900"
            required
            min="1"
          />
          <button
            type="submit"
            disabled={adding}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {adding ? 'Adding...' : 'Add to Blacklist'}
          </button>
        </form>
      </div>

      {/* Blacklist Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-white/10">
                <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                  ID
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Title</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Artist</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {blacklistedBeatmaps.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-gray-500">
                    No blacklisted beatmaps
                  </td>
                </tr>
              ) : (
                blacklistedBeatmaps.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4 text-gray-600 font-mono">
                      {addByBeatmapId ? item.beatmap_id : item.beatmapset_id}
                    </td>
                    <td className="py-3 px-4 text-gray-900">
                      {item.beatmapset?.title || 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {item.beatmapset?.artist || 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end">
                        <button
                          onClick={() => handleRemove(item.beatmap_id)}
                          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminBeatmapBlacklist;

