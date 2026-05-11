type errorComponent = {
  component?: string;
  source?: string;
  lineNumber?: number;
  columnNumber?: number;
  type?: string;
};

type ErrorDetail = {
  error: Error;
  errorInfo?: React.ErrorInfo;
  context?: errorComponent;
};
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export { type ErrorDetail, type errorComponent };
