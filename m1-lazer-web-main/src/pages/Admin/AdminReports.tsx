import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { adminAPI } from '../../utils/api';
import type { User } from '../../types/user';
import { Link } from 'react-router-dom';

type ReportStatus = 'open' | 'closed' | 'actioned';

interface Report {
  id: number;
  reporter: User;
  reported: User;
  reason: string;
  created_at: string;
  status: ReportStatus;
}

const AdminReports: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'all'>('open');
  const [search, setSearch] = useState('');

  const loadReports = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getReports({
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: search || undefined,
      });
      setReports(Array.isArray(data) ? data : (data?.items ?? []));
    } catch (error) {
      console.error('Failed to load reports', error);
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []); // initial

  const handleResolve = async (reportId: number, action: 'close' | 'ban' | 'warn') => {
    try {
      await adminAPI.resolveReport(reportId, { action });
      toast.success('Report resolved');
      loadReports();
    } catch (error) {
      console.error('Failed to resolve report', error);
      toast.error('Failed to resolve report');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Reports</h2>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search by user or reason"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ReportStatus | 'all')}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
          >
            <option value="open">Open</option>
            <option value="actioned">Actioned</option>
            <option value="closed">Closed</option>
            <option value="all">All</option>
          </select>
          <button
            onClick={loadReports}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">ID</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Reporter</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Reported</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Reason</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Created</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Status</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No reports found
                  </td>
                </tr>
              ) : (
                reports.map((r) => (
                  <tr key={r.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{r.id}</td>
                    <td className="py-3 px-4">
                      <Link to={`/users/${r.reporter.id}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                        {r.reporter.username}
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <Link to={`/users/${r.reported.id}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                        {r.reported.username}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{r.reason}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                      {new Date(r.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      {r.status === 'open' && (
                        <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 rounded text-sm font-medium">
                          Open
                        </span>
                      )}
                      {r.status === 'actioned' && (
                        <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded text-sm font-medium">
                          Actioned
                        </span>
                      )}
                      {r.status === 'closed' && (
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded text-sm font-medium">
                          Closed
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleResolve(r.id, 'close')}
                          className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-sm"
                          disabled={r.status !== 'open'}
                        >
                          Close
                        </button>
                        <button
                          onClick={() => handleResolve(r.id, 'warn')}
                          className="px-3 py-1 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors text-sm"
                          disabled={r.status !== 'open'}
                        >
                          Warn
                        </button>
                        <button
                          onClick={() => handleResolve(r.id, 'ban')}
                          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
                          disabled={r.status !== 'open'}
                        >
                          Ban
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminReports;
