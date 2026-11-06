import { Skeleton, TableCell, TableRow } from '@mui/material';

export default function TableLoadingRows({ rows = 5, columns = 5 }) {
  return Array.from({ length: rows }).map((_, rowIndex) => (
    <TableRow key={rowIndex}>
      {Array.from({ length: columns }).map((__, columnIndex) => (
        <TableCell key={columnIndex}>
          <Skeleton
            variant="text"
            width={columnIndex === 0 ? '80%' : columnIndex === columns - 1 ? 72 : '55%'}
          />
        </TableCell>
      ))}
    </TableRow>
  ));
}
