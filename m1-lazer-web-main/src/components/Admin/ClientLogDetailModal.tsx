import React, { useState } from 'react';
import type { ClientLog } from '../../api/admin';

interface ClientLogDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: ClientLog | null;
  onDelete: () => void;
}

const LOG_TYPE_COLORS: Record<string, string> = {
  CRASH: 'bg-red-500 text-white',
  ERROR: 'bg-orange-500 text-white',
  WARNING: 'bg-yellow-500 text-black',
  INFO: 'bg-blue-500 text-white',
  PERFORMANCE: 'bg-gray-500 text-white',
};

const LOG_TYPE_LABELS: Record<string, string> = {
  CRASH: 'Crash',
  ERROR: 'Error',
  WARNING: 'Warning',
  INFO: 'Info',
  PERFORMANCE: 'Performance',
};

export const ClientLogDetailModal: React.FC<ClientLogDetailModalProps> = ({
  isOpen,
  onClose,
  log,
  onDelete,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen || !log) return null;

  const handleDelete = async () => {
    if (!log) return;
    setIsDeleting(true);
    try {
      const { deleteClientLog } = await import('../../api/admin.tsx');
      await deleteClientLog(log.id);
      setShowDeleteConfirm(false);
      onDelete();
      onClose();
    } catch (error) {
      console.error('Failed to delete client log:', error);
      alert('Failed to delete log. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getLogTypeColor = (type: string) => LOG_TYPE_COLORS[type] || 'bg-gray-500 text-white';
  const getLogTypeLabel = (type: string) => LOG_TYPE_LABELS[type] || type;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-gray-800 rounded-xl border border-gray-700 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Client Log Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 space-y-6">
          {/* Type and Timestamp */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getLogTypeColor(log.log_type)}`}>
                {getLogTypeLabel(log.log_type)}
              </span>
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-700 text-gray-300">
                {log.client_version || 'Unknown Version'}
              </span>
            </div>
            <span className="text-gray-400 text-sm">{formatTimestamp(log.created_at)}</span>
          </div>

          {/* User Info */}
          <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
            <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-3">User</h4>
            <div className="flex items-center">
              {log.user_id ? (
                <a
                  href={`/users/${log.user_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-white hover:text-pink-400 transition-colors"
                >
                  <img
                    src={`https://a.ppy.sh/${log.user_id}`}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover bg-gray-700"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/default-avatar.png';
                    }}
                  />
                  <span className="font-medium">{log.username || `User #${log.user_id}`}</span>
                </a>
              ) : (
                <span className="text-gray-400 italic">Anonymous Submission</span>
              )}
            </div>
          </div>

          {/* Client Info */}
          <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
            <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-3">Client Information</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-gray-500 block mb-1">Client Version</span>
                <span className="text-white font-mono text-sm">{log.client_version || 'Not provided'}</span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block mb-1">OS Version</span>
                <span className="text-white font-mono text-sm">{log.os_version || 'Not provided'}</span>
              </div>
              {log.client_hash && (
                <div className="col-span-2">
                  <span className="text-xs text-gray-500 block mb-1">Client Hash</span>
                  <span className="text-gray-300 font-mono text-sm break-all">{log.client_hash}</span>
                </div>
              )}
            </div>
          </div>

          {/* Message */}
          <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
            <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-3">Message</h4>
            <div className="bg-gray-800 rounded-lg p-4 text-sm text-gray-200 whitespace-pre-wrap break-words max-h-[200px] overflow-y-auto">
              {log.message || 'No message provided'}
            </div>
          </div>

          {/* Stack Trace */}
          {log.stack_trace && (
            <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
              <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-3">Stack Trace</h4>
              <pre className="bg-gray-800 rounded-lg p-4 text-xs text-red-400 font-mono whitespace-pre-wrap break-words max-h-[400px] overflow-y-auto">
                {log.stack_trace}
              </pre>
            </div>
          )}

          {/* Metadata */}
          {log.metadata && Object.keys(log.metadata).length > 0 && (
            <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
              <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-3">Metadata</h4>
              <pre className="bg-gray-800 rounded-lg p-4 text-xs text-gray-300 font-mono whitespace-pre-wrap break-words max-h-[300px] overflow-y-auto">
                {JSON.stringify(log.metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700">
          {!showDeleteConfirm ? (
            <div className="flex justify-end">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Log
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <p className="text-red-400 text-center">Are you sure you want to delete this log?</p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Yes, Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientLogDetailModal;
