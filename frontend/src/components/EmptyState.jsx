import { Avatar, Stack, Typography } from '@mui/material';

export default function EmptyState({ icon, title, description, action }) {
  return (
    <Stack spacing={1.5} sx={{ alignItems: 'center', py: 7, px: 2, textAlign: 'center' }}>
      {icon && (
        <Avatar
          sx={{
            width: 58,
            height: 58,
            bgcolor: 'action.hover',
            color: 'primary.main',
            mb: 0.5,
          }}
        >
          {icon}
        </Avatar>
      )}
      <Typography variant="h6">{title}</Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420 }}>
          {description}
        </Typography>
      )}
      {action && <Stack sx={{ pt: 1 }}>{action}</Stack>}
    </Stack>
  );
}
