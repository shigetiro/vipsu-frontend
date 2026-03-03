import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { adminAPI } from '../../utils/api';
import { Link } from 'react-router-dom';

type RequestStatus = 'pending' | 'approved' | 'rejected';

interface BeatmapRankRequest {
  id: number;
  beatmap_id?: number;
  beatmapset_id?: number;
  requester_id: number;
  requester_username: string;
  message?: string;
  created_at: string;
  status: RequestStatus;
}

const AdminBeatmapRequests: React.FC = () => {
  const [requests, setRequests] = useState<BeatmapRankRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<RequestStatus | 'all'>('pending');

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getBeatmapRequests({
        status: statusFilter === 'all' ? undefined : statusFilter,
      });
      setRequests(Array.isArray(data) ? data : (data?.items ?? []));
    } catch (error) {
      console.error('Failed to load beatmap requests', error);
      toast.error('Failed to load beatmap requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []); // initial

  const handleApprove = async (id: number) => {
    try {
      await adminAPI.approveBeatmapRequest(id);
      toast.success('Request approved');
      loadRequests();
    } catch (error) {
      console.error('Failed to approve request', error);
      toast.error('Failed to approve request');
    }
  };

  const handleReject = async (id: number) => {
    const reason = prompt('Enter rejection reason (optional):') || undefined;
    try {
      await adminAPI.rejectBeatmapRequest(id, reason);
      toast.success('Request rejected');
      loadRequests();
    } catch (error) {
      console.error('Failed to reject request', error);
      toast.error('Failed to reject request');
    }
  };

  const formatBeatmapLink = (r: BeatmapRankRequest) => {
    const id = r.beatmap_id ?? r.beatmapset_id;
    if (!id) return 'Unknown';
    const path = r.beatmap_id ? `/beatmaps/${id}` : `/beatmapsets/${id}`;
    return <Link to={path} className="text-blue-600 dark:text-blue-400 hover:underline">{id}</Link>;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Beatmap Rank Requests</h2>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as RequestStatus | 'all')}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="all">All</option>
          </select>
          <button
            onClick={loadRequests}
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
                <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Beatmap</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Requester</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Message</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Created</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Status</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No requests found
                  </td>
                </tr>
              ) : (
                requests.map((r) => (
                  <tr key={r.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{r.id}</td>
                    <td className="py-3 px-4">{formatBeatmapLink(r)}</td>
                    <td className="py-3 px-4">
                      <Link to={`/users/${r.requester_id}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                        {r.requester_username}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{r.message || '-'}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                      {new Date(r.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      {r.status === 'pending' && (
                        <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 rounded text-sm font-medium">
                          Pending
                        </span>
                      )}
                      {r.status === 'approved' && (
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded text-sm font-medium">
                          Approved
                        </span>
                      )}
                      {r.status === 'rejected' && (
                        <span className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded text-sm font-medium">
                          Rejected
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleApprove(r.id)}
                          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
                          disabled={r.status !== 'pending'}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(r.id)}
                          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
                          disabled={r.status !== 'pending'}
                        >
                          Reject
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

export default AdminBeatmapRequests;
