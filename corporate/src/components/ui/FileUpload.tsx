'use client';

import { useRef, useState } from 'react';
import { FileText, Upload, X } from 'lucide-react';

import { cn } from '@/lib/utils';

interface FileUploadProps {
  label?: string;
  accept?: string;
  onChange?: (file: File | null) => void;
  error?: string;
}

export function FileUpload({
  label,
  accept = '.pdf',
  onChange,
  error,
}: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    setFile(selected);
    onChange?.(selected);
  };

  const handleRemove = () => {
    setFile(null);
    onChange?.(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm text-[#8E8E93]">{label}</label>}

      {!file ? (
        <label
          className={cn(
            'flex flex-col items-center justify-center gap-2',
            'border-2 border-dashed rounded-lg p-6 cursor-pointer',
            'transition-colors hover:border-[#8E8E93]',
            error ? 'border-red-500' : 'border-[#2C2C2E]'
          )}
        >
          <Upload className="w-8 h-8 text-[#8E8E93]" />
          <span className="text-sm text-[#8E8E93]">
            Click to upload {accept === '.pdf' ? 'PDF' : 'file'}
          </span>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={handleChange}
            className="hidden"
          />
        </label>
      ) : (
        <div className="flex items-center justify-between bg-[#121212] border border-[#2C2C2E] rounded-lg p-3">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-sm text-white truncate max-w-[200px]">{file.name}</p>
              <p className="text-xs text-[#8E8E93]">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="p-1 hover:bg-[#2C2C2E] rounded"
          >
            <X className="w-4 h-4 text-[#8E8E93]" />
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

