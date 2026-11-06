import { Box, Button, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';

export default function NotFoundPage() {
  return (
    <Stack spacing={2} sx={{ alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' }}>
      <Box
        sx={{
          width: 64,
          height: 64,
          borderRadius: 3,
          display: 'grid',
          placeItems: 'center',
          bgcolor: 'action.hover',
          color: 'primary.main',
        }}
      >
        <StorefrontRoundedIcon fontSize="large" />
      </Box>
      <Typography variant="h1" sx={{ fontSize: { xs: 56, sm: 72 }, lineHeight: 1 }}>
        404
      </Typography>
      <Typography variant="h5">Page not found</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 360 }}>
        The page you are looking for does not exist. Head back to the dashboard to keep working.
      </Typography>
      <Button component={RouterLink} to="/" variant="contained" sx={{ mt: 1 }}>
        Back to dashboard
      </Button>
    </Stack>
  );
}
