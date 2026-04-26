import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Modal, Button, Input, Spin, Empty, Tag, Select, Pagination, message } from 'antd';
import { SearchOutlined, ClockCircleOutlined, UserOutlined, PlayCircleOutlined } from '@ant-design/icons';

const { Search } = Input;
const { Option } = Select;

// Types defined inline to avoid missing file imports
export interface BeatmapSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (beatmap: BeatmapSearchResult) => void;
  mode?: 'set' | 'individual';
  title?: string;
  defaultFilters?: Partial<BeatmapFilters>;
}

export interface BeatmapSearchResult {
  id: number;
  setId: number;
  title: string;
  artist: string;
  creator: string;
  creatorId: number;
  difficulty: string;
  status: 'ranked' | 'loved' | 'qualified' | 'pending' | 'graveyard' | 'unranked';
  mode: 'osu' | 'taiko' | 'catch' | 'mania';
  bpm: number;
  length: number;
  lastUpdated: string;
  thumbnailUrl?: string;
}

export interface BeatmapFilters {
  status: 'all' | 'ranked' | 'loved' | 'qualified' | 'pending' | 'graveyard' | 'unranked';
  mode: 'all' | 'osu' | 'taiko' | 'catch' | 'mania';
}

interface BeatmapSearchResponse {
  results: BeatmapSearchResult[];
  total: number;
  page: number;
  totalPages: number;
}

// Status color mapping
const statusColors: Record<string, string> = {
  ranked: 'green',
  loved: 'pink',
  qualified: 'blue',
  pending: 'orange',
  graveyard: 'gray',
  unranked: 'red',
};

// Mode icons mapping
const modeIcons: Record<string, string> = {
  osu: '🎯',
  taiko: '🥁',
  catch: '🍎',
  mania: '🎹',
};

// Format length from seconds to mm:ss
const formatLength = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Helper to get auth token - can be replaced with proper auth context
const getAuthToken = (): string | null => {
  try {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  } catch {
    return null;
  }
};

const BeatmapSearchModal: React.FC<BeatmapSearchModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  mode = 'individual',
  title = 'Search Beatmaps',
  defaultFilters,
}) => {
  // State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<BeatmapSearchResult[]>([]);
  const [selectedBeatmap, setSelectedBeatmap] = useState<BeatmapSearchResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalResults, setTotalResults] = useState<number>(0);
  const [filters, setFilters] = useState<BeatmapFilters>({
    status: defaultFilters?.status || 'all',
    mode: defaultFilters?.mode || 'all',
  });
  const [error, setError] = useState<string | null>(null);

  // Refs
  const searchInputRef = useRef<Input>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Debounced search query
  const debouncedQuery = useDebounce(searchQuery, 300);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Fetch beatmaps
  const fetchBeatmaps = useCallback(async (query: string, page: number, filterState: BeatmapFilters) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (query.trim()) params.append('query', query.trim());
      params.append('page', page.toString());
      params.append('limit', '20');
      if (filterState.status !== 'all') params.append('status', filterState.status);
      if (filterState.mode !== 'all') params.append('mode', filterState.mode);
      params.append('searchType', mode);

      const token = getAuthToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/admin/beatmaps/search?${params.toString()}`, {
        signal: abortControllerRef.current.signal,
        headers,
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required');
        } else if (response.status === 403) {
          throw new Error('You do not have permission to search beatmaps');
        }
        throw new Error(`Server error: ${response.status}`);
      }

      const data: BeatmapSearchResponse = await response.json();
      setSearchResults(data.results || []);
      setTotalPages(data.totalPages || 1);
      setTotalResults(data.total || 0);
      setCurrentPage(data.page || 1);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return; // Ignore abort errors
      }
      console.error('Failed to fetch beatmaps:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to search beatmaps. Please try again.';
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [mode]);

  // Effect to fetch on query/filter change
  useEffect(() => {
    if (isOpen) {
      setCurrentPage(1);
      fetchBeatmaps(debouncedQuery, 1, filters);
    }
  }, [debouncedQuery, filters, isOpen, fetchBeatmaps]);

  // Effect to fetch on page change
  useEffect(() => {
    if (isOpen && currentPage > 1) {
      fetchBeatmaps(debouncedQuery, currentPage, filters);
    }
  }, [currentPage, isOpen, fetchBeatmaps, debouncedQuery, filters]);

  // Focus input on open
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Reset state on close
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSearchResults([]);
      setSelectedBeatmap(null);
      setCurrentPage(1);
      setError(null);
      setTotalPages(1);
      setTotalResults(0);
    }
  }, [isOpen]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle filter change
  const handleFilterChange = (key: keyof BeatmapFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setSelectedBeatmap(null);
  };

  // Handle beatmap click
  const handleBeatmapClick = (beatmap: BeatmapSearchResult) => {
    setSelectedBeatmap(beatmap);
  };

  // Handle beatmap double-click (select immediately)
  const handleBeatmapDoubleClick = (beatmap: BeatmapSearchResult) => {
    onSelect(beatmap);
    onClose();
  };

  // Handle select button click
  const handleSelectClick = () => {
    if (selectedBeatmap) {
      onSelect(selectedBeatmap);
      onClose();
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && selectedBeatmap) {
      handleSelectClick();
    } else if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown' && searchResults.length > 0) {
      e.preventDefault();
      const currentIndex = selectedBeatmap 
        ? searchResults.findIndex(b => b.id === selectedBeatmap.id) 
        : -1;
      const nextIndex = Math.min(currentIndex + 1, searchResults.length - 1);
      setSelectedBeatmap(searchResults[nextIndex]);
    } else if (e.key === 'ArrowUp' && searchResults.length > 0) {
      e.preventDefault();
      const currentIndex = selectedBeatmap 
        ? searchResults.findIndex(b => b.id === selectedBeatmap.id) 
        : 0;
      const prevIndex = Math.max(currentIndex - 1, 0);
      setSelectedBeatmap(searchResults[prevIndex]);
    }
  };

  // Beatmap item style helper
  const getBeatmapItemStyle = (isSelected: boolean, isHovered: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    padding: '12px',
    borderBottom: '1px solid #f0f0f0',
    cursor: 'pointer',
    backgroundColor: isSelected ? '#e6f7ff' : isHovered ? '#f5f5f5' : 'transparent',
    transition: 'background-color 0.2s',
  });

  // Render beatmap item
  const renderBeatmapItem = (beatmap: BeatmapSearchResult, index: number) => {
    const isSelected = selectedBeatmap?.id === beatmap.id;
    
    return (
      <div
        key={`${beatmap.id}-${beatmap.setId}`}
        className="beatmap-item"
        onClick={() => handleBeatmapClick(beatmap)}
        onDoubleClick={() => handleBeatmapDoubleClick(beatmap)}
        style={getBeatmapItemStyle(isSelected, false)}
        onMouseEnter={(e) => {
          if (!isSelected) {
            (e.currentTarget as HTMLDivElement).style.backgroundColor = '#f5f5f5';
          }
        }}
        onMouseLeave={(e) => {
          if (!isSelected) {
            (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent';
          }
        }}
        role="option"
        aria-selected={isSelected}
        tabIndex={0}
      >
        {/* Thumbnail */}
        <div
          style={{
            width: '60px',
            height: '45px',
            borderRadius: '4px',
            overflow: 'hidden',
            marginRight: '12px',
            flexShrink: 0,
            backgroundColor: '#f5f5f5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {beatmap.thumbnailUrl ? (
            <img
              src={beatmap.thumbnailUrl}
              alt={`${beatmap.artist} - ${beatmap.title}`}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              loading="lazy"
            />
          ) : (
            <span style={{ fontSize: '24px' }}>
              {modeIcons[beatmap.mode] || '🎵'}
            </span>
          )}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
          <div style={{ 
            fontWeight: 500, 
            overflow: 'hidden', 
            textOverflow: 'ellipsis', 
            whiteSpace: 'nowrap',
            marginBottom: '4px',
          }}>
            {beatmap.artist} - {beatmap.title}
          </div>
          <div style={{ 
            fontSize: '12px', 
            color: '#666',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <UserOutlined /> {beatmap.creator}
            </span>
            <span 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={beatmap.difficulty}
            >
              <PlayCircleOutlined /> {beatmap.difficulty}
            </span>
          </div>
        </div>

        {/* Meta */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '12px', flexShrink: 0 }}>
          <span style={{ fontSize: '18px' }} title={beatmap.mode}>
            {modeIcons[beatmap.mode]}
          </span>
          <Tag color={statusColors[beatmap.status] || 'default'}>
            {beatmap.status}
          </Tag>
          <span 
            style={{ 
              fontSize: '12px', 
              color: '#999', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '4px',
              whiteSpace: 'nowrap',
            }}
          >
            <ClockCircleOutlined /> {formatLength(beatmap.length)}
          </span>
        </div>
      </div>
    );
  };

  return (
    <Modal
      title={title}
      open={isOpen}
      onCancel={onClose}
      width={900}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button 
          key="select" 
          type="primary" 
          onClick={handleSelectClick}
          disabled={!selectedBeatmap}
        >
          {selectedBeatmap ? `Select "${selectedBeatmap.difficulty}"` : 'Select'}
        </Button>,
      ]}
      bodyStyle={{ padding: 0 }}
      destroyOnClose
      maskClosable={false}
    >
      <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0' }}>
        {/* Search Input */}
        <Search
          ref={searchInputRef}
          placeholder="Search by title, artist, or creator..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          loading={isLoading}
          allowClear
          enterButton={<><SearchOutlined /> Search</>}
          aria-label="Search beatmaps"
        />

        {/* Filters */}
        <div style={{ marginTop: '12px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <Select
            value={filters.status}
            onChange={(value) => handleFilterChange('status', value)}
            style={{ width: 140 }}
            aria-label="Filter by status"
          >
            <Option value="all">All Status</Option>
            <Option value="ranked">Ranked</Option>
            <Option value="loved">Loved</Option>
            <Option value="qualified">Qualified</Option>
            <Option value="pending">Pending</Option>
            <Option value="graveyard">Graveyard</Option>
            <Option value="unranked">Unranked</Option>
          </Select>

          <Select
            value={filters.mode}
            onChange={(value) => handleFilterChange('mode', value)}
            style={{ width: 120 }}
            aria-label="Filter by mode"
          >
            <Option value="all">All Modes</Option>
            <Option value="osu">osu!</Option>
            <Option value="taiko">osu!taiko</Option>
            <Option value="catch">osu!catch</Option>
            <Option value="mania">osu!mania</Option>
          </Select>

          <span style={{ marginLeft: 'auto', color: '#999', fontSize: '12px' }}>
            {totalResults.toLocaleString()} result{totalResults !== 1 ? 's' : ''} found
          </span>
        </div>
      </div>

      {/* Results List */}
      <div 
        style={{ 
          height: '400px', 
          overflowY: 'auto',
          backgroundColor: '#fafafa',
        }}
        role="listbox"
        aria-label="Beatmap search results"
        onKeyDown={handleKeyDown}
      >
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Spin size="large" tip="Searching..." />
          </div>
        ) : error ? (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100%', 
            color: '#ff4d4f',
            gap: '8px',
          }}>
            <span>{error}</span>
            <Button size="small" onClick={() => fetchBeatmaps(debouncedQuery, currentPage, filters)}>
              Retry
            </Button>
          </div>
        ) : searchResults.length === 0 ? (
          <Empty 
            description={searchQuery.trim() ? 'No beatmaps found matching your search' : 'Type to search for beatmaps'}
            style={{ marginTop: '100px' }}
          />
        ) : (
          searchResults.map((beatmap, index) => renderBeatmapItem(beatmap, index))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ padding: '16px', borderTop: '1px solid #f0f0f0', textAlign: 'center' }}>
          <Pagination
            current={currentPage}
            total={totalResults}
            pageSize={20}
            onChange={handlePageChange}
            showSizeChanger={false}
            showQuickJumper
            showTotal={(total) => `${total.toLocaleString()} beatmaps`}
            disabled={isLoading}
          />
        </div>
      )}

      {/* Selected Beatmap Preview */}
      {selectedBeatmap && (
        <div 
          style={{ 
            padding: '12px 16px', 
            borderTop: '1px solid #f0f0f0',
            backgroundColor: '#f5f5f5',
          }}
        >
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
            Selected:
          </div>
          <div style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {selectedBeatmap.artist} - {selectedBeatmap.title} [{selectedBeatmap.difficulty}]
          </div>
          <div style={{ fontSize: '12px', color: '#999', marginTop: '4px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <span>by {selectedBeatmap.creator}</span>
            <span>{Math.round(selectedBeatmap.bpm)} BPM</span>
            <span>{formatLength(selectedBeatmap.length)}</span>
            <span>
              <Tag color={statusColors[selectedBeatmap.status]} style={{ margin: 0 }}>
                {selectedBeatmap.status}
              </Tag>
            </span>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default BeatmapSearchModal;