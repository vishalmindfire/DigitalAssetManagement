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
  mimeType: string;
  size: number;
  objectKey: string;
  status: string;
  createdDate: string;
  uploadDate: string;
  userId: string;
}
export class FileService {
  static async getFiles(
    userId: string,
    cursor: {
      fileId: string;
      createDate: Date;
    } | null,
    limit: number,
    search: string | null
  ): Promise<filesResponse> {
    const params = new URLSearchParams();
    params.append('userid', userId);
    params.append('limit', String(limit));

    if (cursor !== null && cursor !== undefined) {
      params.append('fileid', cursor.fileId);
      params.append('createdate', String(cursor.createDate));
    }

    if (search) {
      params.append('search', search);
    }

    const response = await fetch(`${API_URL}/files?${params.toString()}`, {
      method: 'GET',
      credentials: 'include',
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
        status: file.status,
        userId: file.userId,
        uploadDate: file.createdDate,
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
        const fileData = {
          name: file.name,
          size: file.size,
          mimeType: file.type,
        };
        const response = await fetch(`${API_URL}/upload`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(fileData),
        });
        if (!response.ok) {
          const errData = await response.json();
          throw new ApiError(errData.message ?? 'Failed to upload file', response.status);
        }
        const data = await response.json();
        return {
          id: data.id,
          name: data.name,
          size: data.size,
          mimeType: data.mimeType,
          status: data.status,
          progress: data.progress,
          objectKey: data.objectKey,
          uploadDate: data.createDate,
          url: data.url,
          userId: data.userId,
          file: file,
        };
      })
    );

    const bytesMap = getUploadFiles.map((f) => ({ loaded: 0, total: f.file?.size ?? 0 }));

    await Promise.all(
      getUploadFiles.map((fileInfo: Files, index: number) => {
        return new Promise<void>((resolve) => {
          const { file, ...newFile } = fileInfo;
          appDispatcher(addFile(newFile));
          const xhr = new XMLHttpRequest();
          const id = fileInfo.id;
          FileService.updateFileSatus(id, 'PROCESSING');

          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              bytesMap[index] = { loaded: e.loaded, total: e.total };
              const totalLoaded = bytesMap.reduce((sum, b) => sum + b.loaded, 0);
              const totalSize = bytesMap.reduce((sum, b) => sum + b.total, 0);
              const overallProgress =
                totalSize > 0 ? Math.round((totalLoaded / totalSize) * 100) : 0;

              const progress = Math.round((e.loaded / e.total) * 100);
              const status = newFile.status;
              appDispatcher(updateFileProgress({ id, progress, status }));
              updateProgress(overallProgress);
            }
          });

          xhr.addEventListener('load', () => {
            if (xhr.status === 200 || xhr.status === 201) {
              bytesMap[index] = { loaded: bytesMap[index].total, total: bytesMap[index].total };
              const totalLoaded = bytesMap.reduce((sum, b) => sum + b.loaded, 0);
              const totalSize = bytesMap.reduce((sum, b) => sum + b.total, 0);
              updateProgress(totalSize > 0 ? Math.round((totalLoaded / totalSize) * 100) : 0);
              appDispatcher(updateFileProgress({ id, progress: 100, status: 'COMPLETED' }));
              FileService.updateFileSatus(id, 'COMPLETED');
            } else {
              appDispatcher(updateFileProgress({ id, progress: 0, status: 'FAILED' }));
              FileService.updateFileSatus(id, 'FAILED');
            }
            resolve();
          });

          xhr.addEventListener('error', () => {
            appDispatcher(updateFileProgress({ id, progress: 0, status: 'FAILED' }));
            FileService.updateFileSatus(id, 'FAILED');
            resolve();
          });

          xhr.open('PUT', fileInfo.url);
          xhr.setRequestHeader('Content-Type', fileInfo.mimeType);
          xhr.send(file);
        });
      })
    );
  }

  static async updateFileSatus(id: string, status: Files['status']): Promise<Files> {
    const response = await fetch(`${API_URL}/files/${id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) {
      const errData = await response.json();
      throw new ApiError(errData.message ?? 'Failed to update file', response.status);
    }
    const data = await response.json();
    return data.file;
  }

  static async filterFilesByTag(tag: string): Promise<Files> {
    const response = await fetch(`${API_URL}/files/tag/${tag}`, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      const errData = await response.json();
      throw new ApiError(errData.message ?? 'Failed to update file', response.status);
    }
    const data = await response.json();
    return data.file;
  }

  static async filterFilesByID(id: string): Promise<Files> {
    const response = await fetch(`${API_URL}/files/${id}`, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      const errData = await response.json();
      throw new ApiError(errData.message ?? 'Failed to update file', response.status);
    }
    const data = await response.json();
    return data.file;
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
