import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../utils/api';
import toast from 'react-hot-toast';

interface Badge {
  id: number;
  description: string;
  image_url: string;
  image_2x_url?: string;
  url?: string;
  awarded_at?: string;
  user_id?: number;
  username?: string;
}

const AdminBadges: React.FC = () => {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBadge, setEditingBadge] = useState<Badge | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    description: '',
    image_url: '',
    image_2x_url: '',
    url: '',
    user_id: '' as string | number,
  });

  useEffect(() => {
    loadBadges();
  }, []);

  const loadBadges = async () => {
    try {
      setLoading(true);
      const badgesData = await adminAPI.getBadges();
      setBadges(badgesData);
    } catch (error) {
      console.error('Failed to load badges:', error);
      toast.error('Failed to load badges');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newBadge = {
        description: formData.description,
        image_url: formData.image_url,
        image_2x_url: formData.image_2x_url || formData.image_url,
        url: formData.url || "",
        awarded_at: new Date().toISOString(),
        user_id: formData.user_id ? Number(formData.user_id) : null,
      };

      await adminAPI.createBadge(newBadge);

      toast.success('Badge created successfully');
      setShowCreateModal(false);
      setFormData({ description: '', image_url: '', image_2x_url: '', url: '', user_id: '' });
      loadBadges();
    } catch (error: any) {
      console.error('Failed to create badge:', error);
      toast.error(error?.response?.data?.detail || 'Failed to create badge');
    }
  };

  const handleEdit = (badge: Badge) => {
    setEditingBadge(badge);
    setFormData({
      description: badge.description || '',
      image_url: badge.image_url || '',
      image_2x_url: badge.image_2x_url || '',
      url: badge.url || '',
      user_id: badge.user_id || '',
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBadge) return;

    try {
      const updatedBadge = {
        description: formData.description,
        image_url: formData.image_url,
        image_2x_url: formData.image_2x_url || formData.image_url,
        url: formData.url || "",
        awarded_at: editingBadge.awarded_at || new Date().toISOString(),
        user_id: formData.user_id ? Number(formData.user_id) : null,
      };

      await adminAPI.updateBadge(editingBadge.id, updatedBadge);

      toast.success('Badge updated successfully');
      setEditingBadge(null);
      setFormData({ description: '', image_url: '', image_2x_url: '', url: '', user_id: '' });
      loadBadges();
    } catch (error: any) {
      console.error('Failed to update badge:', error);
      toast.error(error?.response?.data?.detail || 'Failed to update badge');
    }
  };

  const handleDelete = async (badgeId: number) => {
    if (!confirm('Are you sure you want to delete this badge?')) return;

    try {
      await adminAPI.deleteBadge(badgeId);
      toast.success('Badge deleted successfully');
      loadBadges();
    } catch (error) {
      console.error('Failed to delete badge:', error);
      toast.error('Failed to delete badge');
    }
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingBadge(null);
    setFormData({ description: '', image_url: '', image_2x_url: '', url: '', user_id: '' });
  };

  const filteredBadges = badges.filter(badge =>
    badge.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (badge.username && badge.username.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Badge Management</h2>
          <p className="text-sm text-gray-400">Create and manage user badges</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search badges..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 pl-10 text-white placeholder-gray-400 focus:border-pink-500/50 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
            />
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-pink-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-pink-500/30 transition-all hover:scale-105 hover:shadow-pink-500/50"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Badge
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-white/10 bg-gradient-to-br from-purple-500/20 to-purple-600/10 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-400">Total Badges</p>
              <p className="text-2xl font-bold text-white">{badges.length}</p>
            </div>
            <div className="rounded-lg bg-purple-500/20 p-3">
              <svg className="h-6 w-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-gradient-to-br from-blue-500/20 to-blue-600/10 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-400">Awarded</p>
              <p className="text-2xl font-bold text-white">{badges.filter(b => b.user_id).length}</p>
            </div>
            <div className="rounded-lg bg-blue-500/20 p-3">
              <svg className="h-6 w-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-gradient-to-br from-gray-500/20 to-gray-600/10 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Unassigned</p>
              <p className="text-2xl font-bold text-white">{badges.filter(b => !b.user_id).length}</p>
            </div>
            <div className="rounded-lg bg-gray-500/20 p-3">
              <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Badges Grid */}
      {loading ? (
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-pink-500/30 border-t-pink-500" />
            <p className="text-sm text-gray-400">Loading badges...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBadges.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center rounded-xl border border-dashed border-white/20 bg-white/5 py-12">
              <svg className="h-16 w-16 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              <p className="mt-4 text-gray-400">No badges found</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 text-sm text-pink-400 hover:text-pink-300"
              >
                Create your first badge
              </button>
            </div>
          ) : (
            filteredBadges.map((badge) => (
              <div
                key={badge.id}
                className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:border-white/20 hover:shadow-lg"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="relative p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="relative h-16 w-16 overflow-hidden rounded-xl bg-white/10 ring-2 ring-white/10">
                        {badge.image_url ? (
                          <img
                            src={badge.image_url}
                            alt={badge.description}
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <svg className="h-8 w-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l4.586-4.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{badge.description}</h3>
                        <div className="mt-1 space-y-0.5">
                          {badge.username ? (
                            <p className="text-xs text-blue-400 font-medium">
                              <span className="text-gray-400">User:</span> {badge.username}
                              <span className="ml-1 text-gray-500">(ID: {badge.user_id})</span>
                            </p>
                          ) : (
                            <p className="text-xs text-gray-500 italic">Not awarded</p>
                          )}
                          {badge.awarded_at && (
                            <p className="text-xs text-gray-500">
                              Awarded: {new Date(badge.awarded_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleEdit(badge)}
                      className="group/btn relative inline-flex items-center gap-1.5 rounded-lg bg-blue-500/20 px-3 py-1.5 text-sm font-medium text-blue-400 transition-all hover:bg-blue-500/30 hover:shadow-lg hover:shadow-blue-500/20"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(badge.id)}
                      className="group/btn relative inline-flex items-center gap-1.5 rounded-lg bg-red-500/20 px-3 py-1.5 text-sm font-medium text-red-400 transition-all hover:bg-red-500/30 hover:shadow-lg hover:shadow-red-500/20"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || editingBadge) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-gray-900 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <h2 className="text-xl font-bold text-white">
                {editingBadge ? 'Edit Badge' : 'Create Badge'}
              </h2>
              <button
                onClick={closeModal}
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={editingBadge ? handleUpdate : handleCreate} className="px-6 py-6 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Description (Name) <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-gray-500 focus:border-pink-500/50 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                  required
                  placeholder="Badge name/description"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Image URL (.png or .jpg) <span className="text-red-400">*</span>
                </label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-gray-500 focus:border-pink-500/50 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                  placeholder="https://example.com/badge.png"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Image @2x URL (optional)
                </label>
                <input
                  type="url"
                  value={formData.image_2x_url}
                  onChange={(e) => setFormData({ ...formData, image_2x_url: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-gray-500 focus:border-pink-500/50 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                  placeholder="https://example.com/badge@2x.png"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  URL (optional)
                </label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-gray-500 focus:border-pink-500/50 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Award to User ID (optional)
                </label>
                <input
                  type="number"
                  value={formData.user_id}
                  onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-gray-500 focus:border-pink-500/50 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                  placeholder="User ID"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-pink-500 to-pink-600 px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-pink-500/30 transition-all hover:scale-105 hover:shadow-pink-500/50"
                >
                  {editingBadge ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBadges;
