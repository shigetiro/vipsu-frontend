import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../utils/api';
import toast from 'react-hot-toast';

interface ChangelogBuild {
  id: number;
  version: string;
  display_version: string;
  stream_name: string;
  stream_id: number;
  users: number;
  created_at: string;
  entry_count: number;
}

interface ChangelogEntry {
  id: number;
  type: string;
  category: string;
  title: string;
  major: boolean;
  created_at: string;
}

interface GitHubCommit {
  sha: string;
  message: string;
  author: string;
  date: string;
  html_url: string;
}

type ChangeType = 'add' | 'fix' | 'misc' | 'remove';
type Category = 'client' | 'ui' | 'pp' | 'network' | 'toolbar' | 'download' | 'server' | 'other';

const CHANGE_TYPE_LABELS: Record<ChangeType, { label: string; color: string }> = {
  add: { label: 'New Feature', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  fix: { label: 'Bug Fix', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  misc: { label: 'Misc', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
  remove: { label: 'Removal', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
};

const CATEGORY_LABELS: Record<Category, string> = {
  client: 'Client',
  ui: 'UI',
  pp: 'PP',
  network: 'Network',
  toolbar: 'Toolbar',
  download: 'Download',
  server: 'Server',
  other: 'Other',
};

const ChangelogEditor: React.FC = () => {
  const [builds, setBuilds] = useState<ChangelogBuild[]>([]);
  const [selectedBuild, setSelectedBuild] = useState<ChangelogBuild | null>(null);
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateBuild, setShowCreateBuild] = useState(false);
  const [showCreateEntry, setShowCreateEntry] = useState(false);
  const [githubCommits, setGithubCommits] = useState<GitHubCommit[]>([]);
  const [showGitHubCommits, setShowGitHubCommits] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);
  const [repoName, setRepoName] = useState('shikkesora/torii-osu');

  const [newBuild, setNewBuild] = useState({
    version: '',
    display_version: '',
    stream_id: 1,
    users: 0,
    github_url: '',
  });

  const [newEntry, setNewEntry] = useState({
    type: 'add' as ChangeType,
    category: 'client' as Category,
    title: '',
    major: false,
  });

  useEffect(() => {
    loadBuilds();
  }, []);

  useEffect(() => {
    if (selectedBuild) {
      loadEntries(selectedBuild.id);
    }
  }, [selectedBuild]);

  const loadBuilds = async () => {
    try {
      const data = await adminAPI.getChangelogBuilds();
      setBuilds(data);
    } catch (e) {
      console.error('Failed to load builds:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadEntries = async (buildId: number) => {
    try {
      const data = await adminAPI.getChangelogEntries(buildId);
      setEntries(data);
    } catch (e) {
      console.error('Failed to load entries:', e);
    }
  };

  const loadGitHubCommits = async () => {
    console.log('loadGitHubCommits called, repo:', repoName);
    if (!selectedBuild) {
      toast.error('Select a build first');
      return;
    }
    setGithubLoading(true);
    try {
      console.log('Calling API with repo:', repoName);
      const data = await adminAPI.getGitHubCommits(repoName, 30);
      console.log('API response:', data);
      if (Array.isArray(data)) {
        setGithubCommits(data);
      } else {
        toast.error(data.error || 'Failed to fetch commits');
      }
    } catch (e) {
      console.error('GitHub fetch error:', e);
      toast.error('Failed to fetch GitHub commits');
    } finally {
      setGithubLoading(false);
    }
  };

  const addCommitAsEntry = async (commit: GitHubCommit) => {
    if (!selectedBuild) return;
    try {
      await adminAPI.createEntryFromCommit(
        selectedBuild.id,
        commit.sha,
        commit.message,
        repoName
      );
      toast.success('Commit added as entry');
      loadEntries(selectedBuild.id);
      loadBuilds();
    } catch (e) {
      toast.error('Failed to add commit');
    }
  };

  const handleCreateBuild = async () => {
    if (!newBuild.version || !newBuild.display_version) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await adminAPI.createChangelogBuild({
        ...newBuild,
        created_at: new Date().toISOString(),
        github_url: newBuild.github_url || null,
      });
      toast.success('Build created successfully');
      setShowCreateBuild(false);
      setNewBuild({ version: '', display_version: '', stream_id: 1, users: 0, github_url: '' });
      loadBuilds();
    } catch (e) {
      toast.error('Failed to create build');
    }
  };

  const handleCreateEntry = async () => {
    if (!newEntry.title || !selectedBuild) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await adminAPI.createChangelogEntry({
        build_id: selectedBuild.id,
        ...newEntry,
        message_html: `<p>${newEntry.title}</p>`,
      });
      toast.success('Entry added successfully');
      setShowCreateEntry(false);
      setNewEntry({ type: 'add', category: 'client', title: '', major: false });
      loadEntries(selectedBuild.id);
      loadBuilds();
    } catch (e) {
      toast.error('Failed to create entry');
    }
  };

  const handleDeleteEntry = async (entryId: number) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;

    try {
      await adminAPI.deleteChangelogEntry(entryId);
      toast.success('Entry deleted');
      if (selectedBuild) {
        loadEntries(selectedBuild.id);
        loadBuilds();
      }
    } catch (error) {
      toast.error('Failed to delete entry');
    }
  };

  const handleDeleteBuild = async (buildId: number) => {
    if (!confirm('Are you sure you want to delete this build and all its entries?')) return;

    try {
      await adminAPI.deleteChangelogBuild(buildId);
      toast.success('Build deleted');
      setSelectedBuild(null);
      loadBuilds();
    } catch (error) {
      toast.error('Failed to delete build');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTypeColor = (type: string) => {
    const t = type as ChangeType;
    return CHANGE_TYPE_LABELS[t]?.color || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-pink-500/30 border-t-pink-500" />
          <p className="text-sm text-gray-400">Loading changelog...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Changelog Management</h3>
          <p className="text-sm text-gray-400">Create and manage client updates</p>
        </div>
        <button
          onClick={() => setShowCreateBuild(true)}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-pink-500 to-pink-600 px-4 py-2 text-sm font-medium text-white transition-all hover:shadow-lg hover:shadow-pink-500/30"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Build
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <h4 className="mb-4 text-sm font-semibold text-gray-300">Builds</h4>
          {builds.length === 0 ? (
            <p className="text-sm text-gray-500">No builds found. Create your first build!</p>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {builds.map((build) => (
                <button
                  key={build.id}
                  onClick={() => setSelectedBuild(build)}
                  className={`w-full rounded-lg border p-3 text-left transition-all ${
                    selectedBuild?.id === build.id
                      ? 'border-pink-500/50 bg-pink-500/10'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white">{build.display_version}</p>
                      <p className="text-xs text-gray-400">{build.stream_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">{build.entry_count} entries</p>
                      <p className="text-xs text-gray-500">{formatDate(build.created_at)}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <div className="mb-4 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-300">
              {selectedBuild ? `Entries: ${selectedBuild.display_version}` : 'Select a build'}
            </h4>
            {selectedBuild && (
              <div className="flex gap-2">
                <button
                  onClick={() => { loadGitHubCommits(); setShowGitHubCommits(true); }}
                  className="flex items-center gap-1 rounded-lg bg-gray-600/50 px-3 py-1.5 text-xs text-gray-300 transition-colors hover:bg-gray-600"
                >
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                  </svg>
                  GitHub
                </button>
                <button
                  onClick={() => setShowCreateEntry(true)}
                  className="flex items-center gap-1 rounded-lg bg-white/10 px-3 py-1.5 text-xs text-gray-300 transition-colors hover:bg-white/20"
                >
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Entry
                </button>
              </div>
            )}
          </div>
          
          {!selectedBuild ? (
            <p className="text-sm text-gray-500">Select a build to view its entries</p>
          ) : entries.length === 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-500">No entries yet</p>
              <button
                onClick={() => setShowCreateEntry(true)}
                className="text-sm text-pink-400 hover:text-pink-300"
              >
                + Add first entry
              </button>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="group relative rounded-lg border border-white/10 bg-white/5 p-3"
                >
                  <div className="flex items-start gap-3">
                    <div className={`rounded px-2 py-0.5 text-xs font-medium border ${getTypeColor(entry.type)}`}>
                      {entry.type}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-white">{entry.title}</p>
                      <p className="text-xs text-gray-500">
                        {CATEGORY_LABELS[entry.category as Category] || entry.category} • {formatDate(entry.created_at)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteEntry(entry.id)}
                      className="opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <svg className="h-4 w-4 text-red-400 hover:text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedBuild && (
        <div className="flex justify-end">
          <button
            onClick={() => handleDeleteBuild(selectedBuild.id)}
            className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/20"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete Build
          </button>
        </div>
      )}

      {showCreateBuild && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-gray-900 p-6">
            <h3 className="mb-4 text-lg font-semibold text-white">Create New Build</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs text-gray-400">Version *</label>
                <input
                  type="text"
                  value={newBuild.version}
                  onChange={(e) => setNewBuild({ ...newBuild, version: e.target.value })}
                  placeholder="2026.331.0"
                  className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-pink-500/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-400">Display Version *</label>
                <input
                  type="text"
                  value={newBuild.display_version}
                  onChange={(e) => setNewBuild({ ...newBuild, display_version: e.target.value })}
                  placeholder="2026.331.0-torii"
                  className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-pink-500/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-400">Stream ID</label>
                <input
                  type="number"
                  value={newBuild.stream_id}
                  onChange={(e) => setNewBuild({ ...newBuild, stream_id: parseInt(e.target.value) })}
                  className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white focus:border-pink-500/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-400">GitHub URL (optional)</label>
                <input
                  type="text"
                  value={newBuild.github_url}
                  onChange={(e) => setNewBuild({ ...newBuild, github_url: e.target.value })}
                  placeholder="https://github.com/user/repo/releases/tag/v1.0"
                  className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-pink-500/50 focus:outline-none"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowCreateBuild(false)}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-400 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateBuild}
                className="rounded-lg bg-gradient-to-r from-pink-500 to-pink-600 px-4 py-2 text-sm font-medium text-white"
              >
                Create Build
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-gray-900 p-6">
            <h3 className="mb-4 text-lg font-semibold text-white">Add Entry</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs text-gray-400">Type</label>
                  <select
                    value={newEntry.type}
                    onChange={(e) => setNewEntry({ ...newEntry, type: e.target.value as ChangeType })}
                    className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white focus:border-pink-500/50 focus:outline-none"
                  >
                    {Object.entries(CHANGE_TYPE_LABELS).map(([value, { label }]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-400">Category</label>
                  <select
                    value={newEntry.category}
                    onChange={(e) => setNewEntry({ ...newEntry, category: e.target.value as Category })}
                    className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white focus:border-pink-500/50 focus:outline-none"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-400">Title *</label>
                <input
                  type="text"
                  value={newEntry.title}
                  onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
                  placeholder="Describe the change..."
                  className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-pink-500/50 focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="major"
                  checked={newEntry.major}
                  onChange={(e) => setNewEntry({ ...newEntry, major: e.target.checked })}
                  className="rounded border-white/20 bg-black/20 text-pink-500 focus:ring-pink-500/50"
                />
                <label htmlFor="major" className="text-sm text-gray-400">Major change (highlighted)</label>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowCreateEntry(false)}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-400 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateEntry}
                className="rounded-lg bg-gradient-to-r from-pink-500 to-pink-600 px-4 py-2 text-sm font-medium text-white"
              >
                Add Entry
              </button>
            </div>
          </div>
        </div>
      )}

      {showGitHubCommits && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-2xl border border-white/10 bg-gray-900 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">GitHub Commits</h3>
              <button onClick={() => setShowGitHubCommits(false)} className="text-gray-400 hover:text-white">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mb-4">
              <label className="mb-1 block text-xs text-gray-400">Repository</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value)}
                  placeholder="owner/repo"
                  className="flex-1 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-pink-500/50 focus:outline-none"
                />
                <button
                  onClick={loadGitHubCommits}
                  disabled={githubLoading}
                  className="rounded-lg bg-gray-600 px-4 py-2 text-sm text-white hover:bg-gray-500 disabled:opacity-50"
                >
                  {githubLoading ? 'Loading...' : 'Fetch'}
                </button>
              </div>
            </div>
            <div className="max-h-[400px] overflow-y-auto space-y-2">
              {githubLoading ? (
                <div className="flex justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-pink-500/30 border-t-pink-500" />
                </div>
              ) : githubCommits.length === 0 ? (
                <p className="text-center text-sm text-gray-500">No commits found</p>
              ) : (
                githubCommits.map((commit) => (
                  <div key={commit.sha} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3">
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm text-white">{commit.message}</p>
                      <p className="text-xs text-gray-500">{commit.sha} • {commit.author} • {new Date(commit.date).toLocaleDateString()}</p>
                    </div>
                    <button
                      onClick={() => addCommitAsEntry(commit)}
                      className="ml-2 flex-shrink-0 rounded-lg bg-green-600/50 px-3 py-1.5 text-xs text-green-400 hover:bg-green-600"
                    >
                      Add
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChangelogEditor;