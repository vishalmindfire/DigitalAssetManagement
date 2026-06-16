import { useCallback, useState, useMemo} from 'react';
import { List, type RowComponentProps, useDynamicRowHeight } from 'react-window';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@components/ui/table';
import { type Files } from '@entities/File';
import Badge from '@components/ui/badge/Badge';
import { useFiles } from '@hooks/useFiles';
import { useAuth } from '@hooks/useAuth';
import Popup from '@components/ui/modal/Popup';
import {FileService} from '@services/fileService';
import AspectRatioVideo from '@components/ui/videos/AspectRatioVideo';
import ResponsiveImage from '@components/ui/images/ResponsiveImage';
import { updateFile } from '@reducers/fileSlice';
import { useAppDispatch } from '@store/store';
type FilesProp = {
  section: string;
};
type RowData = {
  files: Files[];
};

const COLS = [
  { label: 'Name', width: 'flex-[3]' },
  { label: 'Size', width: 'flex-[1]' },
  { label: 'Upload Date', width: 'flex-[2]' },
  { label: 'Status', width: 'flex-[1]' },
] as const;

const HEADER_CELL =
  'px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400';
const BODY_CELL =
  'px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400 flex items-center';

export default function FileTable({ section }: FilesProp) {
  const dispatch = useAppDispatch();
  const [fileError, setFileError] = useState<string | null>(null);
  const { files, loading, hasMore, loadMore } = useFiles();
  const { user } = useAuth();
  const savedFiles = useMemo(() => ({
    files: section === 'admin' ? [...files] : files.filter((file) => file.userId === user?.id),
  }), [files, user?.id, section]);

  const itemCount = hasMore ? savedFiles.files.length + 1 : savedFiles.files.length;

  const getRowHeight = useDynamicRowHeight({
    defaultRowHeight: 45
  })

  const handleRowsRendered = useCallback(
    ({ stopIndex }: { startIndex: number; stopIndex: number }) => {
      if (!hasMore || loading) return;
      if (stopIndex >= itemCount - 1) {
        try {
          loadMore();
        } catch (error) {
          setFileError(error instanceof Error ? error.message : 'Unexpected Error');
        }
      }
    },
    [itemCount, hasMore, loading, loadMore]
  );

  const handleRowClick = async (id: string) => {
    const file = await FileService.filterFilesByID(id);
    dispatch(updateFile(file));
  };
 
  const rowComponent = useCallback(({ index, style, files }: RowComponentProps<RowData>) => {
    const file = files[index];

    if(files.length === 0){
      return (
        <div style={style} className="flex items-center px-4 border-b text-gray-400 text-theme-sm">
          No files added.
        </div>
      )
    }

    if (!file) {
      return (
        <div style={style} className="flex items-center px-4 border-b text-gray-400 text-theme-sm ">
          Loading more...
        </div>
      );
    }
   
    return (
      <div style={style}>
        <TableRow key={file.id} className="border-b border-gray-100 dark:border-white/[0.05] hover:bg-gray-700" onClick={() => {handleRowClick(file.id)}}>
          <TableCell className={`${COLS[0].width} ${BODY_CELL} px-5 sm:px-6 min-w-0`}>
            <span className="break-all">{file.name}</span>
          </TableCell>
          <TableCell className={`${COLS[1].width} ${BODY_CELL}`}>{file.size}</TableCell>
          <TableCell className={`${COLS[2].width} ${BODY_CELL}`}>
            {new Date(file.uploadDate).toLocaleDateString('en-US', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })}
          </TableCell>
          <TableCell className={`${COLS[3].width} ${BODY_CELL}`}>
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
        <AspectRatioVideo videoUrl={file.url}/> 
        <ResponsiveImage imageUrl={file.url} altText={file.name}/>
      </div>
    );
  }, []);
  return (
    <>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                {COLS.map((col) => (
                  <TableCell key={col.label} isHeader className={`${col.width} ${HEADER_CELL}`}>
                    {col.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <List 
                rowCount={itemCount}
                rowHeight={getRowHeight}
                rowComponent={rowComponent}
                rowProps={savedFiles}
                style={{ height: 500, width: '100%' }}
                onRowsRendered={handleRowsRendered}
              />
            </TableBody>
          </Table>
        </div>
      </div>
      <Popup
        open={fileError !== null}
        onClose={() => {
          setFileError(null);
        }}
        title="Error"
        message={fileError ?? ''}
      />
    </>
  )
}