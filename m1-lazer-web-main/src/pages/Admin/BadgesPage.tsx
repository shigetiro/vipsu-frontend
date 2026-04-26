import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  ThemeProvider,
  createTheme,
  CssBaseline,
  LinearProgress,
  Zoom,
  Snackbar,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  CloudUpload as CloudUploadIcon,
  Link as LinkIcon,
  Image as ImageIcon,
  People as PeopleIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  Badge as BadgeIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';

// Theme configuration for modern look
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#FF66AB',
    },
    secondary: {
      main: '#66D9FF',
    },
    background: {
      default: '#1a1a2e',
      paper: '#16213e',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(145deg, #1a1a2e 0%, #16213e 100%)',
          border: '1px solid rgba(255, 102, 171, 0.2)',
          borderRadius: '12px',
          transition: 'all 0.3s ease',
          '&:hover': {
            border: '1px solid rgba(255, 102, 171, 0.5)',
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 25px rgba(255, 102, 171, 0.15)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
  },
});

// Types
interface Badge {
  id: number;
  name: string;
  description: string;
  image_url: string;
  created_at: string;
  awarded_count: number;
}

interface User {
  id: number;
  username: string;
  country: string;
  rank: number;
  pp: number;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// API Base URL
const API_BASE_URL = '/api/admin';

// API Helper Functions
const api = {
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      return { success: response.ok, data };
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  },

  async post<T>(endpoint: string, body: FormData | object): Promise<ApiResponse<T>> {
    try {
      const isFormData = body instanceof FormData;
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: isFormData
          ? { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` }
          : {
              'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
              'Content-Type': 'application/json',
            },
        body: isFormData ? (body as FormData) : JSON.stringify(body),
      });
      const data = await response.json();
      return { success: response.ok, data, error: !response.ok ? data.message : undefined };
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  },

  async put<T>(endpoint: string, body: object): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      return { success: response.ok, data, error: !response.ok ? data.message : undefined };
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  },

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      return { success: response.ok, data, error: !response.ok ? data.message : undefined };
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  },
};

// Create Badge Modal Component
interface CreateBadgeModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editBadge?: Badge | null;
}

const CreateBadgeModal: React.FC<CreateBadgeModalProps> = ({
  open,
  onClose,
  onSuccess,
  editBadge,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [uploadMethod, setUploadMethod] = useState<'url' | 'file'>('url');
  const [imageUrl, setImageUrl] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editBadge) {
      setName(editBadge.name);
      setDescription(editBadge.description);
      setImageUrl(editBadge.image_url);
      setPreviewUrl(editBadge.image_url);
      setUploadMethod('url');
    } else {
      resetForm();
    }
  }, [editBadge, open]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setImageUrl('');
    setUploadedFile(null);
    setPreviewUrl('');
    setUploadMethod('url');
    setError('');
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        setError('Only image files are allowed');
        return;
      }
      setUploadedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleUrlChange = (url: string) => {
    setImageUrl(url);
    setPreviewUrl(url);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Badge name is required');
      return;
    }

    if (uploadMethod === 'url' && !imageUrl.trim()) {
      setError('Image URL is required');
      return;
    }

    if (uploadMethod === 'file' && !uploadedFile && !editBadge) {
      setError('Please upload an image file');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (editBadge) {
        // For editing, use JSON if URL, FormData if file
        if (uploadMethod === 'url') {
          const response = await api.put<Badge>(`/badges/${editBadge.id}`, {
            name,
            description,
            image_url: imageUrl,
          });
          if (response.success) {
            onSuccess();
            onClose();
            resetForm();
          } else {
            setError(response.error || 'Failed to update badge');
          }
        } else {
          const formData = new FormData();
          formData.append('name', name);
          formData.append('description', description);
          if (uploadedFile) {
            formData.append('image', uploadedFile);
          }
          const response = await api.post<Badge>(`/badges/${editBadge.id}`, formData);
          if (response.success) {
            onSuccess();
            onClose();
            resetForm();
          } else {
            setError(response.error || 'Failed to update badge');
          }
        }
      } else {
        // Creating new badge
        const formData = new FormData();
        formData.append('name', name);
        formData.append('description', description);

        if (uploadMethod === 'url') {
          formData.append('image_url', imageUrl);
        } else if (uploadedFile) {
          formData.append('image', uploadedFile);
        }

        const response = await api.post<Badge>('/badges', formData);

        if (response.success) {
          onSuccess();
          onClose();
          resetForm();
        } else {
          setError(response.error || 'Failed to create badge');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          background: 'linear-gradient(145deg, #1a1a2e 0%, #16213e 100%)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 102, 171, 0.2)',
        },
      }}
    >
      <DialogTitle sx={{ color: '#FF66AB', fontWeight: 700 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BadgeIcon />
          {editBadge ? 'Edit Badge' : 'Create New Badge'}
        </Box>
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
            {error}
          </Alert>
        )}

        <TextField
          autoFocus
          margin="dense"
          label="Badge Name"
          fullWidth
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          sx={{ mb: 2 }}
        />

        <TextField
          margin="dense"
          label="Description"
          fullWidth
          multiline
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          sx={{ mb: 3 }}
        />

        <Typography variant="subtitle2" sx={{ mb: 1, color: 'rgba(255,255,255,0.7)' }}>
          Badge Image Source
        </Typography>

        <ToggleButtonGroup
          value={uploadMethod}
          exclusive
          onChange={(_, value) => value && setUploadMethod(value)}
          fullWidth
          sx={{ mb: 2 }}
        >
          <ToggleButton value="url" sx={{ color: 'white', borderColor: 'rgba(255,102,171,0.3)' }}>
            <LinkIcon sx={{ mr: 1 }} />
            URL
          </ToggleButton>
          <ToggleButton value="file" sx={{ color: 'white', borderColor: 'rgba(255,102,171,0.3)' }}>
            <CloudUploadIcon sx={{ mr: 1 }} />
            Upload File
          </ToggleButton>
        </ToggleButtonGroup>

        {uploadMethod === 'url' ? (
          <TextField
            margin="dense"
            label="Image URL"
            fullWidth
            value={imageUrl}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="https://example.com/badge.png"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LinkIcon sx={{ color: 'rgba(255,255,255,0.5)' }} />
                </InputAdornment>
              ),
            }}
          />
        ) : (
          <Box>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <Button
              variant="outlined"
              component="span"
              onClick={() => fileInputRef.current?.click()}
              startIcon={<CloudUploadIcon />}
              sx={{
                width: '100%',
                py: 2,
                borderStyle: 'dashed',
                borderColor: 'rgba(255,102,171,0.5)',
                '&:hover': { borderColor: '#FF66AB' },
              }}
            >
              {uploadedFile ? uploadedFile.name : 'Click to upload image (max 5MB)'}
            </Button>
          </Box>
        )}

        {previewUrl && (
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="subtitle2" sx={{ mb: 1, color: 'rgba(255,255,255,0.7)' }}>
              Preview
            </Typography>
            <Avatar
              src={previewUrl}
              alt="Badge preview"
              variant="rounded"
              sx={{
                width: 100,
                height: 100,
                mx: 'auto',
                border: '2px solid rgba(255,102,171,0.5)',
                bgcolor: 'rgba(0,0,0,0.3)',
              }}
            >
              <ImageIcon sx={{ fontSize: 40, color: 'rgba(255,255,255,0.3)' }} />
            </Avatar>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button onClick={onClose} startIcon={<CancelIcon />} sx={{ color: 'rgba(255,255,255,0.7)' }}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
          disabled={loading}
          sx={{
            background: 'linear-gradient(135deg, #FF66AB 0%, #FF8FB1 100%)',
            '&:hover': { background: 'linear-gradient(135deg, #FF8FB1 0%, #FF66AB 100%)' },
          }}
        >
          {editBadge ? 'Save Changes' : 'Create Badge'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Assign Badge Modal Component
interface AssignBadgeModalProps {
  open: boolean;
  onClose: () => void;
  badge: Badge | null;
  onSuccess: () => void;
}

const AssignBadgeModal: React.FC<AssignBadgeModalProps> = ({
  open,
  onClose,
  badge,
  onSuccess,
}) => {
  const [usernames, setUsernames] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [assignMethod, setAssignMethod] = useState<'search' | 'list' | 'bulk'>('search');
  const [bulkCountry, setBulkCountry] = useState('');
  const [rankMin, setRankMin] = useState('');
  const [rankMax, setRankMax] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [open]);

  const resetForm = () => {
    setUsernames('');
    setSelectedUsers([]);
    setSearchQuery('');
    setSearchResults([]);
    setAssignMethod('search');
    setBulkCountry('');
    setRankMin('');
    setRankMax('');
    setError('');
  };

  const handleSearchUsers = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    const response = await api.get<User[]>(`/users/search?q=${encodeURIComponent(searchQuery)}`);
    if (response.success && response.data) {
      setSearchResults(response.data);
    }
    setSearching(false);
  }, [searchQuery]);

  const handleAddUser = (user: User) => {
    if (!selectedUsers.find((u) => u.id === user.id)) {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const handleRemoveUser = (userId: number) => {
    setSelectedUsers(selectedUsers.filter((u) => u.id !== userId));
  };

  const handleAssign = async () => {
    if (!badge) return;

    let userIds: number[] = [];

    if (assignMethod === 'search') {
      userIds = selectedUsers.map((u) => u.id);
    } else if (assignMethod === 'list') {
      const usernameList = usernames
        .split(/[,\n]/)
        .map((u) => u.trim())
        .filter((u) => u);
      if (usernameList.length === 0) {
        setError('Please enter at least one username');
        return;
      }
      // Resolve usernames to IDs
      const response = await api.post<{ userIds: number[] }>('/users/resolve', { usernames: usernameList });
      if (!response.success || !response.data) {
        setError('Failed to resolve usernames');
        return;
      }
      userIds = response.data.userIds;
    } else if (assignMethod === 'bulk') {
      const response = await api.post<{ userIds: number[] }>('/users/bulk-query', {
        country: bulkCountry || undefined,
        rankMin: rankMin ? parseInt(rankMin) : undefined,
        rankMax: rankMax ? parseInt(rankMax) : undefined,
      });
      if (!response.success || !response.data) {
        setError('Failed to query users');
        return;
      }
      userIds = response.data.userIds;
    }

    if (userIds.length === 0) {
      setError('No users selected');
      return;
    }

    setLoading(true);
    setError('');

    const response = await api.post(`/badges/${badge.id}/assign`, { userIds });

    if (response.success) {
      onSuccess();
      onClose();
      resetForm();
    } else {
      setError(response.error || 'Failed to assign badge');
    }
    setLoading(false);
  };

  if (!badge) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          background: 'linear-gradient(145deg, #1a1a2e 0%, #16213e 100%)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 102, 171, 0.2)',
        },
      }}
    >
      <DialogTitle sx={{ color: '#FF66AB', fontWeight: 700 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar src={badge.image_url} variant="rounded" sx={{ width: 40, height: 40 }} />
          Assign Badge: {badge.name}
        </Box>
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
            {error}
          </Alert>
        )}

        <Typography variant="subtitle2" sx={{ mb: 1, color: 'rgba(255,255,255,0.7)' }}>
          Assignment Method
        </Typography>

        <ToggleButtonGroup
          value={assignMethod}
          exclusive
          onChange={(_, value) => value && setAssignMethod(value)}
          fullWidth
          sx={{ mb: 3 }}
        >
          <ToggleButton value="search" sx={{ color: 'white', borderColor: 'rgba(255,102,171,0.3)' }}>
            Search Users
          </ToggleButton>
          <ToggleButton value="list" sx={{ color: 'white', borderColor: 'rgba(255,102,171,0.3)' }}>
            Username List
          </ToggleButton>
          <ToggleButton value="bulk" sx={{ color: 'white', borderColor: 'rgba(255,102,171,0.3)' }}>
            Bulk by Criteria
          </ToggleButton>
        </ToggleButtonGroup>

        {assignMethod === 'search' && (
          <Box>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField
                fullWidth
                label="Search users"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearchUsers()}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: 'rgba(255,255,255,0.5)' }} />
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                variant="contained"
                onClick={handleSearchUsers}
                disabled={searching}
                sx={{ minWidth: 100 }}
              >
                {searching ? <CircularProgress size={24} /> : 'Search'}
              </Button>
            </Box>

            {searchResults.length > 0 && (
              <Paper sx={{ p: 1, mb: 2, maxHeight: 150, overflow: 'auto' }}>
                {searchResults.map((user) => (
                  <Box
                    key={user.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 1,
                      borderRadius: 1,
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography>{user.username}</Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                        (Rank #{user.rank})
                      </Typography>
                    </Box>
                    <IconButton size="small" onClick={() => handleAddUser(user)}>
                      <AddIcon />
                    </IconButton>
                  </Box>
                ))}
              </Paper>
            )}

            <Typography variant="subtitle2" sx={{ mb: 1, color: 'rgba(255,255,255,0.7)' }}>
              Selected Users ({selectedUsers.length})
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {selectedUsers.map((user) => (
                <Chip
                  key={user.id}
                  label={`${user.username} (#${user.rank})`}
                  onDelete={() => handleRemoveUser(user.id)}
                  sx={{ bgcolor: 'rgba(255,102,171,0.2)', color: 'white' }}
                />
              ))}
            </Box>
          </Box>
        )}

        {assignMethod === 'list' && (
          <TextField
            fullWidth
            multiline
            rows={6}
            label="Enter usernames (one per line or comma-separated)"
            value={usernames}
            onChange={(e) => setUsernames(e.target.value)}
            placeholder="username1&#10;username2&#10;username3"
          />
        )}

        {assignMethod === 'bulk' && (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Country (optional)</InputLabel>
                <Select
                  value={bulkCountry}
                  onChange={(e) => setBulkCountry(e.target.value)}
                  label="Country (optional)"
                >
                  <MenuItem value="">All Countries</MenuItem>
                  <MenuItem value="US">United States</MenuItem>
                  <MenuItem value="GB">United Kingdom</MenuItem>
                  <MenuItem value="JP">Japan</MenuItem>
                  <MenuItem value="DE">Germany</MenuItem>
                  <MenuItem value="CA">Canada</MenuItem>
                  <MenuItem value="AU">Australia</MenuItem>
                  <MenuItem value="FR">France</MenuItem>
                  <MenuItem value="BR">Brazil</MenuItem>
                  <MenuItem value="RU">Russia</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Min Rank"
                type="number"
                value={rankMin}
                onChange={(e) => setRankMin(e.target.value)}
                placeholder="1"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Max Rank"
                type="number"
                value={rankMax}
                onChange={(e) => setRankMax(e.target.value)}
                placeholder="1000"
              />
            </Grid>
          </Grid>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button onClick={onClose} startIcon={<CancelIcon />} sx={{ color: 'rgba(255,255,255,0.7)' }}>
          Cancel
        </Button>
        <Button
          onClick={handleAssign}
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} /> : <CheckCircleIcon />}
          disabled={loading}
          sx={{
            background: 'linear-gradient(135deg, #FF66AB 0%, #FF8FB1 100%)',
            '&:hover': { background: 'linear-gradient(135deg, #FF8FB1 0%, #FF66AB 100%)' },
          }}
        >
          Assign Badge
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Delete Confirmation Modal
interface DeleteConfirmModalProps {
  open: boolean;
  onClose: () => void;
  badge: Badge | null;
  onConfirm: () => void;
  loading: boolean;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  open,
  onClose,
  badge,
  onConfirm,
  loading,
}) => {
  if (!badge) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      PaperProps={{
        sx: {
          background: 'linear-gradient(145deg, #1a1a2e 0%, #16213e 100%)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 102, 171, 0.2)',
        },
      }}
    >
      <DialogTitle sx={{ color: '#FF66AB', display: 'flex', alignItems: 'center', gap: 1 }}>
        <WarningIcon />
        Delete Badge
      </DialogTitle>
      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2 }}>
          This action cannot be undone!
        </Alert>
        <Typography>
          Are you sure you want to delete the badge <strong>"{badge.name}"</strong>?
        </Typography>
        <Typography variant="body2" sx={{ mt: 1, color: 'rgba(255,255,255,0.6)' }}>
          This badge has been awarded to {badge.awarded_count} user(s). All badge awards will be removed.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} sx={{ color: 'rgba(255,255,255,0.7)' }}>
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="error"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <DeleteIcon />}
        >
          Delete Badge
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Main BadgesPage Component
const BadgesPage: React.FC = () => {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [editBadge, setEditBadge] = useState<Badge | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const fetchBadges = useCallback(async () => {
    setLoading(true);
    const response = await api.get<Badge[]>('/badges');
    if (response.success && response.data) {
      setBadges(response.data);
    } else {
      showSnackbar('Failed to load badges', 'error');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBadges();
  }, [fetchBadges]);

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCreateSuccess = () => {
    fetchBadges();
    showSnackbar('Badge created successfully', 'success');
  };

  const handleEditSuccess = () => {
    fetchBadges();
    showSnackbar('Badge updated successfully', 'success');
    setEditBadge(null);
  };

  const handleAssignSuccess = () => {
    fetchBadges();
    showSnackbar('Badge assigned successfully', 'success');
  };

  const handleDelete = async () => {
    if (!selectedBadge) return;
    setActionLoading(true);
    const response = await api.delete(`/badges/${selectedBadge.id}`);
    if (response.success) {
      fetchBadges();
      showSnackbar('Badge deleted successfully', 'success');
      setShowDeleteModal(false);
      setSelectedBadge(null);
    } else {
      showSnackbar(response.error || 'Failed to delete badge', 'error');
    }
    setActionLoading(false);
  };

  const openAssignModal = (badge: Badge) => {
    setSelectedBadge(badge);
    setShowAssignModal(true);
  };

  const openEditModal = (badge: Badge) => {
    setEditBadge(badge);
    setShowCreateModal(true);
  };

  const openDeleteModal = (badge: Badge) => {
    setSelectedBadge(badge);
    setShowDeleteModal(true);
  };

  const filteredBadges = badges.filter(
    (badge) =>
      badge.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      badge.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#FF66AB' }}>
            <BadgeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Badge Management
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchBadges}
              disabled={loading}
              sx={{ borderColor: 'rgba(255,102,171,0.5)', color: 'white' }}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setEditBadge(null);
                setShowCreateModal(true);
              }}
              sx={{
                background: 'linear-gradient(135deg, #FF66AB 0%, #FF8FB1 100%)',
                '&:hover': { background: 'linear-gradient(135deg, #FF8FB1 0%, #FF66AB 100%)' },
              }}
            >
              Create Badge
            </Button>
          </Box>
        </Box>

        {/* Search Bar */}
        <TextField
          fullWidth
          placeholder="Search badges by name or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ mb: 3 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'rgba(255,255,255,0.5)' }} />
              </InputAdornment>
            ),
          }}
        />

        {/* Loading State */}
        {loading && (
          <Box sx={{ width: '100%', mt: 2 }}>
            <LinearProgress sx={{ bgcolor: 'rgba(255,102,171,0.2)', '& .MuiLinearProgress-bar': { bgcolor: '#FF66AB' } }} />
          </Box>
        )}

        {/* Badges Grid */}
        {!loading && filteredBadges.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'transparent', border: '1px dashed rgba(255,102,171,0.3)' }}>
            <BadgeIcon sx={{ fontSize: 60, color: 'rgba(255,255,255,0.2)', mb: 2 }} />
            <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.5)' }}>
              {searchQuery ? 'No badges found matching your search' : 'No badges created yet'}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.3)', mt: 1 }}>
              Click "Create Badge" to add your first badge
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {filteredBadges.map((badge) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={badge.id}>
                <Zoom in timeout={300}>
                  <Card>
                    <Box
                      sx={{
                        height: 120,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'linear-gradient(135deg, rgba(255,102,171,0.1) 0%, rgba(102,217,255,0.1) 100%)',
                      }}
                    >
                      <Avatar
                        src={badge.image_url}
                        alt={badge.name}
                        variant="rounded"
                        sx={{
                          width: 80,
                          height: 80,
                          border: '2px solid rgba(255,102,171,0.3)',
                          boxShadow: '0 4px 20px rgba(255,102,171,0.2)',
                        }}
                      >
                        <ImageIcon sx={{ fontSize: 40, color: 'rgba(255,255,255,0.3)' }} />
                      </Avatar>
                    </Box>
                    <CardContent>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }} noWrap>
                        {badge.name}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'rgba(255,255,255,0.6)',
                          mb: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {badge.description || 'No description'}
                      </Typography>
                      <Chip
                        size="small"
                        icon={<PeopleIcon sx={{ fontSize: 16 }} />}
                        label={`${badge.awarded_count} awarded`}
                        sx={{ bgcolor: 'rgba(102,217,255,0.2)', color: '#66D9FF' }}
                      />
                    </CardContent>
                    <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                      <Box>
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => openEditModal(badge)} sx={{ color: '#66D9FF' }}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Assign to Users">
                          <IconButton size="small" onClick={() => openAssignModal(badge)} sx={{ color: '#FF66AB' }}>
                            <PeopleIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                      <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => openDeleteModal(badge)} sx={{ color: '#ff5252' }}>
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </CardActions>
                  </Card>
                </Zoom>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Stats Footer */}
        {!loading && badges.length > 0 && (
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
              Total: {badges.length} badge{badges.length !== 1 ? 's' : ''} • Total Awards:{' '}
              {badges.reduce((sum, b) => sum + b.awarded_count, 0)}
            </Typography>
          </Box>
        )}

        {/* Modals */}
        <CreateBadgeModal
          open={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setEditBadge(null);
          }}
          onSuccess={editBadge ? handleEditSuccess : handleCreateSuccess}
          editBadge={editBadge}
        />

        <AssignBadgeModal
          open={showAssignModal}
          onClose={() => {
            setShowAssignModal(false);
            setSelectedBadge(null);
          }}
          badge={selectedBadge}
          onSuccess={handleAssignSuccess}
        />

        <DeleteConfirmModal
          open={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedBadge(null);
          }}
          badge={selectedBadge}
          onConfirm={handleDelete}
          loading={actionLoading}
        />

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
};

export default BadgesPage;