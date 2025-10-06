import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Button, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, Select, MenuItem, FormControl, InputLabel, List,
  ListItem, ListItemText, ListItemIcon, Switch, FormControlLabel,
  CircularProgress, Alert
} from '@mui/material';
import { Add, Delete, Edit, Group, Lock, Settings, Channel } from '@mui/icons-material';

const API_BASE = 'http://localhost:9003/api/v11';

interface ChannelData {
  id: string;
  name: string;
  members: string[];
  policies: string[];
  privacy: 'public' | 'private' | 'consortium';
  status: 'active' | 'inactive';
  transactions: number;
}

export const ChannelManagement: React.FC = () => {
  const [channels, setChannels] = useState<ChannelData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [channelForm, setChannelForm] = useState({
    name: '',
    privacy: 'public',
    members: [] as string[]
  });

  // Fetch channels from API with auto-refresh every 30 seconds
  useEffect(() => {
    fetchChannels();
    const interval = setInterval(fetchChannels, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchChannels = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/channels`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      setChannels(data);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch channels:', err);
      setError(err.message || 'Failed to fetch channels');
    } finally {
      setLoading(false);
    }
  };

  const createChannel = async () => {
    try {
      const response = await fetch(`${API_BASE}/channels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: channelForm.name,
          privacy: channelForm.privacy,
          members: channelForm.members
        })
      });

      if (!response.ok) throw new Error('Failed to create channel');

      const newChannel = await response.json();
      setChannels([...channels, newChannel]);
      setDialogOpen(false);
      setChannelForm({ name: '', privacy: 'public', members: [] });
    } catch (err: any) {
      setError(err.message || 'Failed to create channel');
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Channel Management</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setDialogOpen(true)}>
          Create Channel
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
          <Button size="small" onClick={fetchChannels} sx={{ ml: 2 }}>
            Retry
          </Button>
        </Alert>
      )}

      {loading && (
        <Box display="flex" justifyContent="center" my={3}>
          <CircularProgress />
        </Box>
      )}

      <Grid container spacing={3}>
        {channels.map(channel => (
          <Grid item xs={12} md={6} key={channel.id}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">{channel.name}</Typography>
                  <Chip
                    label={channel.privacy}
                    color={channel.privacy === 'private' ? 'error' : 'primary'}
                    size="small"
                  />
                </Box>
                <List dense>
                  <ListItem>
                    <ListItemIcon><Group /></ListItemIcon>
                    <ListItemText primary="Members" secondary={channel.members.join(', ')} />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><Lock /></ListItemIcon>
                    <ListItemText primary="Policies" secondary={channel.policies.join(', ')} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Transactions" secondary={channel.transactions.toLocaleString()} />
                  </ListItem>
                </List>
                <Box display="flex" gap={1} mt={2}>
                  <Button size="small" variant="outlined">Configure</Button>
                  <Button size="small" variant="outlined">Members</Button>
                  <Button size="small" variant="outlined" color="error">Delete</Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Channel</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Channel Name"
            value={channelForm.name}
            onChange={(e) => setChannelForm({...channelForm, name: e.target.value})}
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Privacy Level</InputLabel>
            <Select
              value={channelForm.privacy}
              onChange={(e) => setChannelForm({...channelForm, privacy: e.target.value})}
            >
              <MenuItem value="public">Public</MenuItem>
              <MenuItem value="private">Private</MenuItem>
              <MenuItem value="consortium">Consortium</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Initial Members (comma-separated)"
            onChange={(e) => setChannelForm({...channelForm, members: e.target.value.split(',')})}
            margin="normal"
            helperText="Enter organization names separated by commas"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={createChannel}>Create</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChannelManagement;
