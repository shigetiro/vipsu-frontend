import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  EmojiEvents as TrophyIcon,
  People as PeopleIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { format, parseISO, isAfter, isBefore, addDays } from 'date-fns';
import { adminApi } from '../../api/admin';
import { useToast } from '../../hooks/useToast';

interface DailyChallenge {
  id: number;
  name: string;
  description: string;
  beatmap_id: number;
  beatmap_title: string;
  beatmap_artist: string;
  beatmap_difficulty: string;
  start_time: string;
  end_time: string;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  participant_count: number;
  total_score: number;
  ruleset: number;
  mods: string[];
  created_at: string;
}

interface ChallengeParticipant {
  user_id: number;
  username: string;
  country: string;
  score: number;
  accuracy: number;
  max_combo: number;
  rank: number;
}

interface ChallengeStats {
  total_participants: number;
  average_score: number;
  average_accuracy: number;
  top_score: number;
  completion_rate: number;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div hidden={value !== index} id={`challenge-tabpanel-${index}`} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export const DailyChallengesPage: React.FC = () => {
  const { showToast } = useToast();
  const [challenges, setChallenges] = useState<DailyChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChallenge, setSelectedChallenge] = useState<DailyChallenge | null>(null);
  const [participants, setParticipants] = useState<ChallengeParticipant[]>([]);
  const [stats, setStats] = useState<ChallengeStats | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    beatmap_id: '',
    start_time: '',
    end_time: '',
    ruleset: 0,
    mods: [] as string[],
  });
  
  // Tab state for detail view
  const [detailTab, setDetailTab] = useState(0);

  const fetchChallenges = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminApi.getDailyChallenges();
      setChallenges(response.data);
    } catch (error) {
      showToast('Failed to fetch daily challenges', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  const fetchChallengeDetails = async (challengeId: number) => {
    setDetailLoading(true);
    try {
      const [participantsRes, statsRes] = await Promise.all([
        adminApi.getDailyChallengeParticipants(challengeId),
        adminApi.getDailyChallengeStats(challengeId),
      ]);
      setParticipants(participantsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      showToast('Failed to fetch challenge details', 'error');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCreateChallenge = async () => {
    try {
      await adminApi.createDailyChallenge({
        name: formData.name,
        description: formData.description,
        beatmap_id: parseInt(formData.beatmap_id),
        start_time: formData.start_time,
        end_time: formData.end_time,
        ruleset: formData.ruleset,
        mods: formData.mods,
      });
      showToast('Daily challenge created successfully', 'success');
      setCreateDialogOpen(false);
      resetFormData();
      fetchChallenges();
    } catch (error) {
      showToast('Failed to create daily challenge', 'error');
    }
  };

  const handleEditChallenge = async () => {
    if (!selectedChallenge) return;
    try {
      await adminApi.updateDailyChallenge(selectedChallenge.id, {
        name: formData.name,
        description: formData.description,
        start_time: formData.start_time,
        end_time: formData.end_time,
        mods: formData.mods,
      });
      showToast('Daily challenge updated successfully', 'success');
      setEditDialogOpen(false);
      resetFormData();
      fetchChallenges();
    } catch (error) {
      showToast('Failed to update daily challenge', 'error');
    }
  };

  const handleDeleteChallenge = async () => {
    if (!selectedChallenge) return;
    try {
      await adminApi.deleteDailyChallenge(selectedChallenge.id);
      showToast('Daily challenge deleted successfully', 'success');
      setDeleteDialogOpen(false);
      setSelectedChallenge(null);
      fetchChallenges();
    } catch (error) {
      showToast('Failed to delete daily challenge', 'error');
    }
  };

  const handleForceComplete = async (challenge: DailyChallenge) => {
    try {
      await adminApi.forceCompleteDailyChallenge(challenge.id);
      showToast('Challenge force completed', 'success');
      fetchChallenges();
    } catch (error) {
      showToast('Failed to force complete challenge', 'error');
    }
  };

  const handleCancelChallenge = async (challenge: DailyChallenge) => {
    try {
      await adminApi.cancelDailyChallenge(challenge.id);
      showToast('Challenge cancelled', 'success');
      fetchChallenges();
    } catch (error) {
      showToast('Failed to cancel challenge', 'error');
    }
  };

  const openEditDialog = (challenge: DailyChallenge) => {
    setSelectedChallenge(challenge);
    setFormData({
      name: challenge.name,
      description: challenge.description,
      beatmap_id: challenge.beatmap_id.toString(),
      start_time: challenge.start_time,
      end_time: challenge.end_time,
      ruleset: challenge.ruleset,
      mods: challenge.mods,
    });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (challenge: DailyChallenge) => {
    setSelectedChallenge(challenge);
    setDeleteDialogOpen(true);
  };

  const openDetailDialog = (challenge: DailyChallenge) => {
    setSelectedChallenge(challenge);
    fetchChallengeDetails(challenge.id);
    setDetailDialogOpen(true);
  };

  const resetFormData = () => {
    setFormData({
      name: '',
      description: '',
      beatmap_id: '',
      start_time: '',
      end_time: '',
      ruleset: 0,
      mods: [],
    });
  };

  const getStatusColor = (status: DailyChallenge['status']) => {
    switch (status) {
      case 'scheduled': return 'warning';
      case 'active': return 'success';
      case 'completed': return 'info';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getRulesetName = (ruleset: number) => {
    switch (ruleset) {
      case 0: return 'osu!';
      case 1: return 'Taiko';
      case 2: return 'Catch';
      case 3: return 'Mania';
      default: return 'Unknown';
    }
  };

  const getChallengeProgress = (challenge: DailyChallenge) => {
    const now = new Date();
    const start = parseISO(challenge.start_time);
    const end = parseISO(challenge.end_time);
    
    if (isBefore(now, start)) return 0;
    if (isAfter(now, end)) return 100;
    
    const totalDuration = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    return Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Daily Challenges
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchChallenges}
            sx={{ mr: 1 }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              resetFormData();
              setCreateDialogOpen(true);
            }}
          >
            Create Challenge
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Active Challenges
              </Typography>
              <Typography variant="h4">
                {challenges.filter(c => c.status === 'active').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Scheduled
              </Typography>
              <Typography variant="h4">
                {challenges.filter(c => c.status === 'scheduled').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Participants (Active)
              </Typography>
              <Typography variant="h4">
                {challenges
                  .filter(c => c.status === 'active')
                  .reduce((sum, c) => sum + c.participant_count, 0)
                  .toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Completed This Week
              </Typography>
              <Typography variant="h4">
                {challenges.filter(c => 
                  c.status === 'completed' && 
                  isAfter(parseISO(c.end_time), addDays(new Date(), -7))
                ).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Challenges Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Beatmap</TableCell>
              <TableCell>Ruleset</TableCell>
              <TableCell>Start Time</TableCell>
              <TableCell>End Time</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Participants</TableCell>
              <TableCell>Progress</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {challenges.map((challenge) => (
              <TableRow key={challenge.id} hover>
                <TableCell>
                  <Box>
                    <Typography fontWeight="medium">{challenge.name}</Typography>
                    <Typography variant="caption" color="textSecondary">
                      ID: {challenge.id}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2">{challenge.beatmap_title}</Typography>
                    <Typography variant="caption" color="textSecondary">
                      by {challenge.beatmap_artist} [{challenge.beatmap_difficulty}]
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip label={getRulesetName(challenge.ruleset)} size="small" />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {format(parseISO(challenge.start_time), 'MMM dd, yyyy HH:mm')}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {format(parseISO(challenge.end_time), 'MMM dd, yyyy HH:mm')}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={challenge.status.toUpperCase()}
                    color={getStatusColor(challenge.status) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center">
                    <PeopleIcon fontSize="small" sx={{ mr: 0.5 }} />
                    {challenge.participant_count.toLocaleString()}
                  </Box>
                </TableCell>
                <TableCell sx={{ minWidth: 120 }}>
                  {challenge.status === 'active' && (
                    <Box>
                      <LinearProgress
                        variant="determinate"
                        value={getChallengeProgress(challenge)}
                        sx={{ mb: 0.5 }}
                      />
                      <Typography variant="caption" color="textSecondary">
                        {Math.round(getChallengeProgress(challenge))}%
                      </Typography>
                    </Box>
                  )}
                  {challenge.status === 'scheduled' && (
                    <Typography variant="caption" color="textSecondary">
                      Not started
                    </Typography>
                  )}
                  {challenge.status === 'completed' && (
                    <Typography variant="caption" color="textSecondary">
                      Finished
                    </Typography>
                  )}
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="View Details">
                    <IconButton size="small" onClick={() => openDetailDialog(challenge)}>
                      <ViewIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  {challenge.status !== 'completed' && challenge.status !== 'cancelled' && (
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => openEditDialog(challenge)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  {challenge.status === 'scheduled' && (
                    <Tooltip title="Delete">
                      <IconButton size="small" onClick={() => openDeleteDialog(challenge)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  {challenge.status === 'active' && (
                    <>
                      <Tooltip title="Force Complete">
                        <IconButton size="small" onClick={() => handleForceComplete(challenge)}>
                          <StopIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Cancel">
                        <IconButton size="small" onClick={() => handleCancelChallenge(challenge)}>
                          <DeleteIcon fontSize="small" color="error" />
                        </IconButton>
                      </Tooltip>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {challenges.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  <Typography color="textSecondary" sx={{ py: 4 }}>
                    No daily challenges found. Create one to get started.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Daily Challenge</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Challenge Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              margin="normal"
              multiline
              rows={3}
            />
            <TextField
              fullWidth
              label="Beatmap ID"
              value={formData.beatmap_id}
              onChange={(e) => setFormData({ ...formData, beatmap_id: e.target.value })}
              margin="normal"
              type="number"
              required
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Ruleset</InputLabel>
              <Select
                value={formData.ruleset}
                onChange={(e) => setFormData({ ...formData, ruleset: e.target.value as number })}
                label="Ruleset"
              >
                <MenuItem value={0}>osu!</MenuItem>
                <MenuItem value={1}>Taiko</MenuItem>
                <MenuItem value={2}>Catch</MenuItem>
                <MenuItem value={3}>Mania</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Start Time"
              type="datetime-local"
              value={formData.start_time}
              onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
              margin="normal"
              InputLabelProps={{ shrink: true }}
              required
            />
            <TextField
              fullWidth
              label="End Time"
              type="datetime-local"
              value={formData.end_time}
              onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
              margin="normal"
              InputLabelProps={{ shrink: true }}
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateChallenge}
            disabled={!formData.name || !formData.beatmap_id || !formData.start_time || !formData.end_time}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Daily Challenge</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Challenge Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              margin="normal"
              multiline
              rows={3}
            />
            <TextField
              fullWidth
              label="Start Time"
              type="datetime-local"
              value={formData.start_time}
              onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
              margin="normal"
              InputLabelProps={{ shrink: true }}
              required
            />
            <TextField
              fullWidth
              label="End Time"
              type="datetime-local"
              value={formData.end_time}
              onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
              margin="normal"
              InputLabelProps={{ shrink: true }}
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleEditChallenge}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Daily Challenge</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This action cannot be undone.
          </Alert>
          <Typography>
            Are you sure you want to delete "{selectedChallenge?.name}"?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDeleteChallenge}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <TrophyIcon sx={{ mr: 1 }} />
            {selectedChallenge?.name}
          </Box>
        </DialogTitle>
        <DialogContent>
          {detailLoading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : (
            <Box>
              <Tabs value={detailTab} onChange={(_, v) => setDetailTab(v)}>
                <Tab label="Overview" />
                <Tab label={`Leaderboard (${participants.length})`} />
              </Tabs>
              
              <TabPanel value={detailTab} index={0}>
                {stats && (
                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography color="textSecondary" variant="caption">
                            Total Participants
                          </Typography>
                          <Typography variant="h5">
                            {stats.total_participants.toLocaleString()}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography color="textSecondary" variant="caption">
                            Average Score
                          </Typography>
                          <Typography variant="h5">
                            {Math.round(stats.average_score).toLocaleString()}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography color="textSecondary" variant="caption">
                            Average Accuracy
                          </Typography>
                          <Typography variant="h5">
                            {stats.average_accuracy.toFixed(2)}%
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography color="textSecondary" variant="caption">
                            Top Score
                          </Typography>
                          <Typography variant="h5">
                            {stats.top_score.toLocaleString()}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                )}
                
                {selectedChallenge && (
                  <Box mt={2}>
                    <Typography variant="subtitle1" gutterBottom>
                      Challenge Details
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText
                          primary="Beatmap"
                          secondary={`${selectedChallenge.beatmap_title} by ${selectedChallenge.beatmap_artist} [${selectedChallenge.beatmap_difficulty}]`}
                        />
                      </ListItem>
                      <Divider />
                      <ListItem>
                        <ListItemText
                          primary="Duration"
                          secondary={`${format(parseISO(selectedChallenge.start_time), 'MMM dd, yyyy HH:mm')} - ${format(parseISO(selectedChallenge.end_time), 'MMM dd, yyyy HH:mm')}`}
                        />
                      </ListItem>
                      <Divider />
                      <ListItem>
                        <ListItemText
                          primary="Ruleset"
                          secondary={getRulesetName(selectedChallenge.ruleset)}
                        />
                      </ListItem>
                    </List>
                  </Box>
                )}
              </TabPanel>
              
              <TabPanel value={detailTab} index={1}>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Rank</TableCell>
                        <TableCell>Player</TableCell>
                        <TableCell>Score</TableCell>
                        <TableCell>Accuracy</TableCell>
                        <TableCell>Max Combo</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {participants.slice(0, 50).map((participant) => (
                        <TableRow key={participant.user_id}>
                          <TableCell>
                            <Typography fontWeight="bold">#{participant.rank}</Typography>
                          </TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center">
                              <img
                                src={`https://assets.ppy.sh/flags/${participant.country}.png`}
                                alt={participant.country}
                                style={{ width: 16, height: 11, marginRight: 8 }}
                              />
                              {participant.username}
                            </Box>
                          </TableCell>
                          <TableCell>{participant.score.toLocaleString()}</TableCell>
                          <TableCell>{participant.accuracy.toFixed(2)}%</TableCell>
                          <TableCell>{participant.max_combo}x</TableCell>
                        </TableRow>
                      ))}
                      {participants.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} align="center">
                            No participants yet
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </TabPanel>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DailyChallengesPage;