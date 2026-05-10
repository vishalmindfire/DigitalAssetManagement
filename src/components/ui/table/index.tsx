import { type ReactNode } from 'react';

interface TableProps {
  children: ReactNode;
  className?: string;
}

interface TableHeaderProps {
  children: ReactNode;
  className?: string;
}

interface TableBodyProps {
  children: ReactNode;
  className?: string;
}

interface TableRowProps {
  children: ReactNode;
  className?: string;
}

interface TableCellProps {
  children: ReactNode;
  isHeader?: boolean;
  className?: string;
}

const Table: React.FC<TableProps> = ({ children, className }) => {
  return (
    <div role="table" className={`min-w-full ${className}`}>
      {children}
    </div>
  );
};

const TableHeader: React.FC<TableHeaderProps> = ({ children, className }) => {
  return (
    <div role="rowgroup" className={className}>
      {children}
    </div>
  );
};

const TableBody: React.FC<TableBodyProps> = ({ children, className }) => {
  return (
    <div role="rowgroup" className={className}>
      {children}
    </div>
  );
};

const TableRow: React.FC<TableRowProps> = ({ children, className }) => {
  return (
    <div role="row" className={`flex ${className ?? ''}`}>
      {children}
    </div>
  );
};

const TableCell: React.FC<TableCellProps> = ({ children, isHeader = false, className }) => {
  return (
    <div role={isHeader ? 'columnheader' : 'cell'} className={className}>
      {children}
    </div>
  );
};

export { Table, TableHeader, TableBody, TableRow, TableCell };
