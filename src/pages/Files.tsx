//import {useEffect } from 'react';
import DropzoneComponent from '@components/form/form-elements/DropZone';
import PageMeta from '@components/common/PageMeta';
import FileTable from '@components/tables/FilesTable';
//import type { LuImport } from 'react-icons/lu';

export default function Files() {
  return (
    <div>
      <PageMeta
        title="React.js Form Elements Dashboard | TailAdmin - React.js Admin Dashboard Template"
        description="This is React.js Form Elements  Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="space-y-4">
          <DropzoneComponent />
        </div>
        <div className="space-y-8">{<FileTable section="user" />}</div>
      </div>
    </div>
  );
}
