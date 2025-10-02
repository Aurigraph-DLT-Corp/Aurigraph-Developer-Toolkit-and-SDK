import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Button, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, Select, MenuItem, FormControl, InputLabel, List,
  ListItem, ListItemText, ListItemIcon, Switch, FormControlLabel
} from '@mui/material';
import { Add, Delete, Edit, Group, Lock, Settings, Channel } from '@mui/icons-material';

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
  const [channels, setChannels] = useState<ChannelData[]>([
    {
      id: 'ch1',
      name: 'Main Channel',
      members: ['Org1', 'Org2', 'Org3'],
      policies: ['Endorsement', 'Reader', 'Writer'],
      privacy: 'public',
      status: 'active',
      transactions: 125000
    },
    {
      id: 'ch2',
      name: 'Private Channel',
      members: ['Org1', 'Org2'],
      policies: ['Restricted'],
      privacy: 'private',
      status: 'active',
      transactions: 45000
    }
  ]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [channelForm, setChannelForm] = useState({
    name: '',
    privacy: 'public',
    members: [] as string[]
  });

  const createChannel = () => {
    const newChannel: ChannelData = {
      id: `ch_${Date.now()}`,
      name: channelForm.name,
      members: channelForm.members,
      policies: ['Default'],
      privacy: channelForm.privacy as any,
      status: 'active',
      transactions: 0
    };
    setChannels([...channels, newChannel]);
    setDialogOpen(false);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Channel Management</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setDialogOpen(true)}>
          Create Channel
        </Button>
      </Box>

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
