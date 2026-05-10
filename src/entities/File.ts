interface Files {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  progress: number;
  url: string;
  objectKey?: string;
  uploadDate: Date;
  error?: string;
  userId?: string;
  file?: File;
}

export { type Files };
