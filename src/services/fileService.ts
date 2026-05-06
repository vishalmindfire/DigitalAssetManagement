import type { SetStateAction } from 'react';
import logErrorToServer from '@services/errorLogger';
import type { ErrorDetail } from '@entities/Error';
import type { FileInfo } from '@entities/File';
import type { Project } from '@entities/Project';
import type { ProjectsAction } from '@reducers/projectReducer';

const API_URL = import.meta.env.VITE_API_URL;
const apiEnabled = import.meta.env.VITE_API_ENABLED;

interface filesResponse {
  success: boolean;
  files: FileInfo[] | [];
}

interface uploadResponse {
  success: boolean;
}

export interface FileResponseType {
  created_at: Date;
  id: number;
  mime_type: string;
  name: string;
  project_id: number;
  size: number;
  storage_path: string;
}
export const getFiles = async (
  id: Project['id'],
  dispatch: React.Dispatch<ProjectsAction>
): Promise<filesResponse> => {
  try {
    let files: FileInfo[] | [] = [];
    if (apiEnabled) {
      const response = await fetch(`${API_URL}/projects/${id}/files`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error('Project creation Failed');
      }
      files = data.files.map((projectFile: FileResponseType) => {
        return {
          id: projectFile.id,
          name: projectFile.name,
          size: projectFile.size,
          uploadDate: projectFile.created_at,
        };
      });
    }
    const payload = {
      projectId: id,
      files: files,
    };
    dispatch({ type: 'ADD_FILE', payload: payload });
    return { success: true, files: files };
  } catch (error) {
    logError(error, 'Get Files Call');
    throw error;
  }
};

export const deleteFile = async (
  id: Project['id'],
  fileId: FileInfo['id'],
  dispatch: React.Dispatch<ProjectsAction>
): Promise<boolean> => {
  try {
    if (apiEnabled) {
      const response = await fetch(`${API_URL}/projects/${id}/files/${fileId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (response.status === 401 || response.status === 403) {
        throw new Error('Project deletion failed');
      }
    }
    dispatch({ type: 'REMOVE_FILE', payload: { projectId: id, fileId: fileId } });
    return true;
  } catch (error) {
    logError(error, 'Remove Project Call');
    throw error;
  }
};

export const uploadFile = async (
  files: File[],
  updateProgress: React.Dispatch<SetStateAction<number>>,
  id: Project['id'],
  dispatch: React.Dispatch<ProjectsAction>
): Promise<uploadResponse> => {
  return new Promise((resolve, reject) => {
    if (apiEnabled) {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append('files', file); // Use the same field name for all files
      });
      const xhr = new XMLHttpRequest();
      xhr.withCredentials = true;
      xhr.responseType = 'json';
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          updateProgress(Math.round(percentComplete));
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 201) {
          const newFiles: FileInfo[] = xhr.response.files.map((newFile: FileResponseType) => {
            return {
              id: newFile.id,
              name: newFile.name,
              uploadDate: newFile.created_at,
              size: newFile.size,
            };
          });
          const payload = {
            projectId: id,
            files: newFiles,
          };
          dispatch({ type: 'ADD_FILE', payload: payload });
          resolve({ success: true });
        } else {
          resolve({ success: false });
        }
      });

      xhr.addEventListener('error', (error) => {
        logError(error, 'Upload File Call');
        reject(error);
      });

      xhr.open('POST', `${API_URL}/projects/${id}/files`);
      xhr.send(formData);
    } else {
      const newFiles: FileInfo[] = [];
      files.forEach((file) => {
        newFiles.push({
          id: Number((Math.random() * 1000000).toFixed(0)),
          name: file.name,
          size: file.size,
          uploadDate: new Date(),
        });
      });

      const payload = {
        projectId: id,
        files: newFiles,
      };
      let counter = 0;
      const target = 100;
      const step = 1;
      const intervalId = setInterval(() => {
        counter += step;
        updateProgress(counter);
        if (counter >= target) {
          dispatch({ type: 'ADD_FILE', payload: payload });
          clearInterval(intervalId);
        }
      }, 50);

      resolve({ success: true });
    }
  });
};

function logError(error: unknown, stack: string): void {
  const errorDetail: ErrorDetail = {
    error: error instanceof Error ? error : new Error(String(error)),
    errorInfo: {
      componentStack: stack,
    },
    context: {
      component: 'projectService',
    },
  };
  logErrorToServer(errorDetail, null);
}
