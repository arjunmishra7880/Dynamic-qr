import React, { useState } from 'react';
import { useSearchParams, Link as RouterLink } from 'react-router-dom';
import {
  Box, Paper, Typography, Button, Chip, TextField,
  Alert, Stack, CircularProgress, Divider
} from '@mui/material';
import ContactlessIcon from '@mui/icons-material/Contactless';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorIcon from '@mui/icons-material/Error';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import LinkIcon from '@mui/icons-material/Link';
import { cardService } from '../services/api';

export const CardStatusPage = () => {
  const [params] = useSearchParams();
  const status = (params.get('status') || 'INACTIVE').toUpperCase();
  const cardId = params.get('card_id') || '';

  // Setup form state for first-scan physical QR activation
  const [destUrl, setDestUrl] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [activatedUrl, setActivatedUrl] = useState('');

  const isUnactivated = status === 'UNACTIVATED' || status === 'AVAILABLE';

  const handleActivateCard = async (e) => {
    e.preventDefault();
    if (!destUrl.trim()) {
      setErrorMsg('Please enter a target destination URL (e.g. https://www.youtube.com).');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');
      setSuccessMsg('');

      const res = await cardService.activate(cardId, {
        destination_url: destUrl.trim(),
        admin_password: adminPassword.trim(),
        purpose: 'Dynamic Customer Destination',
      });

      const redirectTarget = res.data.destination_url || res.data.card?.destination_url || destUrl.trim();
      setActivatedUrl(redirectTarget);
      setSuccessMsg(`Card ${cardId} activated successfully! Redirecting now to ${redirectTarget}...`);

      // Automatically redirect after brief feedback
      setTimeout(() => {
        window.location.replace(redirectTarget);
      }, 1500);
    } catch (err) {
      console.error("Activation error:", err);
      setErrorMsg(
        err.response?.data?.error ||
        err.response?.data?.detail ||
        'Activation failed. Please check your destination URL and admin password.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  let title = "Card Status Notice";
  let message = "This card is currently not configured to route to an active destination.";
  let Icon = InfoOutlinedIcon;
  let iconBg = '#fee2e2';
  let iconColor = '#ef4444';

  if (status === 'NOT_FOUND') {
    title = "Card Not Found";
    message = "Sorry, this card does not exist or has an invalid identifier.";
    Icon = ErrorIcon;
  } else if (status === 'SUSPENDED') {
    title = "Card Temporarily Suspended";
    message = "This card is temporarily unavailable. Please check back later or notify venue staff.";
    Icon = WarningAmberIcon;
    iconBg = '#fef3c7';
    iconColor = '#d97706';
  } else if (status === 'DEACTIVATED') {
    title = "Card Inactive";
    message = "This card has been retired or deactivated by the platform.";
    Icon = ErrorIcon;
  } else if (isUnactivated) {
    title = "⚡ First-Scan Dynamic Setup";
    message = "Physical QR card detected! Configure where customers will be redirected when they scan this code.";
    Icon = QrCode2Icon;
    iconBg = '#e0e7ff';
    iconColor = '#4f46e5';
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0f172a',
        backgroundImage: 'radial-gradient(at 50% 0%, rgba(99, 102, 241, 0.15) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(14, 165, 233, 0.1) 0px, transparent 50%)',
        p: 2,
      }}
    >
      <Paper
        elevation={10}
        sx={{
          p: { xs: 3, sm: 4 },
          borderRadius: 3.5,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          textAlign: 'center',
          maxWidth: 480,
          width: '100%',
          backgroundColor: '#ffffff',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
        }}
      >
        <Box
          sx={{
            width: 58,
            height: 58,
            borderRadius: '50%',
            backgroundColor: iconBg,
            color: iconColor,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 2,
          }}
        >
          <Icon fontSize="large" />
        </Box>

        {cardId && (
          <Box sx={{ mb: 1.5 }}>
            <Chip
              label={`PHYSICAL CARD: ${cardId}`}
              color="primary"
              size="small"
              sx={{ fontFamily: 'monospace', fontWeight: 800, letterSpacing: '0.05em' }}
            />
          </Box>
        )}

        <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, color: '#0f172a' }}>
          {title}
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.6 }}>
          {message}
        </Typography>

        {/* Dynamic First-Scan Activation Form */}
        {isUnactivated && cardId && (
          <Box
            component="form"
            onSubmit={handleActivateCard}
            sx={{
              mt: 1,
              mb: 3,
              p: 2.5,
              bgcolor: '#f8fafc',
              borderRadius: 2.5,
              border: '1px solid #e2e8f0',
              textAlign: 'left'
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 0.8 }}>
              <LinkIcon fontSize="small" color="primary" /> Set Customer Destination URL
            </Typography>

            {successMsg && (
              <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mb: 2, borderRadius: 2 }}>
                {successMsg}
              </Alert>
            )}

            {errorMsg && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                {errorMsg}
              </Alert>
            )}

            <TextField
              fullWidth
              size="small"
              label="Destination Link"
              placeholder="e.g. https://www.youtube.com"
              value={destUrl}
              onChange={(e) => setDestUrl(e.target.value)}
              required
              disabled={submitting || !!activatedUrl}
              sx={{ mb: 1.5, backgroundColor: '#ffffff' }}
              helperText="When customers scan this printed QR, they will instantly land here."
            />

            {/* Quick preset URLs */}
            <Stack direction="row" spacing={0.8} sx={{ mb: 2, flexWrap: 'wrap', gap: 0.5 }}>
              <Button
                size="small"
                variant="outlined"
                disabled={submitting || !!activatedUrl}
                onClick={() => setDestUrl('https://www.youtube.com')}
                sx={{ textTransform: 'none', py: 0.3, px: 1, fontSize: '0.72rem', borderRadius: 1.5, borderColor: '#cbd5e1' }}
              >
                🎬 YouTube
              </Button>
              <Button
                size="small"
                variant="outlined"
                disabled={submitting || !!activatedUrl}
                onClick={() => setDestUrl('https://instagram.com')}
                sx={{ textTransform: 'none', py: 0.3, px: 1, fontSize: '0.72rem', borderRadius: 1.5, borderColor: '#cbd5e1' }}
              >
                📸 Instagram
              </Button>
              <Button
                size="small"
                variant="outlined"
                disabled={submitting || !!activatedUrl}
                onClick={() => setDestUrl('https://www.google.com/maps')}
                sx={{ textTransform: 'none', py: 0.3, px: 1, fontSize: '0.72rem', borderRadius: 1.5, borderColor: '#cbd5e1' }}
              >
                ⭐ Google Review
              </Button>
              <Button
                size="small"
                variant="outlined"
                disabled={submitting || !!activatedUrl}
                onClick={() => setDestUrl('http://localhost:3030/business/artisan-roast/menu')}
                sx={{ textTransform: 'none', py: 0.3, px: 1, fontSize: '0.72rem', borderRadius: 1.5, borderColor: '#cbd5e1' }}
              >
                🍽️ Digital Menu
              </Button>
            </Stack>

            <TextField
              fullWidth
              size="small"
              type="password"
              label="Admin Passcode (if prompted on mobile)"
              placeholder="admin123 or demo123"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              disabled={submitting || !!activatedUrl}
              sx={{ mb: 2, backgroundColor: '#ffffff' }}
              helperText="Enter your administrator password to authorize this card activation."
            />

            <Button
              fullWidth
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              disabled={submitting || !destUrl.trim() || !!activatedUrl}
              startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <CheckCircleIcon />}
              sx={{ fontWeight: 700, py: 1.2, borderRadius: 2 }}
            >
              {submitting ? 'Activating Card...' : '⚡ Activate Dynamic QR & Open Link'}
            </Button>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        <Stack direction="row" spacing={1.5} justifyContent="center">
          <Button
            variant="outlined"
            color="inherit"
            size="small"
            component={RouterLink}
            to="/admin/dashboard"
            sx={{ textTransform: 'none', borderColor: '#cbd5e1', fontWeight: 600 }}
          >
            Admin Management Console
          </Button>
          <Button
            variant="text"
            color="inherit"
            size="small"
            component={RouterLink}
            to="/"
            sx={{ textTransform: 'none', color: 'text.secondary' }}
          >
            Platform Home
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
};
