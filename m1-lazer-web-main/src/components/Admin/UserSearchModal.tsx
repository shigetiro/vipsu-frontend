import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Modal, Table, Input, Spin, Button, Tag, Empty, Pagination, Avatar, Space, message } from 'antd';
import { SearchOutlined, UserOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { adminApi } from '../../api/admin';

interface UserSearchResult {
  id: number;
  username: string;
  country: string;
  rank: number;
  pp: number;
  play_count: number;
  status: 'online' | 'offline' | 'banned' | 'restricted';
  last_seen: string;
  avatar_url?: string;
}

interface UserSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (user: UserSearchResult) => void;
  title?: string;
  excludeUserIds?: number[];
}

interface SearchUsersResponse {
  success: boolean;
  data: {
    users: UserSearchResult[];
    total: number;
  };
  error?: string;
}

const DEBOUNCE_MS = 300;
const PAGE_SIZE = 10;

export const UserSearchModal: React.FC<UserSearchModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  title = 'Search Users',
  excludeUserIds = [],
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalResults, setTotalResults] = useState<number>(0);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setResults([]);
      setError(null);
      setCurrentPage(1);
      setTotalResults(0);
      // Focus input after modal opens
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Debounced search function
  const performSearch = useCallback(async (query: string, page: number): Promise<void> => {
    if (!query.trim()) {
      setResults([]);
      setTotalResults(0);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response: SearchUsersResponse = await adminApi.searchUsers({
        query: query.trim(),
        page,
        limit: PAGE_SIZE,
        exclude: excludeUserIds,
      });

      if (response.success) {
        setResults(response.data.users);
        setTotalResults(response.data.total);
      } else {
        setError(response.error ?? 'Search failed');
        setResults([]);
        setTotalResults(0);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search users. Please try again.';
      setError(errorMessage);
      setResults([]);
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  }, [excludeUserIds]);

  // Handle search input change with debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    setSearchQuery(value);
    setCurrentPage(1);

    // Clear existing timer
    if (debounceTimer.current !== null) {
      clearTimeout(debounceTimer.current);
    }

    // Set new timer
    debounceTimer.current = setTimeout(() => {
      void performSearch(value, 1);
    }, DEBOUNCE_MS);
  };

  // Handle page change
  const handlePageChange = (page: number): void => {
    setCurrentPage(page);
    void performSearch(searchQuery, page);
  };

  // Handle user selection
  const handleUserSelect = (user: UserSearchResult): void => {
    onSelect(user);
    onClose();
  };

  // Handle keyboard events
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimer.current !== null) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  // Get status color for tag
  const getStatusColor = (status: UserSearchResult['status']): string => {
    switch (status) {
      case 'online':
        return 'green';
      case 'offline':
        return 'default';
      case 'banned':
        return 'red';
      case 'restricted':
        return 'orange';
      default:
        return 'default';
    }
  };

  // Format status text
  const getStatusText = (status: UserSearchResult['status']): string => {
    switch (status) {
      case 'online':
        return 'Online';
      case 'offline':
        return 'Offline';
      case 'banned':
        return 'Banned';
      case 'restricted':
        return 'Restricted';
      default:
        return 'Unknown';
    }
  };

  // Format relative time
  const formatRelativeTime = (lastSeen: string): string => {
    if (!lastSeen) return '-';
    const date = new Date(lastSeen);
    if (isNaN(date.getTime())) return '-';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Table columns definition
  const columns: ColumnsType<UserSearchResult> = [
    {
      title: '',
      dataIndex: 'avatar_url',
      key: 'avatar',
      width: 50,
      render: (_: unknown, record: UserSearchResult) => (
        <Avatar
          src={record.avatar_url}
          icon={<UserOutlined />}
          size="small"
          style={{ backgroundColor: '#87d068' }}
          alt={`${record.username}'s avatar`}
        />
      ),
    },
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
      render: (username: string, record: UserSearchResult) => (
        <Space>
          <span style={{ fontWeight: 500 }}>{username}</span>
          <Tag color={getStatusColor(record.status)}>
            {getStatusText(record.status)}
          </Tag>
        </Space>
      ),
      sorter: (a: UserSearchResult, b: UserSearchResult) => a.username.localeCompare(b.username),
    },
    {
      title: 'Country',
      dataIndex: 'country',
      key: 'country',
      width: 80,
      render: (country: string) => (
        <Space>
          <img
            src={`/assets/images/flags/${country.toLowerCase()}.png`}
            alt={country}
            style={{ width: 20, height: 14, objectFit: 'cover', borderRadius: 2 }}
            onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <span>{country.toUpperCase()}</span>
        </Space>
      ),
    },
    {
      title: 'Rank',
      dataIndex: 'rank',
      key: 'rank',
      width: 100,
      render: (rank: number) => (rank > 0 ? `#${rank.toLocaleString()}` : '-'),
      sorter: (a: UserSearchResult, b: UserSearchResult) => a.rank - b.rank,
    },
    {
      title: 'PP',
      dataIndex: 'pp',
      key: 'pp',
      width: 100,
      render: (pp: number) => (pp > 0 ? pp.toLocaleString() : '-'),
      sorter: (a: UserSearchResult, b: UserSearchResult) => a.pp - b.pp,
    },
    {
      title: 'Plays',
      dataIndex: 'play_count',
      key: 'play_count',
      width: 100,
      render: (playCount: number) => playCount.toLocaleString(),
      sorter: (a: UserSearchResult, b: UserSearchResult) => a.play_count - b.play_count,
    },
    {
      title: 'Last Seen',
      dataIndex: 'last_seen',
      key: 'last_seen',
      width: 120,
      render: (lastSeen: string) => formatRelativeTime(lastSeen),
    },
    {
      title: 'Action',
      key: 'action',
      width: 80,
      render: (_: unknown, record: UserSearchResult) => (
        <Button
          type="primary"
          size="small"
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            handleUserSelect(record);
          }}
          aria-label={`Select ${record.username}`}
        >
          Select
        </Button>
      ),
    },
  ];

  return (
    <Modal
      title={title}
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={900}
      destroyOnClose
      aria-label="User search modal"
    >
      <div style={{ marginBottom: 16 }}>
        <Input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          placeholder="Search by username..."
          prefix={<SearchOutlined />}
          value={searchQuery}
          onChange={handleSearchChange}
          onKeyDown={handleKeyDown}
          allowClear
          size="large"
          aria-label="Search users"
        />
      </div>

      {error !== null && (
        <div style={{ color: '#ff4d4f', marginBottom: 16, textAlign: 'center' }} role="alert">
          {error}
        </div>
      )}

      <Spin spinning={loading} tip="Searching...">
        {results.length === 0 && !loading && searchQuery.trim() !== '' ? (
          <Empty
            description="No users found"
            style={{ margin: '40px 0' }}
          />
        ) : results.length === 0 && searchQuery.trim() === '' ? (
          <Empty
            description="Type to search for users"
            style={{ margin: '40px 0' }}
          />
        ) : (
          <>
            <Table
              columns={columns}
              dataSource={results}
              rowKey="id"
              pagination={false}
              size="small"
              onRow={(record: UserSearchResult) => ({
                onClick: () => handleUserSelect(record),
                style: { cursor: 'pointer' },
                'aria-label': `Select user ${record.username}`,
              })}
            />
            {totalResults > PAGE_SIZE && (
              <div style={{ marginTop: 16, textAlign: 'center' }}>
                <Pagination
                  current={currentPage}
                  pageSize={PAGE_SIZE}
                  total={totalResults}
                  onChange={handlePageChange}
                  showSizeChanger={false}
                  showTotal={(total: number, range: [number, number]) =>
                    `${range[0]}-${range[1]} of ${total} users`
                  }
                />
              </div>
            )}
          </>
        )}
      </Spin>
    </Modal>
  );
};

export default UserSearchModal;