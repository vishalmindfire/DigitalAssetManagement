type errorComponent = {
  component?: string;
  source?: string;
  lineNumber?: number;
  columnNumber?: number;
  type?: string;
};

type ErrorDetail = {
  error: Error;
  errorInfo: React.ErrorInfo;
  context: errorComponent;
};
export { type ErrorDetail, type errorComponent };
