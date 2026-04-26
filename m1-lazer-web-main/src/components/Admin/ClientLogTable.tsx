import React from 'react';
import { formatDistanceToNow } from 'date-fns';

export type ClientLogType = 'CRASH' | 'ERROR' | 'WARNING' | 'PERFORMANCE' | 'INFO';

export interface ClientLogEntry {
  id: string;
  user_id: string | null;
  username: string;
  client_version: string;
  os_version: string | null;
  created_at: string;
}

interface ClientLogTableProps {
  logs: ClientLogEntry[];
  loading?: boolean;
  onRowClick: (log: ClientLogEntry) => void;
}

export const ClientLogTable: React.FC<ClientLogTableProps> = ({
  logs,
  loading = false,
  onRowClick,
}) => {
  // Ensure logs is an array to prevent .map() errors
  const safeLogs = Array.isArray(logs) ? logs : [];

  if (loading) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Timestamp</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">User</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Client Version</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">OS Version</th>
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i} className="border-b border-gray-700/50">
                <td className="px-4 py-3">
                  <div className="h-4 w-32 bg-gray-700 rounded animate-pulse" />
                </td>
                <td className="px-4 py-3">
                  <div className="h-4 w-24 bg-gray-700 rounded animate-pulse" />
                </td>
                <td className="px-4 py-3">
                  <div className="h-4 w-20 bg-gray-700 rounded animate-pulse" />
                </td>
                <td className="px-4 py-3">
                  <div className="h-4 w-32 bg-gray-700 rounded animate-pulse" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (!safeLogs || safeLogs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <svg
          className="w-12 h-12 mb-4 opacity-50"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p className="text-lg font-medium">No client logs found</p>
        <p className="text-sm opacity-75">Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-700">
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Timestamp</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">User</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Client Version</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">OS Version</th>
          </tr>
        </thead>
        <tbody>
          {safeLogs.map((log) => (
            <tr
              key={log.id}
              onClick={() => onRowClick(log)}
              className="border-b border-gray-700/50 hover:bg-gray-800/50 cursor-pointer transition-colors"
            >
              <td className="px-4 py-3 text-sm text-gray-300 whitespace-nowrap">
                <span title={new Date(log.created_at).toLocaleString()}>
                  {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center text-xs font-medium text-gray-300">
                    {(log.username || 'Anon')[0].toUpperCase()}
                  </div>
                  <span className="text-sm text-gray-200">
                    {log.username || 'Anonymous'}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-gray-400 font-mono">
                {log.client_version || 'Unknown'}
              </td>
              <td className="px-4 py-3 text-sm text-gray-400">
                {log.os_version || 'Unknown'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ClientLogTable;