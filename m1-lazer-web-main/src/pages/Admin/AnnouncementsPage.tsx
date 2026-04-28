import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../utils/api';
import { toast } from 'react-hot-toast';
import {
  Megaphone,
  Send,
  X,
  Info,
  AlertTriangle,
  AlertCircle,
  MessageSquare,
  Users,
  Globe,
  Check,
  AlertOctagon,
} from 'lucide-react';

type Severity = 'info' | 'warning' | 'error';

interface GlobalAnnouncementFormData {
  title: string;
  message: string;
  severity: Severity;
  also_send_pm: boolean;
  online_only: boolean;
  show_popup: boolean;
  sender_username: string;
}

interface AnnouncementResult {
  sent_to: number;
  severity: string;
  title: string;
  online_only: boolean;
  sender_username: string;
}

const severityConfig = {
  info: {
    icon: Info,
    color: 'text-blue-400 bg-blue-500/20 border-blue-500/30',
    label: 'Info',
    description: 'General information announcement',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30',
    label: 'Warning',
    description: 'Important warning that requires attention',
  },
  error: {
    icon: AlertOctagon,
    color: 'text-red-400 bg-red-500/20 border-red-500/30',
    label: 'Error',
    description: 'Critical alert for important issues',
  },
};

const INITIAL_FORM_DATA: GlobalAnnouncementFormData = {
  title: '',
  message: '',
  severity: 'info',
  also_send_pm: false,
  online_only: false,
  show_popup: true,
  sender_username: 'BanchoBot',
};

export const AnnouncementsPage: React.FC = () => {
  const [formData, setFormData] = useState<GlobalAnnouncementFormData>(INITIAL_FORM_DATA);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof GlobalAnnouncementFormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<AnnouncementResult | null>(null);
  const [showResult, setShowResult] = useState(false);

  // Validate form
  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof GlobalAnnouncementFormData, string>> = {};

    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    } else if (formData.title.length > 100) {
      errors.title = 'Title must be 100 characters or less';
    }

    if (!formData.message.trim()) {
      errors.message = 'Message is required';
    } else if (formData.message.length > 1000) {
      errors.message = 'Message must be 1000 characters or less';
    }

    if (!formData.sender_username.trim()) {
      errors.sender_username = 'Sender username is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    setShowResult(false);

    try {
      const result = await adminAPI.sendGlobalAnnouncement({
        title: formData.title.trim(),
        message: formData.message.trim(),
        severity: formData.severity,
        also_send_pm: formData.also_send_pm,
        online_only: formData.online_only,
        show_popup: formData.show_popup,
        sender_username: formData.sender_username.trim() || undefined,
        sender_user_id: null,
      });

      setLastResult(result);
      setShowResult(true);
      toast.success(`Announcement sent to ${result.sent_to} users`);

      // Reset form after successful send
      setFormData(INITIAL_FORM_DATA);
    } catch (error: any) {
      const errorMsg = error?.response?.data?.detail || error?.message || 'Failed to send announcement';
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (
    field: keyof GlobalAnnouncementFormData,
    value: string | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when field changes
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const SelectedSeverityIcon = severityConfig[formData.severity].icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Send Global Announcement</h2>
        <p className="text-sm text-gray-400">
          Send an in-app announcement to all users via WebSocket notification
        </p>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Result Banner */}
        {showResult && lastResult && (
          <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-green-500/20 p-1">
                <Check className="h-5 w-5 text-green-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-green-400">
                  Announcement sent successfully!
                </h3>
                <p className="text-sm text-gray-300 mt-1">
                  Sent to <span className="font-bold text-white">{lastResult.sent_to}</span> users
                  {lastResult.online_only ? ' (online only)' : ' (all users)'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  "{lastResult.title}" from {lastResult.sender_username}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowResult(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Preview */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Megaphone className="h-5 w-5 text-pink-400" />
            <h3 className="font-semibold text-white">Preview</h3>
          </div>
          <div className="flex items-start gap-3">
            <div className={`rounded-lg p-2 ${severityConfig[formData.severity].color}`}>
              <SelectedSeverityIcon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-white">
                {formData.title.trim() || 'Announcement Title'}
              </h4>
              <p className="text-gray-300 mt-1 whitespace-pre-wrap">
                {formData.message.trim() || 'Your announcement message will appear here...'}
              </p>
            </div>
          </div>
        </div>

        {/* Severity Selection */}
        <div>
          <label className="mb-3 block text-sm font-medium text-gray-300">
            Severity
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(Object.keys(severityConfig) as Severity[]).map((severity) => {
              const config = severityConfig[severity];
              const Icon = config.icon;
              const isSelected = formData.severity === severity;

              return (
                <button
                  key={severity}
                  type="button"
                  onClick={() => handleChange('severity', severity)}
                  className={`group relative flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all duration-200 ${
                    isSelected
                      ? `bg-white/10 ${config.color.split(' ')[2]}`
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className={`rounded-lg p-2 ${isSelected ? config.color : 'bg-white/5'}`}>
                    <Icon className={`h-5 w-5 ${isSelected ? config.color.split(' ')[0] : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <span className={`font-medium ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                      {config.label}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">{config.description}</p>
                  </div>
                  {isSelected && (
                    <div className="absolute top-3 right-3">
                      <div className="rounded-full bg-pink-500/20 p-1">
                        <Check className="h-3 w-3 text-pink-400" />
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Title Input */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-300">
            Title <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            className={`w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 focus:border-pink-500/50 focus:outline-none focus:ring-2 focus:ring-pink-500/20 transition-all ${
              formErrors.title ? 'border-red-500/50 focus:border-red-500 ring-red-500/20' : ''
            }`}
            placeholder="Enter announcement title..."
            maxLength={100}
          />
          {formErrors.title && (
            <p className="mt-1 text-sm text-red-400">{formErrors.title}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">{formData.title.length}/100</p>
        </div>

        {/* Message Input */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-300">
            Message <span className="text-red-400">*</span>
          </label>
          <textarea
            value={formData.message}
            onChange={(e) => handleChange('message', e.target.value)}
            className={`w-full min-h-[150px] rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 focus:border-pink-500/50 focus:outline-none focus:ring-2 focus:ring-pink-500/20 transition-all resize-none ${
              formErrors.message ? 'border-red-500/50 focus:border-red-500 ring-red-500/20' : ''
            }`}
            placeholder="Enter the announcement message..."
            maxLength={1000}
          />
          {formErrors.message && (
            <p className="mt-1 text-sm text-red-400">{formErrors.message}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">{formData.message.length}/1000</p>
        </div>

        {/* Sender Username */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-300">
            Sender Username <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={formData.sender_username}
            onChange={(e) => handleChange('sender_username', e.target.value)}
            className={`w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 focus:border-pink-500/50 focus:outline-none focus:ring-2 focus:ring-pink-500/20 transition-all ${
              formErrors.sender_username ? 'border-red-500/50 focus:border-red-500 ring-red-500/20' : ''
            }`}
            placeholder="e.g., g0v0, admin, system"
          />
          {formErrors.sender_username && (
            <p className="mt-1 text-sm text-red-400">{formErrors.sender_username}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            The username that will appear as the sender of this announcement
          </p>
        </div>

        {/* Target Options */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-300">
            Target Options
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Online Users Toggle */}
            <label className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-all ${
              formData.online_only
                ? 'bg-pink-500/10 border-pink-500/30'
                : 'border-white/10 bg-white/5 hover:bg-white/10'
            }`}>
              <div className="mt-0.5">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={formData.online_only}
                    onChange={() => handleChange('online_only', !formData.online_only)}
                    className="sr-only"
                  />
                  <div className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-all ${
                    formData.online_only
                      ? 'bg-pink-500 border-pink-500'
                      : 'border-gray-500 bg-transparent'
                  }`}>
                    {formData.online_only && <Check className="h-3 w-3 text-white" />}
                  </div>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Globe className={`h-4 w-4 ${formData.online_only ? 'text-pink-400' : 'text-gray-400'}`} />
                  <span className={`font-medium ${formData.online_only ? 'text-white' : 'text-gray-300'}`}>
                    Online Users Only
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Send only to users currently connected to the notification server
                </p>
              </div>
            </label>

            {/* Send PM Toggle */}
            <label className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-all ${
              formData.also_send_pm
                ? 'bg-pink-500/10 border-pink-500/30'
                : 'border-white/10 bg-white/5 hover:bg-white/10'
            }`}>
              <div className="mt-0.5">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={formData.also_send_pm}
                    onChange={() => handleChange('also_send_pm', !formData.also_send_pm)}
                    className="sr-only"
                  />
                  <div className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-all ${
                    formData.also_send_pm
                      ? 'bg-pink-500 border-pink-500'
                      : 'border-gray-500 bg-transparent'
                  }`}>
                    {formData.also_send_pm && <Check className="h-3 w-3 text-white" />}
                  </div>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <MessageSquare className={`h-4 w-4 ${formData.also_send_pm ? 'text-pink-400' : 'text-gray-400'}`} />
                  <span className={`font-medium ${formData.also_send_pm ? 'text-white' : 'text-gray-300'}`}>
                    Also Send as PM
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Send a private message copy to each recipient
          </p>
        </div>
      </label>

      {/* Show Popup Toggle */}
      <label className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-all ${
        formData.show_popup
          ? 'bg-pink-500/10 border-pink-500/30'
          : 'border-white/10 bg-white/5 hover:bg-white/10'
      }`}>
        <div className="mt-0.5">
          <div className="relative">
            <input
              type="checkbox"
              checked={formData.show_popup}
              onChange={() => handleChange('show_popup', !formData.show_popup)}
              className="sr-only"
            />
            <div className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-all ${
              formData.show_popup
                ? 'bg-pink-500 border-pink-500'
                : 'border-gray-500 bg-transparent'
            }`}>
              {formData.show_popup && <Check className="h-3 w-3 text-white" />}
            </div>
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Megaphone className={`h-4 w-4 ${formData.show_popup ? 'text-pink-400' : 'text-gray-400'}`} />
            <span className={`font-medium ${formData.show_popup ? 'text-white' : 'text-gray-300'}`}>
              Show Popup
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Show as medal popup overlay (disable for small announcements)
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Helper Info */}
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-400">How it works</h4>
              <ul className="text-sm text-gray-300 mt-2 space-y-1">
                <li>• Users will receive the notification immediately via WebSocket</li>
                <li>
                  •{' '}
                  <span className="font-medium">online_only</span>: Only users currently connected will receive it
                </li>
                <li>
                  •{' '}
                  <span className="font-medium">also_send_pm</span>: Creates a private message from the sender account
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              setFormData(INITIAL_FORM_DATA);
              setFormErrors({});
              setShowResult(false);
            }}
            className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
            disabled={submitting}
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-pink-600 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-pink-500/30 transition-all hover:scale-105 hover:shadow-pink-500/50 disabled:opacity-50 disabled:hover:scale-100"
          >
            {submitting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send Announcement
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AnnouncementsPage;
