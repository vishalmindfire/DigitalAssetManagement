import type { SetStateAction } from 'react';
import logErrorToServer from '@services/errorLogger';
import { type ErrorDetail, ApiError } from '@entities/Error';
import type { Files } from '@entities/File';
import type { Dispatch } from '@reduxjs/toolkit';
import { addFile, updateFileProgress } from '@reducers/fileSlice';
const API_URL = import.meta.env.VITE_API_URL;
interface filesResponse {
  success: boolean;
  files: Files[] | [];
  nextCursor: {
    createDate: Date;
    fileId: string;
  };
}

export interface FileResponseType {
  created_at: Date;
  id: number;
  name: string;
  mime_type: string;
  size: number;
  objectKey: string;
  storage_path: string;
}
export class FileService {
  static async getFiles(
    userId: string,
    cursor: {
      fileId: string;
      createDate: Date;
    } | null,
    limit: number
  ): Promise<filesResponse> {
    const params = new URLSearchParams();
    params.append('userid', userId);
    params.append('limit', limit.toString());

    if (cursor !== null && cursor !== undefined) {
      params.append('fileid', cursor.fileId.toString());
      params.append('createdate', cursor.createDate.toString());
    }

    const response = await fetch(`${API_URL}/files?${params.toString()}`, {
      method: 'GET',
      //credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(error.message ?? 'Failed to fetch files', response.status);
    }
    const data = await response.json();
    const files = data.files.map((file: FileResponseType) => {
      return {
        id: file.id,
        name: file.name,
        size: file.size,
        uploadDate: file.created_at,
      };
    });
    return { success: true, files: files, nextCursor: data.nextCursor };
  }

  static async uploadFile(
    files: File[],
    updateProgress: React.Dispatch<SetStateAction<number>>,
    appDispatcher: Dispatch
  ): Promise<void> {
    const getUploadFiles: Files[] = await Promise.all(
      files.map(async (file: File) => {
        const response = await fetch(`${API_URL}/upload`, {
          method: 'POST',
          //credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error('Project creation Failed');
        }
        return {
          id: data.file.id,
          name: data.file.name,
          size: data.file.size,
          mimeType: data.file.mimeType,
          status: data.file.status,
          progress: data.file.progress,
          objectKey: data.file.objectKey,
          uploadDate: data.file.uploadDate,
          url: data.url,
          file: file,
        };
      })
    );

    await Promise.all(
      getUploadFiles.map(async (fileInfo: Files) => {
        const { file, ...newFile } = fileInfo;
        appDispatcher(addFile(newFile));
        const xhr = new XMLHttpRequest();
        const id = fileInfo.id;
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            const status = newFile.status;
            appDispatcher(updateFileProgress({ id, progress, status }));
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status === 200 || xhr.status === 201) {
            const progress = 100;
            const status = 'COMPLETED';
            appDispatcher(updateFileProgress({ id, progress, status }));
          } else {
            const progress = 0;
            const status = 'FAILED';
            appDispatcher(updateFileProgress({ id, progress, status }));
          }
        });

        xhr.addEventListener('error', () => {
          const progress = 0;
          const status = 'FAILED';
          appDispatcher(updateFileProgress({ id, progress, status }));
        });

        xhr.open('PUT', fileInfo.url);
        xhr.setRequestHeader('Content-Type', fileInfo.mimeType);
        xhr.send(file);
        return xhr;
      })
    );
  }

  static logError(error: unknown, stack: string): void {
    const errorDetail: ErrorDetail = {
      error: error instanceof Error ? error : new Error(String(error)),
      errorInfo: {
        componentStack: stack,
      },
      context: {
        component: 'FileService',
      },
    };
    logErrorToServer(errorDetail, null);
  }
}
