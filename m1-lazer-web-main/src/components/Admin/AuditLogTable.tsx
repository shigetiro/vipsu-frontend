import React from 'react';
import type { AuditLog } from '../../api/admin.tsx';

interface AuditLogTableProps {
  logs: AuditLog[];
  loading?: boolean;
  onRowClick: (log: AuditLog) => void;
  sortBy?: 'created_at' | 'actor_username' | 'action_type' | 'target_name';
  sortOrder?: 'asc' | 'desc';
  onSort?: (column: 'created_at' | 'actor_username' | 'action_type' | 'target_name') => void;
}

const ACTION_TYPE_COLORS: Record<string, string> = {
  USER_BAN: 'bg-red-500/20 text-red-400 border-red-500/30',
  USER_UNBAN: 'bg-green-500/20 text-green-400 border-green-500/30',
  USER_ROLE_CHANGE: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  BEATMAP_DELETE: 'bg-red-500/20 text-red-400 border-red-500/30',
  BEATMAP_RANK: 'bg-green-500/20 text-green-400 border-green-500/30',
  BEATMAP_UNRANK: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  SCORE_DELETE: 'bg-red-500/20 text-red-400 border-red-500/30',
  TEAM_DISBAND: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  SETTINGS_CHANGE: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  ANNOUNCEMENT_CREATE: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  MAINTENANCE_MODE_TOGGLE: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
};

const ACTION_TYPE_LABELS: Record<string, string> = {
  USER_BAN: 'User Ban',
  USER_UNBAN: 'User Unban',
  USER_ROLE_CHANGE: 'Role Change',
  BEATMAP_DELETE: 'Beatmap Delete',
  BEATMAP_RANK: 'Beatmap Rank',
  BEATMAP_UNRANK: 'Beatmap Unrank',
  SCORE_DELETE: 'Score Delete',
  TEAM_DISBAND: 'Team Disband',
  SETTINGS_CHANGE: 'Settings Change',
  ANNOUNCEMENT_CREATE: 'Announcement Create',
  MAINTENANCE_MODE_TOGGLE: 'Maintenance Toggle',
};

const DEFAULT_AVATAR = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDMyIDMyIj48Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSIxNiIgZmlsbD0iIzRiNTU2MyIvPjx0ZXh0IHg9IjE2IiB5PSIyMCIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+PzwvdGV4dD48L3N2Zz4=';

function getActionTypeColor(actionType: string): string {
  return ACTION_TYPE_COLORS[actionType] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
}

function getActionTypeLabel(actionType: string): string {
  return ACTION_TYPE_LABELS[actionType] || actionType;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export const AuditLogTable: React.FC<AuditLogTableProps> = ({
  logs,
  loading = false,
  onRowClick,
  sortBy,
  sortOrder,
  onSort,
}) => {
  // Ensure logs is always an array
  const safeLogs = Array.isArray(logs) ? logs : [];

  const handleKeyDown = (e: React.KeyboardEvent, log: AuditLog) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onRowClick(log);
    }
  };


  const handleSort = (column: 'created_at' | 'actor_username' | 'action_type' | 'target_name') => {
    if (onSort) {
      onSort(column);
    }
  };

  const renderSortIcon = (column: 'created_at' | 'actor_username' | 'action_type' | 'target_name') => {
    if (sortBy !== column) {
      return (
        <svg className="w-4 h-4 text-slate-500 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortOrder === 'asc' ? (
      <svg className="w-4 h-4 text-slate-300 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-slate-300 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  if (loading) {
    return (
      <div className="bg-slate-800/50 rounded-lg overflow-hidden">
        <div className="animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 border-b border-slate-700/50">
              <div className="h-4 bg-slate-700 rounded w-32" />
              <div className="h-8 w-8 bg-slate-700 rounded-full" />
              <div className="h-4 bg-slate-700 rounded w-24" />
              <div className="h-4 bg-slate-700 rounded w-20" />
              <div className="h-4 bg-slate-700 rounded w-32" />
              <div className="h-4 bg-slate-700 rounded flex-1" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!safeLogs || safeLogs.length === 0) {
    return (
      <div className="bg-slate-800/50 rounded-lg p-12 text-center">
        <svg
          className="mx-auto h-12 w-12 text-slate-500 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p className="text-slate-400 text-lg">No audit logs found</p>
        <p className="text-slate-500 text-sm mt-1">
          Audit logs will appear here when administrative actions are performed
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-900/50 text-left">
              <th
                className={`px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider ${onSort ? 'cursor-pointer hover:text-slate-300 select-none' : ''}`}
                onClick={() => handleSort('created_at')}
              >
                <div className="flex items-center">
                  Timestamp
                  {onSort && renderSortIcon('created_at')}
                </div>
              </th>
              <th
                className={`px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider ${onSort ? 'cursor-pointer hover:text-slate-300 select-none' : ''}`}
                onClick={() => handleSort('actor_username')}
              >
                <div className="flex items-center">
                  Actor
                  {onSort && renderSortIcon('actor_username')}
                </div>
              </th>
              <th
                className={`px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider ${onSort ? 'cursor-pointer hover:text-slate-300 select-none' : ''}`}
                onClick={() => handleSort('action_type')}
              >
                <div className="flex items-center">
                  Action
                  {onSort && renderSortIcon('action_type')}
                </div>
              </th>
              <th
                className={`px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider ${onSort ? 'cursor-pointer hover:text-slate-300 select-none' : ''}`}
                onClick={() => handleSort('target_name')}
              >
                <div className="flex items-center">
                  Target
                  {onSort && renderSortIcon('target_name')}
                </div>
              </th>
              <th className="px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                Reason
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {safeLogs.map((log) => (
              <tr
                key={log.id}
                onClick={() => onRowClick(log)}
                onKeyDown={(e) => handleKeyDown(e, log)}
                tabIndex={0}
                role="button"
                aria-label={`View details for ${getActionTypeLabel(log.action_type)} by ${log.actor_username}`}
                className="hover:bg-slate-700/30 cursor-pointer transition-colors duration-150 focus:outline-none focus:bg-slate-700/50"
              >
                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-300">
                  {formatDate(log.created_at)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <img
                      src={log.actor_avatar_url || DEFAULT_AVATAR}
                      alt={log.actor_username}
                      className="h-8 w-8 rounded-full bg-slate-600 object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = DEFAULT_AVATAR;
                      }}
                    />
                    <span className="text-sm text-slate-200 font-medium">
                      {log.actor_username || '[Deleted User]'}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getActionTypeColor(log.action_type)}`}
                  >
                    {getActionTypeLabel(log.action_type)}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="text-sm text-slate-200">
                      {truncateText(log.target_name, 30)}
                    </span>
                    <span className="text-xs text-slate-500">
                      {log.target_type}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-slate-400 max-w-xs">
                  {log.reason ? (
                    <span title={log.reason}>{truncateText(log.reason, 50)}</span>
                  ) : (
                    <span className="text-slate-600">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditLogTable;