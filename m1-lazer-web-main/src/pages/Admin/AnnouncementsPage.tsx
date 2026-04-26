import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import {
  Megaphone,
  Plus,
  Edit,
  Trash2,
  Send,
  X,
  Info,
  AlertTriangle,
  AlertCircle,
  Wrench,
  ChevronLeft,
  ChevronRight,
  Eye,
  Power,
  Clock,
  Users,
  Globe,
  Flag,
} from 'lucide-react';
import { adminAPI } from '../../utils/api';
import { toast } from 'react-hot-toast';

// Types
interface Announcement {
  id: number;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'important' | 'maintenance';
  status: 'draft' | 'scheduled' | 'active' | 'expired';
  target_audience: 'all' | 'online' | 'country';
  countries?: string[];
  start_date: string;
  end_date: string | null;
  created_at: string;
  created_by: { username: string };
  updated_at: string;
}

interface AnnouncementFormData {
  title: string;
  content: string;
  type: 'info' | 'warning' | 'important' | 'maintenance';
  target_audience: 'all' | 'online' | 'country';
  countries: string[];
  start_date: string;
  end_date: string;
}

interface ApiResponse<T> {
  data: T;
  meta?: {
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
  };
}

const ITEMS_PER_PAGE = 10;

const announcementTypeConfig = {
  info: { icon: Info, color: 'text-blue-400 bg-blue-500/20 border-blue-500/30', label: 'Information' },
  warning: { icon: AlertTriangle, color: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30', label: 'Warning' },
  important: { icon: AlertCircle, color: 'text-red-400 bg-red-500/20 border-red-500/30', label: 'Important' },
  maintenance: { icon: Wrench, color: 'text-purple-400 bg-purple-500/20 border-purple-500/30', label: 'Maintenance' },
};

const statusConfig = {
  draft: { color: 'text-gray-400 bg-gray-500/20 border-gray-500/30', label: 'Draft' },
  scheduled: { color: 'text-blue-400 bg-blue-500/20 border-blue-500/30', label: 'Scheduled' },
  active: { color: 'text-green-400 bg-green-500/20 border-green-500/30', label: 'Active' },
  expired: { color: 'text-red-400 bg-red-500/20 border-red-500/30', label: 'Expired' },
};

// Country list for targeting
const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'JP', name: 'Japan' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'BR', name: 'Brazil' },
  { code: 'RU', name: 'Russia' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'TW', name: 'Taiwan' },
  { code: 'KR', name: 'South Korea' },
  { code: 'CN', name: 'China' },
  { code: 'PL', name: 'Poland' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'SE', name: 'Sweden' },
  { code: 'FI', name: 'Finland' },
  { code: 'NO', name: 'Norway' },
  { code: 'DK', name: 'Denmark' },
];

export const AnnouncementsPage: React.FC = () => {
  // State
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  // Form state
  const [formData, setFormData] = useState<AnnouncementFormData>({
    title: '',
    content: '',
    type: 'info',
    target_audience: 'all',
    countries: [],
    start_date: '',
    end_date: '',
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof AnnouncementFormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  // Fetch announcements
  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const params: { page?: number; per_page?: number; is_active?: string; type?: string } = {
        page: currentPage,
        per_page: ITEMS_PER_PAGE,
      };
      if (statusFilter !== 'all') {
        params.is_active = statusFilter === 'active' ? 'true' : 'false';
      }

      const data = await adminAPI.getAnnouncements(params);

      // Map backend response to frontend format
      // Backend returns { total, page, per_page, announcements: [...] }
      const mappedAnnouncements: Announcement[] = (data.announcements || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        content: item.content,
        type: mapBackendTypeToFrontend(item.type),
        status: mapBackendStatusToFrontend(item),
        target_audience: mapTargetRolesToAudience(item.target_roles),
        countries: [],
        start_date: item.start_at || item.created_at,
        end_date: item.end_at,
        created_at: item.created_at,
        created_by: { username: item.created_by?.username || 'Unknown' },
        updated_at: item.updated_at,
      }));

      setAnnouncements(mappedAnnouncements);
      setTotalPages(data.pages || 1);
      setTotalItems(data.total || mappedAnnouncements.length);
    } catch (error) {
      toast.error('Failed to load announcements');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter]);

  // Helper functions to map between backend and frontend formats
  const mapBackendTypeToFrontend = (backendType?: string): Announcement['type'] => {
    switch (backendType) {
      case 'maintenance': return 'maintenance';
      case 'event': return 'important';
      case 'update': return 'warning';
      default: return 'info';
    }
  };

  const mapBackendStatusToFrontend = (item: any): Announcement['status'] => {
    if (!item.is_active) return 'draft';
    if (item.end_at && new Date(item.end_at) < new Date()) return 'expired';
    return 'active';
  };

  const mapTargetRolesToAudience = (targetRoles?: string[]): Announcement['target_audience'] => {
    if (!targetRoles || targetRoles.length === 0 || targetRoles.includes('all')) return 'all';
    return 'all'; // Simplified - could be expanded to check specific roles
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      type: 'info',
      target_audience: 'all',
      countries: [],
      start_date: '',
      end_date: '',
    });
    setFormErrors({});
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof AnnouncementFormData, string>> = {};

    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    } else if (formData.title.length > 100) {
      errors.title = 'Title must be 100 characters or less';
    }

    if (!formData.content.trim()) {
      errors.content = 'Content is required';
    } else if (formData.content.length > 5000) {
      errors.content = 'Content must be 5000 characters or less';
    }

    if (!formData.start_date) {
      errors.start_date = 'Start date is required';
    }

    if (formData.end_date && formData.start_date && new Date(formData.end_date) <= new Date(formData.start_date)) {
      errors.end_date = 'End date must be after start date';
    }

    if (formData.target_audience === 'country' && formData.countries.length === 0) {
      errors.countries = 'Select at least one country';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Create announcement
  const handleCreate = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      await adminAPI.createAnnouncement({
        title: formData.title,
        content: formData.content,
        type: mapFrontendTypeToBackend(formData.type),
        target_roles: formData.target_audience === 'all' ? ['all'] : [],
        start_at: formData.start_date ? new Date(formData.start_date).toISOString() : undefined,
        end_at: formData.end_date ? new Date(formData.end_date).toISOString() : undefined,
        is_active: true,
        show_in_client: true,
        show_on_website: true,
      });

      toast.success('Announcement created successfully');
      setShowCreateModal(false);
      resetForm();
      fetchAnnouncements();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create announcement');
    } finally {
      setSubmitting(false);
    }
  };

  const mapFrontendTypeToBackend = (frontendType: string): string => {
    // Backend AnnouncementType enum: INFO, WARNING, ERROR, SUCCESS, EVENT, MAINTENANCE
    switch (frontendType) {
      case 'maintenance': return 'maintenance';
      case 'important': return 'event';
      case 'warning': return 'warning';
      default: return 'info';
    }
  };

  // Update announcement
  const handleUpdate = async () => {
    if (!selectedAnnouncement || !validateForm()) return;

    setSubmitting(true);
    try {
      await adminAPI.updateAnnouncement(selectedAnnouncement.id, {
        title: formData.title,
        content: formData.content,
        type: mapFrontendTypeToBackend(formData.type),
        target_roles: formData.target_audience === 'all' ? ['all'] : [],
        start_at: formData.start_date ? new Date(formData.start_date).toISOString() : undefined,
        end_at: formData.end_date ? new Date(formData.end_date).toISOString() : undefined,
      });

      toast.success('Announcement updated successfully');
      setShowEditModal(false);
      setSelectedAnnouncement(null);
      resetForm();
      fetchAnnouncements();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update announcement');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete announcement
  const handleDelete = async () => {
    if (!selectedAnnouncement) return;

    setSubmitting(true);
    try {
      await adminAPI.deleteAnnouncement(selectedAnnouncement.id);

      toast.success('Announcement deleted successfully');
      setShowDeleteModal(false);
      setSelectedAnnouncement(null);
      fetchAnnouncements();
    } catch (error) {
      toast.error('Failed to delete announcement');
    } finally {
      setSubmitting(false);
    }
  };

  // Send announcement immediately
  const handleSendNow = async (announcement: Announcement) => {
    try {
      // Activate and send notification to all users
      const response = await adminAPI.activateAnnouncement(announcement.id, true, false);

      if (response.warning) {
        toast.success('Announcement activated but notification not sent (show_in_client=false)');
      } else if (response.notification_id) {
        toast.success('Announcement sent to all users with notification');
      } else {
        toast.success('Announcement sent to all users');
      }
      fetchAnnouncements();
    } catch (error) {
      toast.error('Failed to send announcement');
    }
  };

  // Toggle announcement active status
  const handleToggleStatus = async (announcement: Announcement) => {
    try {
      if (announcement.status === 'active') {
        await adminAPI.deactivateAnnouncement(announcement.id);
        toast.success('Announcement deactivated');
      } else {
        // When activating from active list, send notification
        const response = await adminAPI.activateAnnouncement(announcement.id, true, false);

        if (response.warning) {
          toast.success('Announcement activated but notification not sent (show_in_client=false)');
        } else if (response.notification_id) {
          toast.success('Announcement activated and notification sent');
        } else {
          toast.success('Announcement activated');
        }
      }
      fetchAnnouncements();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  // Open edit modal with announcement data
  const openEditModal = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      target_audience: announcement.target_audience,
      countries: announcement.countries || [],
      start_date: announcement.start_date.slice(0, 16),
      end_date: announcement.end_date?.slice(0, 16) || '',
    });
    setShowEditModal(true);
  };

  // Handle search with debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // Handle country selection
  const handleCountryToggle = (countryCode: string) => {
    setFormData(prev => ({
      ...prev,
      countries: prev.countries.includes(countryCode)
        ? prev.countries.filter(c => c !== countryCode)
        : [...prev.countries, countryCode],
    }));
  };

  // Render form fields (shared between create and edit modals)
  const renderFormFields = () => (
    <div className="space-y-5">
      {/* Title */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-300">
          Title <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          className={`w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-gray-500 focus:border-pink-500/50 focus:outline-none focus:ring-2 focus:ring-pink-500/20 transition-all ${
            formErrors.title ? 'border-red-500/50 focus:border-red-500' : ''
          }`}
          placeholder="Announcement title..."
          maxLength={100}
        />
        {formErrors.title && (
          <p className="mt-1 text-sm text-red-400">{formErrors.title}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">{formData.title.length}/100</p>
      </div>

      {/* Content */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-300">
          Content <span className="text-red-400">*</span>
        </label>
        <textarea
          value={formData.content}
          onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
          className={`w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-gray-500 focus:border-pink-500/50 focus:outline-none focus:ring-2 focus:ring-pink-500/20 transition-all min-h-[150px] resize-none ${
            formErrors.content ? 'border-red-500/50 focus:border-red-500' : ''
          }`}
          placeholder="Announcement content..."
          maxLength={5000}
        />
        {formErrors.content && (
          <p className="mt-1 text-sm text-red-400">{formErrors.content}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">{formData.content.length}/5000</p>
      </div>

      {/* Type */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-300">
          Type
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {Object.entries(announcementTypeConfig).map(([key, config]) => {
            const Icon = config.icon;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, type: key as AnnouncementFormData['type'] }))}
                className={`group relative flex items-center justify-center gap-2 rounded-xl border px-4 py-3 transition-all duration-200 ${
                  formData.type === key
                    ? 'border-pink-500 bg-pink-500/20 text-pink-400 shadow-lg shadow-pink-500/20'
                    : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20 hover:bg-white/10'
                }`}
              >
                <Icon size={18} />
                <span className="text-sm font-medium">{config.label}</span>
                {formData.type === key && (
                  <div className="absolute inset-0 rounded-xl bg-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Target Audience */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-300">
          Target Audience
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, target_audience: 'all' }))}
            className={`group relative flex items-center justify-center gap-2 rounded-xl border px-4 py-3 transition-all duration-200 ${
              formData.target_audience === 'all'
                ? 'border-pink-500 bg-pink-500/20 text-pink-400 shadow-lg shadow-pink-500/20'
                : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20 hover:bg-white/10'
            }`}
          >
            <Users size={18} />
            <span className="text-sm font-medium">All Users</span>
            {formData.target_audience === 'all' && (
              <div className="absolute inset-0 rounded-xl bg-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, target_audience: 'online' }))}
            className={`group relative flex items-center justify-center gap-2 rounded-xl border px-4 py-3 transition-all duration-200 ${
              formData.target_audience === 'online'
                ? 'border-pink-500 bg-pink-500/20 text-pink-400 shadow-lg shadow-pink-500/20'
                : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20 hover:bg-white/10'
            }`}
          >
            <Globe size={18} />
            <span className="text-sm font-medium">Online Users</span>
            {formData.target_audience === 'online' && (
              <div className="absolute inset-0 rounded-xl bg-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, target_audience: 'country' }))}
            className={`group relative flex items-center justify-center gap-2 rounded-xl border px-4 py-3 transition-all duration-200 ${
              formData.target_audience === 'country'
                ? 'border-pink-500 bg-pink-500/20 text-pink-400 shadow-lg shadow-pink-500/20'
                : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20 hover:bg-white/10'
            }`}
          >
            <Flag size={18} />
            <span className="text-sm font-medium">By Country</span>
            {formData.target_audience === 'country' && (
              <div className="absolute inset-0 rounded-xl bg-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </button>
        </div>
      </div>

      {/* Country Selection */}
      {formData.target_audience === 'country' && (
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-300">
            Select Countries
          </label>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 max-h-48 overflow-y-auto">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {COUNTRIES.map((country) => (
                <label
                  key={country.code}
                  className={`group flex items-center gap-2 cursor-pointer rounded-lg px-3 py-2 transition-all ${
                    formData.countries.includes(country.code)
                      ? 'bg-pink-500/20 border-pink-500/30'
                      : 'hover:bg-white/10'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.countries.includes(country.code)}
                    onChange={() => handleCountryToggle(country.code)}
                    className="h-4 w-4 rounded border-white/30 bg-white/5 text-pink-500 focus:ring-pink-500/50"
                  />
                  <span className="text-sm text-gray-300">{country.name}</span>
                </label>
              ))}
            </div>
          </div>
          {formErrors.countries && (
            <p className="mt-1 text-sm text-red-400">{formErrors.countries}</p>
          )}
          {formData.countries.length > 0 && (
            <p className="mt-1 text-xs text-gray-500">
              {formData.countries.length} countries selected
            </p>
          )}
        </div>
      )}

      {/* Date Range */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-300">
            Start Date <span className="text-red-400">*</span>
          </label>
          <input
            type="datetime-local"
            value={formData.start_date}
            onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
            className={`w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-gray-500 focus:border-pink-500/50 focus:outline-none focus:ring-2 focus:ring-pink-500/20 transition-all ${
              formErrors.start_date ? 'border-red-500/50 focus:border-red-500' : ''
            }`}
          />
          {formErrors.start_date && (
            <p className="mt-1 text-sm text-red-400">{formErrors.start_date}</p>
          )}
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-300">
            End Date (optional)
          </label>
          <input
            type="datetime-local"
            value={formData.end_date}
            onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
            className={`w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-gray-500 focus:border-pink-500/50 focus:outline-none focus:ring-2 focus:ring-pink-500/20 transition-all ${
              formErrors.end_date ? 'border-red-500/50 focus:border-red-500' : ''
            }`}
          />
          {formErrors.end_date && (
            <p className="mt-1 text-sm text-red-400">{formErrors.end_date}</p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Announcements</h2>
          <p className="text-sm text-gray-400">Manage server-wide announcements and notifications</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-pink-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-pink-500/30 transition-all hover:scale-105 hover:shadow-pink-500/50"
        >
          <Plus size={18} />
          New Announcement
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search announcements..."
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 pl-10 text-white placeholder-gray-500 focus:border-pink-500/50 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white focus:border-pink-500/50 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {/* Announcements Table */}
      <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
        {loading ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-pink-500/30 border-t-pink-500" />
              <p className="text-sm text-gray-400">Loading announcements...</p>
            </div>
          </div>
        ) : announcements.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-400">
            <Megaphone size={64} className="mb-4 opacity-50" />
            <p className="text-lg">No announcements found</p>
            <p className="text-sm">Create your first announcement to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Title</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Type</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Target</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Start Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">End Date</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {announcements.map((announcement) => {
                  const typeConfig = announcementTypeConfig[announcement.type];
                  const TypeIcon = typeConfig.icon;
                  const statusConf = statusConfig[announcement.status];

                  return (
                    <tr key={announcement.id} className="transition-colors hover:bg-white/5">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`rounded-lg p-2 ${typeConfig.color}`}>
                            <TypeIcon size={18} />
                          </div>
                          <div>
                            <p className="font-medium text-white">{announcement.title}</p>
                            <p className="text-xs text-gray-500 truncate max-w-xs">
                              {announcement.content.substring(0, 50)}...
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-medium ${typeConfig.color}`}>
                          {typeConfig.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-medium ${statusConf.color}`}>
                          {statusConf.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {announcement.target_audience === 'all' && 'All Users'}
                        {announcement.target_audience === 'online' && 'Online Users'}
                        {announcement.target_audience === 'country' && (
                          <span className="flex items-center gap-1">
                            {announcement.countries?.slice(0, 2).join(', ')}
                            {announcement.countries && announcement.countries.length > 2 && (
                              <span className="text-gray-500">
                                +{announcement.countries.length - 2} more
                              </span>
                            )}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {format(new Date(announcement.start_date), 'MMM d, yyyy HH:mm')}
                      </td>
                      <td className="px-6 py-6 text-sm text-gray-300">
                        {announcement.end_date
                          ? format(new Date(announcement.end_date), 'MMM d, yyyy HH:mm')
                          : <span className="text-gray-500">No end</span>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedAnnouncement(announcement);
                              setShowPreviewModal(true);
                            }}
                            className="group relative inline-flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1.5 text-gray-400 transition-all hover:bg-white/10 hover:text-white"
                            title="Preview"
                          >
                            <Eye size={16} />
                          </button>
                          {announcement.status === 'draft' && (
                            <button
                              onClick={() => handleSendNow(announcement)}
                              className="group relative inline-flex items-center gap-1.5 rounded-lg bg-green-500/20 px-2.5 py-1.5 text-green-400 transition-all hover:bg-green-500/30 hover:text-green-300"
                              title="Send Now"
                            >
                              <Send size={16} />
                            </button>
                          )}
                          <button
                            onClick={() => handleToggleStatus(announcement)}
                            className={`group relative inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-all ${
                              announcement.status === 'active'
                                ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30 hover:text-green-300'
                                : 'bg-white/5 text-gray-400 hover:bg-green-500/20 hover:text-green-400'
                            }`}
                            title={announcement.status === 'active' ? 'Deactivate' : 'Activate'}
                          >
                            <Power size={16} />
                          </button>
                          <button
                            onClick={() => openEditModal(announcement)}
                            className="group relative inline-flex items-center gap-1.5 rounded-lg bg-blue-500/20 px-2.5 py-1.5 text-blue-400 transition-all hover:bg-blue-500/30 hover:text-blue-300"
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedAnnouncement(announcement);
                              setShowDeleteModal(true);
                            }}
                            className="group relative inline-flex items-center gap-1.5 rounded-lg bg-red-500/20 px-2.5 py-1.5 text-red-400 transition-all hover:bg-red-500/30 hover:text-red-300"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-white/10">
            <p className="text-sm text-gray-400">
              Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} of {totalItems} announcements
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="rounded-lg border border-white/10 bg-white/5 p-2 text-gray-400 transition-all hover:bg-white/10 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={20} />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`h-8 w-8 rounded-lg text-sm font-medium transition-all ${
                      currentPage === pageNum
                        ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/30'
                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="rounded-lg border border-white/10 bg-white/5 p-2 text-gray-400 transition-all hover:bg-white/10 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
          <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-gray-900 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <h2 className="text-xl font-bold text-white">Create Announcement</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            {/* Form */}
            <div className="px-6 py-6">{renderFormFields()}</div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-white/10 px-6 py-4">
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={submitting}
                className="rounded-xl bg-gradient-to-r from-pink-500 to-pink-600 px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-pink-500/30 transition-all hover:scale-105 hover:shadow-pink-500/50 disabled:opacity-50"
              >
                {submitting ? 'Creating...' : 'Create Announcement'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => {
            setShowEditModal(false);
            setSelectedAnnouncement(null);
            resetForm();
          }} />
          <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-gray-900 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <h2 className="text-xl font-bold text-white">Edit Announcement</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedAnnouncement(null);
                  resetForm();
                }}
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            {/* Form */}
            <div className="px-6 py-6">{renderFormFields()}</div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-white/10 px-6 py-4">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedAnnouncement(null);
                  resetForm();
                }}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                disabled={submitting}
                className="rounded-xl bg-gradient-to-r from-pink-500 to-pink-600 px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-pink-500/30 transition-all hover:scale-105 hover:shadow-pink-500/50 disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedAnnouncement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => {
            setShowDeleteModal(false);
            setSelectedAnnouncement(null);
          }} />
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-gray-900 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <h2 className="text-xl font-bold text-white">Delete Announcement</h2>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedAnnouncement(null);
                }}
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="rounded-xl bg-red-500/20 p-3">
                  <AlertTriangle className="h-6 w-6 text-red-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Are you sure you want to delete this announcement?</p>
                  <p className="text-gray-400 text-sm mt-1">"{selectedAnnouncement.title}"</p>
                </div>
              </div>
              <p className="text-sm text-gray-400">
                This action cannot be undone. The announcement will be permanently removed.
              </p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-white/10 px-6 py-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedAnnouncement(null);
                }}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={submitting}
                className="rounded-xl bg-gradient-to-r from-red-500 to-red-600 px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-red-500/30 transition-all hover:scale-105 hover:shadow-red-500/50 disabled:opacity-50"
              >
                {submitting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && selectedAnnouncement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => {
            setShowPreviewModal(false);
            setSelectedAnnouncement(null);
          }} />
          <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-gray-900 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <h2 className="text-xl font-bold text-white">Preview Announcement</h2>
              <button
                onClick={() => {
                  setShowPreviewModal(false);
                  setSelectedAnnouncement(null);
                }}
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-6">
              <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                <div className="flex items-center gap-3 mb-4">
                  {(() => {
                    const typeConfig = announcementTypeConfig[selectedAnnouncement.type];
                    const TypeIcon = typeConfig.icon;
                    return (
                      <div className={`rounded-lg p-2 ${typeConfig.color}`}>
                        <TypeIcon size={20} />
                      </div>
                    );
                  })()}
                  <h3 className="text-lg font-bold text-white">{selectedAnnouncement.title}</h3>
                </div>
                <div className="text-gray-300 whitespace-pre-wrap">{selectedAnnouncement.content}</div>
                <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock size={14} />
                    <span>Created: {format(new Date(selectedAnnouncement.created_at), 'MMM d, yyyy HH:mm')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users size={14} />
                    <span>By: {selectedAnnouncement.created_by?.username || 'Unknown'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end border-t border-white/10 px-6 py-4">
              <button
                onClick={() => {
                  setShowPreviewModal(false);
                  setSelectedAnnouncement(null);
                }}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnouncementsPage;
