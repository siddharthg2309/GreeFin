'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { FileUpload } from '@/components/ui/FileUpload';
import { Input } from '@/components/ui/Input';

interface EsgUploadProps {
  fundId: string;
  onComplete?: () => void;
}

type UploadResponse = { success: true } | { success: false; error: string };

export function EsgUpload({ fundId, onComplete }: EsgUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [reportYear, setReportYear] = useState(new Date().getFullYear().toString());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('fundId', fundId);
      formData.append('file', file);
      formData.append('reportYear', reportYear);

      const response = await fetch('/api/esg-reports', {
        method: 'POST',
        body: formData,
      });

      const data = (await response.json()) as UploadResponse;
      if (!response.ok || !data.success) {
        throw new Error(!data.success ? data.error : 'Failed to upload ESG report');
      }

      setSuccess(true);
      onComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-[#22C55E]/10 border border-[#22C55E]/20 rounded-lg p-4">
        <p className="text-[#22C55E] text-sm">ESG report uploaded successfully!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          <p className="text-red-500 text-sm">{error}</p>
        </div>
      )}

      <FileUpload label="ESG Report PDF" accept=".pdf" onChange={setFile} />

      <Input
        label="Report Year"
        type="number"
        min="2000"
        max="2030"
        value={reportYear}
        onChange={(e) => setReportYear(e.target.value)}
      />

      <Button onClick={handleUpload} disabled={!file || loading} className="w-full">
        {loading ? 'Uploading...' : 'Upload ESG Report'}
      </Button>
    </div>
  );
}

