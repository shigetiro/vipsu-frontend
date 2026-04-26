import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AlertTriangle, X, Calendar, Shield, Trash2, ChevronDown } from 'lucide-react';

interface BanUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number | null;
  username: string;
  onSuccess: () => void;
}

type BanDuration = 'permanent' | 'temporary';
type BanType = 'restrict' | 'full';

interface BanFormData {
  reason: string;
  duration: BanDuration;
  temporaryEndDate: string;
  banType: BanType;
  wipeUserData: boolean;
}

const BanUserModal: React.FC<BanUserModalProps> = ({
  isOpen,
  onClose,
  userId,
  username,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<BanFormData>({
    reason: '',
    duration: 'permanent',
    temporaryEndDate: '',
    banType: 'full',
    wipeUserData: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const reasonRef = useRef<HTMLTextAreaElement>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        reason: '',
        duration: 'permanent',
        temporaryEndDate: '',
        banType: 'full',
        wipeUserData: false,
      });
      setError(null);
      setIsSubmitting(false);
      // Focus the reason textarea after a short delay
      setTimeout(() => {
        reasonRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  // Check if date is in the past (comparing dates only, not timestamps)
  const isDateInPast = (dateStr: string): boolean => {
    if (!dateStr) return false;
    const selectedDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    return selectedDate <= today;
  };

  const isFormValid = useCallback((): boolean => {
    if (!formData.reason.trim()) return false;
    if (formData.duration === 'temporary') {
      if (!formData.temporaryEndDate) return false;
      if (isDateInPast(formData.temporaryEndDate)) return false;
    }
    return true;
  }, [formData]);

  const handleSubmit = async () => {
    if (userId === null || !isFormValid()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/users/${userId}/ban`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          reason: formData.reason.trim(),
          duration: formData.duration,
          ends_at: formData.duration === 'temporary' && formData.temporaryEndDate
            ? new Date(formData.temporaryEndDate).toISOString()
            : null,
          ban_type: formData.banType,
          wipe_user_data: formData.wipeUserData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to ban user: ${response.status}`);
      }

      // Success - trigger refresh and close
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDurationChange = (duration: BanDuration) => {
    setFormData(prev => ({
      ...prev,
      duration,
      temporaryEndDate: duration === 'permanent' ? '' : prev.temporaryEndDate,
    }));
  };

  if (!isOpen || userId === null) return null;

  // Calculate minimum date (tomorrow)
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split('T')[0];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ban-modal-title"
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={isSubmitting ? undefined : onClose}
        aria-hidden="true"
      />
      
      {/* Modal Content */}
      <div 
        ref={modalRef}
        className="relative bg-gray-900 rounded-xl shadow-2xl w-full max-w-lg border border-gray-700 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-5 border-b border-gray-700 sticky top-0 bg-gray-900 rounded-t-xl">
          <div className="p-2 bg-red-500/20 rounded-lg flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-red-500" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 id="ban-modal-title" className="text-xl font-semibold text-white">
              Ban User
            </h2>
            <p className="text-sm text-gray-400 truncate">
              Target: <span className="text-white font-medium">{username}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
            disabled={isSubmitting}
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-5">
          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg" role="alert">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Reason Field */}
          <div>
            <label htmlFor="ban-reason" className="block text-sm font-medium text-gray-300 mb-2">
              Reason <span className="text-red-400">*</span>
            </label>
            <textarea
              id="ban-reason"
              ref={reasonRef}
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="Enter the reason for this ban..."
              className="w-full h-24 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              disabled={isSubmitting}
            />
          </div>

          {/* Duration Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Duration
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleDurationChange('permanent')}
                className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all ${
                  formData.duration === 'permanent'
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
                disabled={isSubmitting}
              >
                Permanent
              </button>
              <button
                type="button"
                onClick={() => handleDurationChange('temporary')}
                className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all ${
                  formData.duration === 'temporary'
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
                disabled={isSubmitting}
              >
                Temporary
              </button>
            </div>
          </div>

          {/* Temporary End Date */}
          {formData.duration === 'temporary' && (
            <div>
              <label htmlFor="ban-end-date" className="block text-sm font-medium text-gray-300 mb-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" aria-hidden="true" />
                  End Date <span className="text-red-400">*</span>
                </div>
              </label>
              <input
                id="ban-end-date"
                type="date"
                value={formData.temporaryEndDate}
                onChange={(e) => setFormData(prev => ({ ...prev, temporaryEndDate: e.target.value }))}
                min={minDateStr}
                className="w-full px-3 py-2.5 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                disabled={isSubmitting}
              />
              {formData.temporaryEndDate && isDateInPast(formData.temporaryEndDate) && (
                <p className="mt-1.5 text-sm text-red-400" role="alert">
                  End date must be in the future
                </p>
              )}
            </div>
          )}

          {/* Ban Type Selection */}
          <div>
            <label htmlFor="ban-type" className="block text-sm font-medium text-gray-300 mb-2">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" aria-hidden="true" />
                Ban Type
              </div>
            </label>
            <div className="relative">
              <select
                id="ban-type"
                value={formData.banType}
                onChange={(e) => setFormData(prev => ({ ...prev, banType: e.target.value as BanType }))}
                className="w-full px-3 py-2.5 pr-10 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent appearance-none cursor-pointer"
                disabled={isSubmitting}
              >
                <option value="restrict">Restrict - Can only spectate and chat</option>
                <option value="full">Full Ban - Cannot login</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" aria-hidden="true" />
            </div>
          </div>

          {/* Wipe User Data Checkbox */}
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.wipeUserData}
                onChange={(e) => setFormData(prev => ({ ...prev, wipeUserData: e.target.checked }))}
                className="mt-0.5 w-5 h-5 rounded border-gray-600 bg-gray-800 text-red-500 focus:ring-red-500 focus:ring-offset-gray-900 flex-shrink-0"
                disabled={isSubmitting}
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 text-white font-medium">
                  <Trash2 className="w-4 h-4 text-red-400" aria-hidden="true" />
                  Also wipe user data
                </div>
                <p className="mt-1 text-sm text-gray-400">
                  This will permanently delete all scores, statistics, and achievements. This action cannot be undone.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-5 border-t border-gray-700 sticky bottom-0 bg-gray-900 rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-gray-800 text-gray-300 rounded-lg font-medium hover:bg-gray-700 transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isFormValid() || isSubmitting}
            className="px-6 py-2.5 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" />
                Banning...
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4" aria-hidden="true" />
                Ban User
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BanUserModal;