import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Box, Stack, Divider, IconButton,
  CircularProgress, Tooltip, ToggleButton, ToggleButtonGroup, Chip,
  TextField, Alert
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import LanguageIcon from '@mui/icons-material/Language';
import LaptopIcon from '@mui/icons-material/Laptop';
import LinkIcon from '@mui/icons-material/Link';
import { cardService } from '../services/api';

export const QRPreviewModal = ({ open, onClose, card, onSuccess }) => {
  const [copied, setCopied] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Normal test domain: defaults to current browser origin (e.g. http://localhost:3030)
  const currentOrigin = (typeof window !== 'undefined' && window.location?.origin)
    ? window.location.origin
    : 'http://localhost:3030';

  // Domain modes: 'local' (normal default for test), 'custom'
  const [domainMode, setDomainMode] = useState('local');
  const [customDomainInput, setCustomDomainInput] = useState('');

  // Destination configuration state
  const [localCard, setLocalCard] = useState(card);
  const [destInput, setDestInput] = useState('');
  const [savingDest, setSavingDest] = useState(false);
  const [destSuccess, setDestSuccess] = useState('');
  const [destError, setDestError] = useState('');

  useEffect(() => {
    setLocalCard(card);
    setDestInput(card?.destination_url || '');
    setDestSuccess('');
    setDestError('');
    setImgLoaded(false);
    setImgError(false);
  }, [card]);

  useEffect(() => {
    setImgLoaded(false);
    setImgError(false);
  }, [domainMode, customDomainInput]);

  if (!card) return null;

  const activeCard = localCard || card;
  const targetId = activeCard.id || activeCard.card_id;

  // Compute active base domain (normal default is currentOrigin)
  let activeDomain = currentOrigin;
  if (domainMode === 'custom' && customDomainInput.trim()) {
    activeDomain = customDomainInput.trim().replace(/\/+$/, '');
  }

  // The permanent dynamic redirect scan URL embedded in physical QR
  const currentPermanentUrl = `${activeDomain}/q/${activeCard.card_id}`;

  const qrPngUrl = cardService.downloadQrUrl(targetId, 'png', activeDomain);
  const qrSvgUrl = cardService.downloadQrUrl(targetId, 'svg', activeDomain);

  const copyUrl = () => {
    navigator.clipboard.writeText(currentPermanentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleModeChange = (event, newMode) => {
    if (newMode !== null) {
      setDomainMode(newMode);
    }
  };

  const handleSaveDestination = async (urlOverride) => {
    const finalUrl = (urlOverride || destInput).trim();
    if (!finalUrl) {
      setDestError('Please provide a destination URL (e.g. https://www.youtube.com).');
      return;
    }

    try {
      setSavingDest(true);
      setDestError('');
      setDestSuccess('');

      const res = await cardService.activate(targetId, {
        destination_url: finalUrl,
        purpose: 'Dynamic Destination'
      });

      const updated = res.data.card || res.data;
      setLocalCard(updated);
      setDestSuccess(`Destination saved! Customers scanning this QR will now instantly open ${finalUrl}`);
      onSuccess?.();
    } catch (err) {
      console.error("Save destination error:", err);
      setDestError(err.response?.data?.error || 'Failed to save destination link.');
    } finally {
      setSavingDest(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <QrCode2Icon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Card QR: {activeCard.card_id}</Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ py: 2.5 }}>

        {/* 1. Dynamic Destination Editor */}
        <Box sx={{ mb: 2.5, p: 2, bgcolor: '#f8fafc', borderRadius: 2.5, border: '1px solid #e2e8f0' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 0.8 }}>
              <LinkIcon fontSize="small" color="primary" /> Dynamic Destination Link
            </Typography>
            <Chip
              label={activeCard.status === 'ACTIVE' ? "LIVE ACTIVE" : "NOT ACTIVATED"}
              size="small"
              color={activeCard.status === 'ACTIVE' ? "success" : "warning"}
              sx={{ fontWeight: 700, fontSize: '0.68rem', height: 20 }}
            />
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
            {activeCard.status === 'ACTIVE'
              ? "Change the destination anytime. Customers scanning the permanent printed QR code will instantly open this URL."
              : "This QR is ready to print. Enter the destination URL below to activate dynamic redirection:"}
          </Typography>

          {destSuccess && (
            <Alert severity="success" sx={{ mb: 1.5, py: 0.5, fontSize: '0.8rem', borderRadius: 1.5 }}>
              {destSuccess}
            </Alert>
          )}
          {destError && (
            <Alert severity="error" sx={{ mb: 1.5, py: 0.5, fontSize: '0.8rem', borderRadius: 1.5 }}>
              {destError}
            </Alert>
          )}

          <TextField
            fullWidth
            size="small"
            placeholder="e.g. https://www.youtube.com"
            value={destInput}
            onChange={(e) => setDestInput(e.target.value)}
            disabled={savingDest}
            sx={{ mb: 1, backgroundColor: '#ffffff' }}
          />

          {/* Quick presets */}
          <Stack direction="row" spacing={0.8} sx={{ mb: 1.5, flexWrap: 'wrap', gap: 0.5 }}>
            <Button
              size="small"
              variant="outlined"
              onClick={() => { setDestInput('https://www.youtube.com'); }}
              sx={{ textTransform: 'none', py: 0.2, px: 1, fontSize: '0.72rem', borderRadius: 1.5, borderColor: '#cbd5e1' }}
            >
              🎬 YouTube
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => { setDestInput('https://instagram.com'); }}
              sx={{ textTransform: 'none', py: 0.2, px: 1, fontSize: '0.72rem', borderRadius: 1.5, borderColor: '#cbd5e1' }}
            >
              📸 Instagram
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => { setDestInput('https://www.google.com/maps'); }}
              sx={{ textTransform: 'none', py: 0.2, px: 1, fontSize: '0.72rem', borderRadius: 1.5, borderColor: '#cbd5e1' }}
            >
              ⭐ Google Review
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => { setDestInput(`${currentOrigin}/business/artisan-roast/menu`); }}
              sx={{ textTransform: 'none', py: 0.2, px: 1, fontSize: '0.72rem', borderRadius: 1.5, borderColor: '#cbd5e1' }}
            >
              🍽️ Digital Menu
            </Button>
          </Stack>

          <Button
            fullWidth
            variant="contained"
            color="primary"
            size="small"
            disabled={savingDest || !destInput.trim()}
            onClick={() => handleSaveDestination()}
            startIcon={savingDest ? <CircularProgress size={16} color="inherit" /> : <CheckIcon />}
            sx={{ fontWeight: 700, py: 0.9, borderRadius: 2 }}
          >
            {savingDest ? 'Saving...' : activeCard.status === 'ACTIVE' ? 'Update Destination Link' : '⚡ Activate & Save Dynamic Link'}
          </Button>
        </Box>

        {/* 2. QR Code Preview & Domain Selector */}
        <Box sx={{ mb: 2 }}>
          <ToggleButtonGroup
            value={domainMode}
            exclusive
            onChange={handleModeChange}
            size="small"
            fullWidth
            sx={{ mb: 1 }}
          >
            <ToggleButton value="local" sx={{ textTransform: 'none', py: 0.6, fontSize: '0.8rem', fontWeight: 700 }}>
              <LaptopIcon fontSize="small" sx={{ mr: 0.7 }} /> Normal / Localhost ({currentOrigin.replace(/^https?:\/\//, '')})
            </ToggleButton>
            <ToggleButton value="custom" sx={{ textTransform: 'none', py: 0.6, fontSize: '0.8rem' }}>
              <LanguageIcon fontSize="small" sx={{ mr: 0.7 }} /> Custom Domain
            </ToggleButton>
          </ToggleButtonGroup>

          {domainMode === 'custom' && (
            <TextField
              size="small"
              fullWidth
              placeholder="e.g. https://mybrandqr.com"
              value={customDomainInput}
              onChange={(e) => setCustomDomainInput(e.target.value)}
              helperText="Enter your brand or custom live domain for production printing"
              sx={{ mt: 1, mb: 1 }}
            />
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mt: 0.5 }}>
            <Chip
              label={domainMode === 'local' ? "Direct Testing Mode (Localhost)" : "Custom Brand Domain"}
              size="small"
              color={domainMode === 'local' ? "primary" : "secondary"}
              sx={{ height: 22, fontSize: '0.72rem', fontWeight: 600 }}
            />
          </Box>
        </Box>

        {/* QR Code Graphic Container */}
        <Box
          sx={{
            p: 2,
            border: '2px dashed #cbd5e1',
            borderRadius: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#ffffff',
            mb: 2,
            minHeight: 220,
            position: 'relative',
          }}
        >
          {!imgLoaded && !imgError && (
            <Box sx={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={32} />
              <Typography variant="caption" color="text.secondary">Generating print-ready QR...</Typography>
            </Box>
          )}

          {imgError ? (
            <Typography variant="body2" color="error">
              Unable to load QR image.
            </Typography>
          ) : (
            <img
              key={qrPngUrl}
              src={qrPngUrl}
              alt={`QR code for ${activeCard.card_id}`}
              onLoad={() => setImgLoaded(true)}
              onError={() => { setImgError(true); setImgLoaded(true); }}
              style={{
                width: 200,
                height: 200,
                display: imgLoaded ? 'block' : 'none',
                borderRadius: 8,
              }}
            />
          )}
        </Box>

        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5 }}>
          Redirect Scan URL (Printed on Card)
        </Typography>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#f1f5f9',
            px: 1.5,
            py: 1,
            borderRadius: 2,
            wordBreak: 'break-all',
            fontSize: '0.8125rem',
            fontFamily: 'monospace',
            color: '#0f172a',
            border: '1px solid #e2e8f0',
            mb: 1.5,
          }}
        >
          <span style={{ fontWeight: 600 }}>{currentPermanentUrl}</span>
          <Tooltip title={copied ? "Copied!" : "Copy permanent URL"}>
            <IconButton size="small" onClick={copyUrl} color={copied ? "success" : "default"}>
              {copied ? <CheckIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Box>

        {/* Test Scan / Redirection Button */}
        <Button
          variant="outlined"
          color="primary"
          fullWidth
          size="small"
          endIcon={<OpenInNewIcon fontSize="small" />}
          href={currentPermanentUrl}
          target="_blank"
          rel="noopener noreferrer"
          sx={{ textTransform: 'none', fontWeight: 600 }}
        >
          Test Scan Redirection (Open Link)
        </Button>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
        <Button
          variant="outlined"
          size="small"
          startIcon={<DownloadIcon />}
          href={`${qrSvgUrl}&download=1`}
          download={`qr_${activeCard.card_id}.svg`}
        >
          Download SVG
        </Button>
        <Button
          variant="contained"
          size="small"
          startIcon={<DownloadIcon />}
          href={`${qrPngUrl}&download=1`}
          download={`qr_${activeCard.card_id}.png`}
        >
          Download PNG
        </Button>
      </DialogActions>
    </Dialog>
  );
};
