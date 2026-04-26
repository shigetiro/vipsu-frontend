import React, { useMemo, useState, useEffect } from 'react';
import type { AuditLog, AuditActionType, TargetType } from '../../api/admin.tsx';

const ACTION_TYPE_COLORS: Record<AuditActionType, string> = {
  USER_BAN: 'bg-red-500/20 text-red-400 border-red-500/30',
  USER_UNBAN: 'bg-green-500/20 text-green-400 border-green-500/30',
  USER_ROLE_CHANGE: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  BEATMAP_DELETE: 'bg-red-500/20 text-red-400 border-red-500/30',
  BEATMAP_RANK: 'bg-green-500/20 text-green-400 border-green-500/30',
  BEATMAP_UNRANK: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  SCORE_DELETE: 'bg-red-500/20 text-red-400 border-red-500/30',
  TEAM_DISBAND: 'bg-red-500/20 text-red-400 border-red-500/30',
  SETTINGS_CHANGE: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

const ACTION_TYPE_LABELS: Record<AuditActionType, string> = {
  USER_BAN: 'User Banned',
  USER_UNBAN: 'User Unbanned',
  USER_ROLE_CHANGE: 'Role Changed',
  BEATMAP_DELETE: 'Beatmap Deleted',
  BEATMAP_RANK: 'Beatmap Ranked',
  BEATMAP_UNRANK: 'Beatmap Unranked',
  SCORE_DELETE: 'Score Deleted',
  TEAM_DISBAND: 'Team Disbanded',
  SETTINGS_CHANGE: 'Settings Changed',
};

const TARGET_TYPE_LABELS: Record<TargetType, string> = {
  USER: 'User',
  BEATMAP: 'Beatmap',
  SCORE: 'Score',
  TEAM: 'Team',
};

const formatTimestamp = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  });
};

const JsonViewer: React.FC<{ data: Record<string, unknown> }> = ({ data }) => {
  const formattedJson = useMemo(() => {
    return JSON.stringify(data, null, 2);
  }, [data]);

  const highlightedJson = useMemo(() => {
    return formattedJson
      .replace(/"([^"]+)":/g, '<span class="text-purple-400">"$1"</span>:')
      .replace(/: "([^"]*)"/g, ': <span class="text-green-400">"$1"</span>')
      .replace(/: (\d+)/g, ': <span class="text-blue-400">$1</span>')
      .replace(/: (true|false)/g, ': <span class="text-yellow-400">$1</span>')
      .replace(/: (null)/g, ': <span class="text-gray-500">$1</span>');
  }, [formattedJson]);

  if (Object.keys(data).length === 0) {
    return (
      <div className="text-gray-500 italic text-sm">
        No additional metadata
      </div>
    );
  }

  return (
    <pre
      className="bg-gray-900/50 rounded-lg p-4 overflow-auto max-h-64 text-sm font-mono border border-gray-700/50"
      dangerouslySetInnerHTML={{ __html: highlightedJson }}
    />
  );
};

// Expandable Reason Component
interface ExpandableReasonProps {
  reason: string;
  maxLength?: number;
}

const ExpandableReason: React.FC<ExpandableReasonProps> = ({ reason, maxLength = 150 }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showExpandButton, setShowExpandButton] = useState(false);
  const reasonRef = React.useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (reason.length > maxLength) {
      setShowExpandButton(true);
    }
  }, [reason, maxLength]);

  const truncatedReason = !isExpanded && reason.length > maxLength
    ? reason.substring(0, maxLength).trim() + '...'
    : reason;

  return (
    <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide">
          Reason
        </h3>
        {showExpandButton && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
            aria-expanded={isExpanded}
          >
            {isExpanded ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
                Collapse
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                Expand
              </>
            )}
          </button>
        )}
      </div>
      <div className="overflow-hidden">
        <p
          ref={reasonRef}
          className={`text-gray-200 whitespace-pre-wrap transition-all duration-300 ${
            isExpanded ? 'max-h-none' : 'max-h-24'
          }`}
        >
          {truncatedReason}
        </p>
      </div>
      {showExpandButton && !isExpanded && (
        <div className="mt-2 pt-2 border-t border-gray-700/50">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-gray-400 hover:text-gray-300 transition-colors"
          >
            Show more...
          </button>
        </div>
      )}
    </div>
  );
};

interface AuditLogDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: AuditLog | null;
}

export const AuditLogDetailModal: React.FC<AuditLogDetailModalProps> = ({
  isOpen,
  onClose,
  log,
}) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const actionColorClass = log
    ? ACTION_TYPE_COLORS[log.action_type] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    : '';

  const actionLabel = log
    ? ACTION_TYPE_LABELS[log.action_type] || log.action_type
    : '';

  const targetTypeLabel = log
    ? TARGET_TYPE_LABELS[log.target_type] || log.target_type
    : '';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="audit-log-modal-title"
      tabIndex={-1}
    >
      <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h2 id="audit-log-modal-title" className="text-xl font-semibold text-white">
            Audit Log Details
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-700"
            aria-label="Close modal"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          {log ? (
            <div className="space-y-6">
              {/* Action Type Badge */}
              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${actionColorClass}`}
                >
                  {actionLabel}
                </span>
                <span className="text-gray-400 text-sm">
                  {formatTimestamp(log.created_at)}
                </span>
              </div>

              {/* Actor Section */}
              <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/50">
                <h3 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wide">
                  Actor
                </h3>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                    {log.actor_username?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div className="flex-1">
                    <div className="text-white font-medium">
                      {log.actor_username || '[Deleted User]'}
                    </div>
                    <div className="text-gray-400 text-sm">
                      ID: {log.actor_id}
                    </div>
                    {log.ip_address && (
                      <div className="text-gray-500 text-xs mt-1">
                        IP: {log.ip_address}
                      </div>
                    )}
                  </div>
                  <a
                    href={`/users/${log.actor_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 transition-colors"
                  >
                    View Profile
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>

              {/* Target Section */}
              <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/50">
                <h3 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wide">
                  Target
                </h3>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-700 text-gray-300">
                        {targetTypeLabel}
                      </span>
                    </div>
                    <div className="text-white font-medium">
                      {log.target_name || '[Deleted]'}
                    </div>
                    <div className="text-gray-400 text-sm">
                      ID: {log.target_id}
                    </div>
                  </div>
                  {log.target_type !== 'SYSTEM' && (
                    <a href={
                      log.target_type === 'BEATMAPSET'
                        ? `/beatmapsets/${log.target_id}`
                        : log.target_type === 'BEATMAP'
                        ? `/beatmaps/${log.target_id}`
                        : `/${log.target_type.toLowerCase()}s/${log.target_id}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 transition-colors"
                    >
                      View {targetTypeLabel}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}
                </div>
              </div>

              {/* Reason Section - Expandable */}
              {log.reason && <ExpandableReason reason={log.reason} />}

              {/* Metadata Section */}
              <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/50">
                <h3 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wide">
                  Metadata
                </h3>
                <JsonViewer data={log.metadata || {}} />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-400">No audit log selected</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuditLogDetailModal;
