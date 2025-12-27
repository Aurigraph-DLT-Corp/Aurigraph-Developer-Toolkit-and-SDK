/**
 * DemoScheduler Component
 *
 * Demo scheduling calendar interface for the Enterprise Portal
 * Features:
 * - Visual calendar with available time slots
 * - Real-time demo booking
 * - Meeting platform selection (Zoom, Teams, Google Meet)
 * - Timezone support
 * - Automatic calendar invite generation
 * - Demo confirmation and tracking
 */

import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip,
  Box,
  LinearProgress,
  CircularProgress,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTodaysDemos, createDemoRequest, scheduleDemoRequest } from '../../slices/demoSlice';
import {
  DemoType,
  DemoStatus,
  ScheduleDemoRequest,
  DemoRequest,
} from '../../services/CrmService';
import { AppDispatch, RootState } from '../../store';

interface TimeSlot {
  time: string;
  available: boolean;
  demoId?: string;
}

const DemoScheduler: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { todaysDemos, status, error } = useSelector((state: RootState) => state.demos);

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [meetingPlatform, setMeetingPlatform] = useState<string>('zoom');
  const [demoType, setDemoType] = useState<DemoType>(DemoType.STANDARD_DEMO);
  const [timezone, setTimezone] = useState<string>('America/New_York');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedDemo, setSelectedDemo] = useState<DemoRequest | null>(null);

  // Generate demo time slots for the day
  useEffect(() => {
    const slots: TimeSlot[] = [];
    const businessHours = [9, 10, 11, 13, 14, 15, 16, 17]; // 9 AM - 5 PM (skip lunch hour)

    businessHours.forEach((hour) => {
      const time = `${hour.toString().padStart(2, '0')}:00`;
      // Check if slot is already booked
      const isBooked = todaysDemos.some((demo) => {
        if (!demo.startTime) return false;
        const demoHour = new Date(demo.startTime).getHours();
        return demoHour === hour;
      });

      slots.push({
        time,
        available: !isBooked,
        demoId: isBooked ? todaysDemos.find((d) => d.startTime && new Date(d.startTime).getHours() === hour)?.id : undefined,
      });
    });

    setTimeSlots(slots);
  }, [todaysDemos]);

  useEffect(() => {
    dispatch(fetchTodaysDemos());
  }, [dispatch]);

  const handleScheduleDemo = async () => {
    if (!selectedSlot) return;

    const [hour, minute] = selectedSlot.split(':').map(Number);
    const demoDateTime = new Date(selectedDate);
    demoDateTime.setHours(hour, minute, 0, 0);

    const scheduleRequest: ScheduleDemoRequest = {
      leadId: 'current-lead-id', // This would come from context/props
      demoType,
      startTime: demoDateTime.toISOString(),
      durationMinutes: 60,
      preferredTimezone: timezone,
      notes: `Booking via ${meetingPlatform}`,
    };

    try {
      // In a real app, this would be dispatched after creating the demo
      // await dispatch(createDemoRequest({ leadId, demoType }));
      // await dispatch(scheduleDemoRequest({ demoId, request: scheduleRequest }));

      setOpenDialog(false);
      setSelectedSlot(null);
      // Show success message
    } catch (err) {
      console.error('Failed to schedule demo:', err);
    }
  };

  const getSlotColor = (slot: TimeSlot): string => {
    if (!slot.available) return '#e0e0e0';
    if (slot.time === selectedSlot) return '#667eea';
    return '#f5f5f5';
  };

  const getSlotTextColor = (slot: TimeSlot): string => {
    if (!slot.available) return '#999';
    if (slot.time === selectedSlot) return '#fff';
    return '#333';
  };

  const getDemoStatusColor = (status: DemoStatus): 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' => {
    switch (status) {
      case DemoStatus.COMPLETED:
        return 'success';
      case DemoStatus.CONFIRMED:
        return 'primary';
      case DemoStatus.SCHEDULED:
        return 'info';
      case DemoStatus.CANCELLED:
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Grid container spacing={3}>
        {/* Demo Calendar */}
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
              Select Your Demo Time
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {/* Date and Settings */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Timezone</InputLabel>
                  <Select
                    value={timezone}
                    label="Timezone"
                    onChange={(e) => setTimezone(e.target.value)}
                  >
                    <MenuItem value="America/New_York">Eastern (ET)</MenuItem>
                    <MenuItem value="America/Chicago">Central (CT)</MenuItem>
                    <MenuItem value="America/Denver">Mountain (MT)</MenuItem>
                    <MenuItem value="America/Los_Angeles">Pacific (PT)</MenuItem>
                    <MenuItem value="Europe/London">GMT (London)</MenuItem>
                    <MenuItem value="Europe/Paris">CET (Paris)</MenuItem>
                    <MenuItem value="Asia/Tokyo">JST (Tokyo)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Demo Type</InputLabel>
                  <Select
                    value={demoType}
                    label="Demo Type"
                    onChange={(e) => setDemoType(e.target.value as DemoType)}
                  >
                    <MenuItem value={DemoType.STANDARD_DEMO}>Standard Demo (60 min)</MenuItem>
                    <MenuItem value={DemoType.TECHNICAL_DEEP_DIVE}>Technical Deep Dive (90 min)</MenuItem>
                    <MenuItem value={DemoType.EXECUTIVE_BRIEFING}>Executive Briefing (45 min)</MenuItem>
                    <MenuItem value={DemoType.PROOF_OF_CONCEPT}>Proof of Concept (2 hours)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {/* Time Slots */}
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
              Available Times for {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </Typography>

            {status === 'loading' && <CircularProgress size={30} />}

            <Grid container spacing={1} sx={{ mb: 3 }}>
              {timeSlots.map((slot) => (
                <Grid item xs={6} sm={4} md={3} key={slot.time}>
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: getSlotColor(slot),
                      color: getSlotTextColor(slot),
                      borderRadius: 1,
                      cursor: slot.available ? 'pointer' : 'not-allowed',
                      border: slot.time === selectedSlot ? '2px solid #667eea' : '1px solid #ddd',
                      textAlign: 'center',
                      fontWeight: 500,
                      transition: 'all 0.2s',
                      '&:hover': {
                        bgcolor: slot.available ? '#e8eef7' : '#e0e0e0',
                        transform: slot.available ? 'scale(1.05)' : 'none',
                      },
                    }}
                    onClick={() => {
                      if (slot.available) {
                        setSelectedSlot(slot.time);
                        setOpenDialog(true);
                      }
                    }}
                  >
                    {slot.time}
                    {!slot.available && <Typography variant="caption" display="block">Booked</Typography>}
                  </Box>
                </Grid>
              ))}
            </Grid>

            <Button
              variant="contained"
              disabled={!selectedSlot || status === 'loading'}
              onClick={handleScheduleDemo}
              sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            >
              {status === 'loading' ? 'Scheduling...' : 'Confirm Time Slot'}
            </Button>
          </Paper>
        </Grid>

        {/* Sidebar: Today's Demos & Meeting Platforms */}
        <Grid item xs={12} md={4}>
          {/* Meeting Platform Selection */}
          <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Meeting Platform
            </Typography>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Select Platform</InputLabel>
              <Select
                value={meetingPlatform}
                label="Select Platform"
                onChange={(e) => setMeetingPlatform(e.target.value)}
              >
                <MenuItem value="zoom">Zoom</MenuItem>
                <MenuItem value="teams">Microsoft Teams</MenuItem>
                <MenuItem value="google-meet">Google Meet</MenuItem>
                <MenuItem value="webex">Cisco Webex</MenuItem>
              </Select>
            </FormControl>

            <Typography variant="body2" color="textSecondary">
              You'll receive a calendar invite with the meeting link after booking.
            </Typography>
          </Paper>

          {/* Today's Scheduled Demos */}
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Today's Scheduled Demos
            </Typography>

            {todaysDemos.length === 0 ? (
              <Typography variant="body2" color="textSecondary">
                No demos scheduled for today.
              </Typography>
            ) : (
              <Box>
                {todaysDemos.map((demo) => (
                  <Card
                    key={demo.id}
                    sx={{
                      mb: 2,
                      bgcolor: '#f5f5f5',
                      cursor: 'pointer',
                      '&:hover': { bgcolor: '#efefef' },
                    }}
                    onClick={() => setSelectedDemo(demo)}
                  >
                    <CardContent sx={{ pb: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {demo.startTime && new Date(demo.startTime).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {demo.demoType}
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        <Chip
                          label={demo.status}
                          size="small"
                          color={getDemoStatusColor(demo.status)}
                          variant="outlined"
                        />
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Demo Confirmation Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Confirm Demo Booking</DialogTitle>
        <DialogContent sx={{ minWidth: 400 }}>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" gutterBottom>
              <strong>Time:</strong> {selectedSlot} {selectedDate.toLocaleDateString()}
            </Typography>
            <Typography variant="body2" gutterBottom>
              <strong>Type:</strong> {demoType}
            </Typography>
            <Typography variant="body2" gutterBottom>
              <strong>Platform:</strong> {meetingPlatform.toUpperCase()}
            </Typography>
            <Typography variant="body2" gutterBottom>
              <strong>Timezone:</strong> {timezone}
            </Typography>
            <Alert severity="info" sx={{ mt: 2 }}>
              A calendar invite and meeting link will be sent to your email.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={handleScheduleDemo}
            variant="contained"
            sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
          >
            Confirm Booking
          </Button>
        </DialogActions>
      </Dialog>

      {/* Selected Demo Details Dialog */}
      <Dialog open={!!selectedDemo} onClose={() => setSelectedDemo(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Demo Details</DialogTitle>
        <DialogContent>
          {selectedDemo && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                <strong>ID:</strong> {selectedDemo.id}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Status:</strong> {selectedDemo.status}
              </Typography>
              {selectedDemo.startTime && (
                <Typography variant="body2" gutterBottom>
                  <strong>Start:</strong> {new Date(selectedDemo.startTime).toLocaleString()}
                </Typography>
              )}
              {selectedDemo.meetingUrl && (
                <Typography variant="body2" gutterBottom>
                  <strong>Meeting:</strong>{' '}
                  <a href={selectedDemo.meetingUrl} target="_blank" rel="noopener noreferrer">
                    {selectedDemo.meetingPlatform}
                  </a>
                </Typography>
              )}
              {selectedDemo.recordingUrl && (
                <Typography variant="body2" gutterBottom>
                  <strong>Recording:</strong>{' '}
                  <a href={selectedDemo.recordingUrl} target="_blank" rel="noopener noreferrer">
                    View Recording
                  </a>
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default DemoScheduler;
