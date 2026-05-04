import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../utils/api';
import toast from 'react-hot-toast';

interface Detection {
    id: number;
    score_id: number;
    user_id: number;
    beatmap_id: number;
    risk_level: 'none' | 'low' | 'medium' | 'high' | 'critical';
    total_risk_score: number;
    flagged: boolean;
    details: {
        detectors_triggered: string[];
        individual_results: Array<{
            plugin_id: string;
            risk_score: number;
            is_suspicious: boolean;
            details: Record<string, unknown>;
        }>;
    };
    created_at: string;
}

interface AnticheatStats {
    total_detections: number;
    flagged: number;
    critical: number;
    high: number;
}

const riskLevelColors: Record<string, string> = {
    none: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    low: 'bg-green-500/20 text-green-400 border-green-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    critical: 'bg-red-500/20 text-red-400 border-red-500/30 animate-pulse',
};

const riskDotColors: Record<string, string> = {
    none: 'bg-gray-400',
    low: 'bg-green-400',
    medium: 'bg-yellow-400',
    high: 'bg-orange-400',
    critical: 'bg-red-400',
};

const AdminAnticheat: React.FC = () => {
    const [detections, setDetections] = useState<Detection[]>([]);
    const [stats, setStats] = useState<AnticheatStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [filterRisk, setFilterRisk] = useState<string>('');
    const [filterFlagged, setFilterFlagged] = useState(false);
    const [filterUserId, setFilterUserId] = useState('');
    const [expandedDetections, setExpandedDetections] = useState<Set<number>>(new Set());
    const [page, setPage] = useState(0);
    const [total, setTotal] = useState(0);
    const pageSize = 20;

    useEffect(() => {
        loadData();
    }, [filterRisk, filterFlagged, filterUserId, page]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [detectionsRes, statsRes] = await Promise.all([
                adminAPI.getAnticheatDetections({
                    risk_level: filterRisk || undefined,
                    flagged_only: filterFlagged || undefined,
                    user_id: filterUserId ? parseInt(filterUserId) : undefined,
                    limit: pageSize,
                    offset: page * pageSize,
                }),
                adminAPI.getAnticheatStats().catch(() => null),
            ]);
            setDetections(detectionsRes.data || []);
            setTotal(detectionsRes.total || 0);
            setStats(statsRes);
        } catch (error) {
            console.error('Failed to load anticheat data:', error);
            toast.error('Failed to load anticheat detections');
        } finally {
            setLoading(false);
        }
    };

    const handleFlag = async (id: number) => {
        try {
            await adminAPI.flagDetection(id);
            toast.success('Detection flagged');
            loadData();
        } catch {
            toast.error('Failed to flag detection');
        }
    };

    const handleDismiss = async (id: number) => {
        try {
            await adminAPI.dismissDetection(id);
            toast.success('Detection dismissed');
            loadData();
        } catch {
            toast.error('Failed to dismiss detection');
        }
    };

    const toggleExpand = (id: number) => {
        setExpandedDetections((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString();
    };

    const formatRiskScore = (score: number) => {
        return score.toFixed(1);
    };

    const totalPages = Math.ceil(total / pageSize);

    if (loading && detections.length === 0) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-red-500/30 border-t-red-500" />
                    <p className="text-sm text-gray-400">Loading anticheat data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Stats Row */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <p className="text-xs text-gray-400 uppercase tracking-wider">Total Detections</p>
                        <p className="text-2xl font-bold text-white mt-1">{stats.total_detections.toLocaleString()}</p>
                    </div>
                    <div className="rounded-xl border border-orange-500/30 bg-orange-500/10 p-4">
                        <p className="text-xs text-orange-400 uppercase tracking-wider">Flagged</p>
                        <p className="text-2xl font-bold text-orange-400 mt-1">{stats.flagged.toLocaleString()}</p>
                    </div>
                    <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
                        <p className="text-xs text-red-400 uppercase tracking-wider">Critical</p>
                        <p className="text-2xl font-bold text-red-400 mt-1">{stats.critical.toLocaleString()}</p>
                    </div>
                    <div className="rounded-xl border border-orange-500/30 bg-orange-500/10 p-4">
                        <p className="text-xs text-orange-400 uppercase tracking-wider">High Risk</p>
                        <p className="text-2xl font-bold text-orange-400 mt-1">{stats.high.toLocaleString()}</p>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
                <select
                    value={filterRisk}
                    onChange={(e) => { setFilterRisk(e.target.value); setPage(0); }}
                    className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                >
                    <option value="">All Risk Levels</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                </select>

                <button
                    onClick={() => { setFilterFlagged(!filterFlagged); setPage(0); }}
                    className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                        filterFlagged
                            ? 'bg-red-500/20 border-red-500/30 text-red-400'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                    }`}
                >
                    Flagged Only
                </button>

                <input
                    type="number"
                    placeholder="Filter by user ID"
                    value={filterUserId}
                    onChange={(e) => { setFilterUserId(e.target.value); setPage(0); }}
                    className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 w-44"
                />

                <button
                    onClick={loadData}
                    className="ml-auto rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                >
                    Refresh
                </button>
            </div>

            {/* Detections List */}
            <div className="space-y-3">
                {detections.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        <svg className="w-16 h-16 mx-auto mb-4 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        <p>No detections found</p>
                    </div>
                ) : (
                    detections.map((d) => (
                        <div
                            key={d.id}
                            className={`rounded-xl border backdrop-blur-sm transition-all ${
                                d.flagged
                                    ? 'border-red-500/30 bg-red-500/5'
                                    : 'border-white/10 bg-white/5'
                            }`}
                        >
                            <div className="p-4">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={`h-3 w-3 rounded-full flex-shrink-0 ${riskDotColors[d.risk_level]}`} />
                                        <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold flex-shrink-0 ${riskLevelColors[d.risk_level]}`}>
                                            {d.risk_level.toUpperCase()}
                                        </span>
                                        <span className="text-lg font-bold text-white">{formatRiskScore(d.total_risk_score)}</span>
                                        <span className="text-xs text-gray-500">/ 100</span>
                                    </div>

                                    <div className="flex items-center gap-4 text-xs text-gray-400 flex-shrink-0">
                                        <span>Score #{d.score_id}</span>
                                        <span>User #{d.user_id}</span>
                                        <span>Beatmap #{d.beatmap_id}</span>
                                    </div>

                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        {d.flagged && (
                                            <button
                                                onClick={() => handleDismiss(d.id)}
                                                className="rounded-lg bg-green-500/20 border border-green-500/30 px-3 py-1.5 text-xs font-medium text-green-400 hover:bg-green-500/30 transition-colors"
                                            >
                                                Dismiss
                                            </button>
                                        )}
                                        {!d.flagged && d.risk_level !== 'none' && (
                                            <button
                                                onClick={() => handleFlag(d.id)}
                                                className="rounded-lg bg-red-500/20 border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/30 transition-colors"
                                            >
                                                Flag
                                            </button>
                                        )}
                                        <button
                                            onClick={() => toggleExpand(d.id)}
                                            className="rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-colors"
                                        >
                                            {expandedDetections.has(d.id) ? 'Hide' : 'Details'}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {formatDate(d.created_at)}
                                </div>
                            </div>

                            {expandedDetections.has(d.id) && (
                                <div className="border-t border-white/10 p-4 space-y-3">
                                    {d.details?.detectors_triggered && d.details.detectors_triggered.length > 0 && (
                                        <div>
                                            <p className="text-xs text-gray-400 mb-2">Detectors Triggered:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {d.details.detectors_triggered.map((detector: string, i: number) => (
                                                    <span
                                                        key={i}
                                                        className="rounded-md bg-pink-500/10 border border-pink-500/20 px-2.5 py-1 text-xs text-pink-400 font-mono"
                                                    >
                                                        {detector}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {d.details?.individual_results && d.details.individual_results.length > 0 && (
                                        <div>
                                            <p className="text-xs text-gray-400 mb-2">Individual Results:</p>
                                            <div className="space-y-2">
                                                {d.details.individual_results.map((result, i) => (
                                                    <div
                                                        key={i}
                                                        className="rounded-lg bg-white/5 border border-white/10 p-3"
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-sm font-medium text-white font-mono">{result.plugin_id}</span>
                                                            <span className={`text-sm font-bold ${result.risk_score >= 60 ? 'text-red-400' : result.risk_score >= 40 ? 'text-yellow-400' : 'text-gray-400'}`}>
                                                                {result.risk_score} pts
                                                            </span>
                                                        </div>
                                                        {result.details && Object.keys(result.details).length > 0 && (
                                                            <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2">
                                                                {Object.entries(result.details).map(([key, value]) => (
                                                                    <div key={key} className="text-xs">
                                                                        <span className="text-gray-500">{key}: </span>
                                                                        <span className="text-gray-300 font-mono">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-400">
                        Showing {page * pageSize + 1} - {Math.min((page + 1) * pageSize, total)} of {total}
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage((p) => Math.max(0, p - 1))}
                            disabled={page === 0}
                            className="rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-sm text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                            disabled={page >= totalPages - 1}
                            className="rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-sm text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminAnticheat;
