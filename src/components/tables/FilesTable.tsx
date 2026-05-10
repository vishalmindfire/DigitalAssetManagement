import { useMemo, useCallback } from 'react';
import { List, type RowComponentProps } from 'react-window';
import { Table, TableCell, TableHeader, TableRow } from '@components/ui/table';
import { type Files } from '@entities/File';
import Badge from '@components/ui/badge/Badge';
import { useFiles } from '@hooks/useFiles';

type RowData = {
  files: Files[];
};

const ROW_HEIGHT = 60;

export default function FileTable() {
  const { files, loading, hasMore, loadMore } = useFiles();

  const savedFiles = useMemo(() => files, [files]);

  const itemCount = hasMore ? savedFiles.length + 1 : savedFiles.length;

  const handleRowsRendered = useCallback(
    ({ stopIndex }: { startIndex: number; stopIndex: number }) => {
      const threshold = Math.max(0, savedFiles.length - 20);

      if (stopIndex >= threshold && hasMore && !loading) {
        loadMore();
      }
    },
    [savedFiles.length, hasMore, loading, loadMore]
  );

  const rowComponent = useCallback(({ index, style, files }: RowComponentProps<RowData>) => {
    const file = files[index];

    if (!file) {
      return (
        <div style={style} className="flex items-center px-4 border-b">
          Loading more...
        </div>
      );
    }

    return (
      <TableRow key={file.id}>
        <TableCell className="px-5 py-4 sm:px-6 text-start">{file.name}</TableCell>
        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
          {file.size}
        </TableCell>
        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
          {new Date(file.uploadDate).toLocaleDateString('en-US', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })}
        </TableCell>
        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
          <Badge
            size="sm"
            color={
              file.status === 'COMPLETED'
                ? 'success'
                : file.status === 'PENDING' || file.status === 'PROCESSING'
                  ? 'warning'
                  : 'error'
            }
          >
            {file.status}
          </Badge>
        </TableCell>
      </TableRow>
    );
  }, []);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <Table>
          {/* Table Header */}
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Name
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Size
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Upload Date
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Status
              </TableCell>
            </TableRow>
          </TableHeader>
        </Table>

        <List
          rowCount={itemCount}
          rowHeight={ROW_HEIGHT}
          rowComponent={rowComponent}
          rowProps={{
            files,
          }}
          style={{
            height: 600,
            width: '100%',
          }}
          onRowsRendered={handleRowsRendered}
        />
      </div>
    </div>
  );
}
