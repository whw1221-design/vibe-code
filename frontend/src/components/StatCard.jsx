import { Avatar, Box, Paper, Stack, Typography, alpha } from '@mui/material';

export default function StatCard({ label, value, helper, icon, color = '#4f46e5' }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        height: '100%',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
      }}
    >
      <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
            {label}
          </Typography>
          <Typography variant="h4" sx={{ mt: 0.5 }} noWrap>
            {value}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {helper}
          </Typography>
        </Box>
        <Avatar
          variant="rounded"
          sx={{
            width: 46,
            height: 46,
            bgcolor: alpha(color, 0.12),
            color,
          }}
        >
          {icon}
        </Avatar>
      </Stack>
    </Paper>
  );
}
