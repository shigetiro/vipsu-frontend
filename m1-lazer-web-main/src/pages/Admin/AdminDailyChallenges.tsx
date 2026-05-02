import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../utils/api';
import toast from 'react-hot-toast';

interface DailyChallenge {
  date: string;
  beatmap_id: number;
  ruleset_id: number;
  required_mods: string;
  allowed_mods: string;
  room_id?: number;
  max_attempts?: number;
  time_limit?: number;
  beatmap?: {
    beatmapset_id: number;
    artist: string;
    title: string;
    version: string;
  };
}

const AVAILABLE_MODS = [
  { acronym: 'NF', name: 'No Fail' },
  { acronym: 'EZ', name: 'Easy' },
  { acronym: 'HD', name: 'Hidden' },
  { acronym: 'HR', name: 'Hard Rock' },
  { acronym: 'SD', name: 'Sudden Death' },
  { acronym: 'DT', name: 'Double Time' },
  { acronym: 'HT', name: 'Half Time' },
  { acronym: 'NC', name: 'Nightcore' },
  { acronym: 'FL', name: 'Flashlight' },
  { acronym: 'SO', name: 'Spun Out' },
  { acronym: 'PF', name: 'Perfect' },
];

const AdminDailyChallenges: React.FC = () => {
  const [challenges, setChallenges] = useState<DailyChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRandomModal, setShowRandomModal] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<DailyChallenge | null>(null);
  const [randomPreview, setRandomPreview] = useState<{
    beatmap_id: number;
    beatmap_title: string;
    beatmap_artist: string;
    difficulty_rating: number;
    ruleset_id: number;
  } | null>(null);
  const [randomLoading, setRandomLoading] = useState(false);
  const [randomFormData, setRandomFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    ruleset_id: '0',
    min_difficulty: '',
    max_difficulty: '',
    required_mods: [] as string[],
  });
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    beatmap_id: '',
    ruleset_id: '0',
    required_mods: [] as string[],
    allowed_mods: [] as string[],
    max_attempts: '',
    time_limit: '',
  });

  useEffect(() => {
    loadChallenges();
  }, []);

  const loadChallenges = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.listDailyChallenges({ per_page: 50 });
      setChallenges(data.challenges || []);
    } catch (error) {
      console.error('Failed to load daily challenges:', error);
      toast.error('Failed to load daily challenges');
    } finally {
      setLoading(false);
    }
  };

  const handlePickRandom = async () => {
    try {
      setRandomLoading(true);
      const response = await adminAPI.createRandomDailyChallenge({
        ruleset_id: randomFormData.ruleset_id ? Number(randomFormData.ruleset_id) : undefined,
        min_difficulty: randomFormData.min_difficulty ? Number(randomFormData.min_difficulty) : undefined,
        max_difficulty: randomFormData.max_difficulty ? Number(randomFormData.max_difficulty) : undefined,
      });
      setRandomPreview({
        beatmap_id: response.beatmap_id,
        beatmap_title: response.beatmap_title,
        beatmap_artist: response.beatmap_artist,
        difficulty_rating: response.difficulty_rating,
        ruleset_id: response.ruleset_id,
      });
    } catch (error: any) {
      console.error('Failed to pick random beatmap:', error);
      toast.error(error?.response?.data?.detail || 'Failed to pick random beatmap');
    } finally {
      setRandomLoading(false);
    }
  };

  const handleCreateRandomChallenge = async () => {
    if (!randomPreview || !randomFormData.date) return;
    try {
      const response = await adminAPI.createRandomDailyChallenge({
        date: randomFormData.date,
        ruleset_id: randomFormData.ruleset_id ? Number(randomFormData.ruleset_id) : undefined,
        min_difficulty: randomFormData.min_difficulty ? Number(randomFormData.min_difficulty) : undefined,
        max_difficulty: randomFormData.max_difficulty ? Number(randomFormData.max_difficulty) : undefined,
        required_mods: JSON.stringify(randomFormData.required_mods),
        create_challenge: true,
      });
      if (response.challenge_created) {
        toast.success('Random daily challenge created successfully');
        setShowRandomModal(false);
        setRandomPreview(null);
        setRandomFormData({
          date: new Date().toISOString().split('T')[0],
          ruleset_id: '0',
          min_difficulty: '',
          max_difficulty: '',
          required_mods: [],
        });
        loadChallenges();
      }
    } catch (error: any) {
      console.error('Failed to create random challenge:', error);
      toast.error(error?.response?.data?.detail || 'Failed to create random challenge');
    }
  };

  const closeRandomModal = () => {
    setShowRandomModal(false);
    setRandomPreview(null);
    setRandomFormData({
      date: new Date().toISOString().split('T')[0],
      ruleset_id: '0',
      min_difficulty: '',
      max_difficulty: '',
      required_mods: [],
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newChallenge = {
        date: formData.date,
        beatmap_id: Number(formData.beatmap_id),
        ruleset_id: Number(formData.ruleset_id),
        required_mods: JSON.stringify(formData.required_mods),
        allowed_mods: JSON.stringify(formData.allowed_mods),
        max_attempts: formData.max_attempts ? Number(formData.max_attempts) : undefined,
        time_limit: formData.time_limit ? Number(formData.time_limit) : undefined,
      };
      
      await adminAPI.createDailyChallenge(newChallenge);
      toast.success('Daily challenge created successfully');
      setShowCreateModal(false);
      loadChallenges();
    } catch (error: any) {
      console.error('Failed to create daily challenge:', error);
      toast.error(error?.response?.data?.detail || 'Failed to create daily challenge');
    }
  };

  const handleEdit = (challenge: DailyChallenge) => {
    let required_mods = [];
    let allowed_mods = [];
    try {
      required_mods = JSON.parse(challenge.required_mods);
    } catch (e) {
      console.error('Failed to parse required_mods:', e);
    }
    try {
      allowed_mods = JSON.parse(challenge.allowed_mods);
    } catch (e) {
      console.error('Failed to parse allowed_mods:', e);
    }

    setEditingChallenge(challenge);
    setFormData({
      date: challenge.date,
      beatmap_id: challenge.beatmap_id.toString(),
      ruleset_id: challenge.ruleset_id.toString(),
      required_mods,
      allowed_mods,
      max_attempts: challenge.max_attempts?.toString() || '',
      time_limit: challenge.time_limit?.toString() || '',
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChallenge) return;

    try {
      const updatedData = {
        beatmap_id: Number(formData.beatmap_id),
        ruleset_id: Number(formData.ruleset_id),
        required_mods: JSON.stringify(formData.required_mods),
        allowed_mods: JSON.stringify(formData.allowed_mods),
        max_attempts: formData.max_attempts ? Number(formData.max_attempts) : undefined,
        time_limit: formData.time_limit ? Number(formData.time_limit) : undefined,
      };
      
      await adminAPI.updateDailyChallenge(editingChallenge.date, updatedData);
      toast.success('Daily challenge updated successfully');
      setEditingChallenge(null);
      loadChallenges();
    } catch (error: any) {
      console.error('Failed to update daily challenge:', error);
      toast.error(error?.response?.data?.detail || 'Failed to update daily challenge');
    }
  };

  const handleDelete = async (date: string) => {
    if (!confirm('Are you sure you want to delete this daily challenge?')) return;

    try {
      await adminAPI.deleteDailyChallenge(date);
      toast.success('Daily challenge deleted successfully');
      loadChallenges();
    } catch (error) {
      console.error('Failed to delete daily challenge:', error);
      toast.error('Failed to delete daily challenge');
    }
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingChallenge(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      beatmap_id: '',
      ruleset_id: '0',
      required_mods: [],
      allowed_mods: [],
      max_attempts: '',
      time_limit: '',
    });
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Daily Challenges</h2>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              try {
                setLoading(true);
                await adminAPI.triggerDailyChallenge();
                toast.success('Next daily challenge triggered');
                loadChallenges();
              } catch (error: any) {
                console.error('Failed to trigger daily challenge:', error);
                toast.error(error?.response?.data?.detail || 'Failed to trigger daily challenge');
              } finally {
                setLoading(false);
              }
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-600/90 transition-colors whitespace-nowrap"
          >
            Trigger Next
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-osu-pink text-white rounded-lg hover:bg-osu-pink/90 transition-colors whitespace-nowrap"
          >
            Add Daily Challenge
          </button>
          <button
            onClick={() => setShowRandomModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-600/90 transition-colors whitespace-nowrap"
          >
            Random Challenge
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-osu-pink"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {challenges.length === 0 ? (
            <div className="text-center py-8 text-gray-500 bg-gray-50 dark:bg-slate-700/50 rounded-lg border border-dashed border-gray-300">
              No daily challenges scheduled
            </div>
          ) : (
            challenges.map((challenge) => (
              <div
                key={challenge.date}
                className={`bg-card rounded-lg p-4 border ${
                  challenge.date === today 
                    ? 'border-osu-pink ring-1 ring-osu-pink/20' 
                    : 'border-gray-200'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`px-3 py-1 rounded text-sm font-bold ${
                      challenge.date === today 
                        ? 'bg-osu-pink text-white' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {challenge.date}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {challenge.beatmap ? (
                          `${challenge.beatmap.artist} - ${challenge.beatmap.title} [${challenge.beatmap.version}]`
                        ) : (
                          `Beatmap ID: ${challenge.beatmap_id}`
                        )}
                      </h3>
                      <div className="mt-1 flex flex-wrap gap-2 text-xs text-gray-500">
                        <span>Ruleset: {challenge.ruleset_id === 0 ? 'osu!' : challenge.ruleset_id === 1 ? 'osu!taiko' : challenge.ruleset_id === 2 ? 'osu!catch' : 'osu!mania'}</span>
                        {(() => {
                          try {
                            const mods = JSON.parse(challenge.required_mods);
                            return mods.length > 0 && <span>Required: {mods.map((m: any) => m.acronym || m).join(', ')}</span>;
                          } catch {
                            return challenge.required_mods !== '[]' && <span>Required: {challenge.required_mods}</span>;
                          }
                        })()}
                        {(() => {
                          try {
                            const mods = JSON.parse(challenge.allowed_mods);
                            return mods.length > 0 && <span>Allowed: {mods.map((m: any) => m.acronym || m).join(', ')}</span>;
                          } catch {
                            return challenge.allowed_mods !== '[]' && <span>Allowed: {challenge.allowed_mods}</span>;
                          }
                        })()}
                        {challenge.max_attempts && <span>Max Attempts: {challenge.max_attempts}</span>}
                        {challenge.time_limit && <span>Time Limit: {challenge.time_limit}m</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(challenge)}
                      className="px-3 py-1.5 bg-blue-600/10 text-blue-600 hover:bg-blue-600 hover:text-white rounded transition-colors text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(challenge.date)}
                      className="px-3 py-1.5 bg-red-600/10 text-red-600 hover:bg-red-600 hover:text-white rounded transition-colors text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {(showCreateModal || editingChallenge) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingChallenge ? 'Edit Daily Challenge' : 'Add Daily Challenge'}
                </h2>
                <button
                  onClick={closeModal}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={editingChallenge ? handleUpdate : handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white dark:bg-slate-700 text-gray-900 focus:ring-2 focus:ring-osu-pink/20 focus:border-osu-pink outline-none"
                    required
                    disabled={!!editingChallenge}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Beatmap ID *
                    </label>
                    <input
                      type="number"
                      value={formData.beatmap_id}
                      onChange={(e) => setFormData({ ...formData, beatmap_id: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white dark:bg-slate-700 text-gray-900 focus:ring-2 focus:ring-osu-pink/20 focus:border-osu-pink outline-none"
                      required
                      placeholder="e.g. 123456"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Ruleset ID *
                    </label>
                    <select
                      value={formData.ruleset_id}
                      onChange={(e) => setFormData({ ...formData, ruleset_id: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white dark:bg-slate-700 text-gray-900 focus:ring-2 focus:ring-osu-pink/20 focus:border-osu-pink outline-none"
                      required
                    >
                      <option value="0">osu!</option>
                      <option value="1">osu!taiko</option>
                      <option value="2">osu!catch</option>
                      <option value="3">osu!mania</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Required Mods
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg border border-gray-200">
                    {AVAILABLE_MODS.map((mod) => (
                      <label key={mod.acronym} className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={formData.required_mods.includes(mod.acronym)}
                          onChange={(e) => {
                            const newMods = e.target.checked
                              ? [...formData.required_mods, mod.acronym]
                              : formData.required_mods.filter(m => m !== mod.acronym);
                            setFormData({ ...formData, required_mods: newMods });
                          }}
                          className="w-4 h-4 rounded border-gray-300 text-osu-pink focus:ring-osu-pink"
                        />
                        <span className="text-sm text-gray-600 group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors">
                          {mod.acronym}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Allowed Mods
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg border border-gray-200">
                    {AVAILABLE_MODS.map((mod) => (
                      <label key={mod.acronym} className="flex items-center gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={formData.allowed_mods.includes(mod.acronym)}
                          onChange={(e) => {
                            const newMods = e.target.checked
                              ? [...formData.allowed_mods, mod.acronym]
                              : formData.allowed_mods.filter(m => m !== mod.acronym);
                            setFormData({ ...formData, allowed_mods: newMods });
                          }}
                          className="w-4 h-4 rounded border-gray-300 text-osu-pink focus:ring-osu-pink"
                        />
                        <span className="text-sm text-gray-600 group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors">
                          {mod.acronym}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Max Attempts
                    </label>
                    <input
                      type="number"
                      value={formData.max_attempts}
                      onChange={(e) => setFormData({ ...formData, max_attempts: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white dark:bg-slate-700 text-gray-900 focus:ring-2 focus:ring-osu-pink/20 focus:border-osu-pink outline-none"
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Time Limit (mins)
                    </label>
                    <input
                      type="number"
                      value={formData.time_limit}
                      onChange={(e) => setFormData({ ...formData, time_limit: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white dark:bg-slate-700 text-gray-900 focus:ring-2 focus:ring-osu-pink/20 focus:border-osu-pink outline-none"
                      placeholder="Optional"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-6">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-6 py-2 border border-gray-300 dark:border-white/20 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-osu-pink text-white rounded-xl hover:bg-osu-pink/90 shadow-lg shadow-osu-pink/20 transition-all font-medium"
                  >
                    {editingChallenge ? 'Update Challenge' : 'Create Challenge'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showRandomModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Random Challenge</h2>
                <button
                  onClick={closeRandomModal}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={randomFormData.date}
                    onChange={(e) => setRandomFormData({ ...randomFormData, date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white dark:bg-slate-700 text-gray-900 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Ruleset
                    </label>
                    <select
                      value={randomFormData.ruleset_id}
                      onChange={(e) => setRandomFormData({ ...randomFormData, ruleset_id: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white dark:bg-slate-700 text-gray-900 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
                    >
                      <option value="0">osu!</option>
                      <option value="1">osu!taiko</option>
                      <option value="2">osu!catch</option>
                      <option value="3">osu!mania</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Min Difficulty
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={randomFormData.min_difficulty}
                      onChange={(e) => setRandomFormData({ ...randomFormData, min_difficulty: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white dark:bg-slate-700 text-gray-900 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
                      placeholder="Optional (e.g. 5.0)"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Max Difficulty
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={randomFormData.max_difficulty}
                      onChange={(e) => setRandomFormData({ ...randomFormData, max_difficulty: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white dark:bg-slate-700 text-gray-900 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
                      placeholder="Optional (e.g. 7.0)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Required Mods
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {['DT', 'NC', 'HD', 'HR', 'EZ', 'HT'].map((mod) => (
                        <button
                          key={mod}
                          type="button"
                          onClick={() => {
                            const newMods = randomFormData.required_mods.includes(mod)
                              ? randomFormData.required_mods.filter((m: string) => m !== mod)
                              : [...randomFormData.required_mods, mod];
                            setRandomFormData({ ...randomFormData, required_mods: newMods });
                          }}
                          className={`px-2 py-1 text-xs rounded border transition-colors ${
                            randomFormData.required_mods.includes(mod)
                              ? 'bg-green-500 text-white border-green-500'
                              : 'bg-gray-50 text-gray-600 border-gray-300 hover:border-green-500'
                          }`}
                        >
                          {mod}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {randomPreview ? (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">Selected Beatmap</h4>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {randomPreview.beatmap_artist} - {randomPreview.beatmap_title}
                    </p>
                    <p className="text-sm text-gray-500">
                      Difficulty: {randomPreview.difficulty_rating.toFixed(2)} stars
                    </p>
                    <p className="text-xs text-gray-400">
                      Beatmap ID: {randomPreview.beatmap_id}
                    </p>
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg border border-dashed border-gray-300 text-center text-gray-500">
                    {randomLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-500"></div>
                        Picking random beatmap...
                      </div>
                    ) : (
                      'Click "Pick Random" to select a beatmap'
                    )}
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeRandomModal}
                    className="px-6 py-2 border border-gray-300 dark:border-white/20 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handlePickRandom}
                    disabled={randomLoading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-600/90 transition-colors font-medium disabled:opacity-50"
                  >
                    Pick Random
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateRandomChallenge}
                    disabled={!randomPreview || !randomFormData.date}
                    className="px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-600/90 shadow-lg shadow-green-600/20 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Create Challenge
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDailyChallenges;
