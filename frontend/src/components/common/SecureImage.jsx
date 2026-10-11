import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { FileSignature, AlertCircle } from 'lucide-react';

/**
 * SecureImage loads authenticated static assets (such as user and director signatures)
 * by requesting the image through our Axios instance with the Authorization Bearer header,
 * converting the response to an in-memory object URL.
 */
export default function SecureImage({
  src,
  alt = 'Signature Image',
  className = '',
  fallbackLabel = 'Digital Signature',
}) {
  const [blobUrl, setBlobUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    if (!src) {
      setBlobUrl(null);
      setIsLoading(false);
      setHasError(false);
      return;
    }

    // Direct object URL or base64 data URI
    if (src.startsWith('blob:') || src.startsWith('data:')) {
      setBlobUrl(src);
      setIsLoading(false);
      setHasError(false);
      return;
    }

    setIsLoading(true);
    setHasError(false);

    // Extract filename from stored path (e.g., "/uploads/signatures/xyz.png" or "/api/users/signature/file/xyz.png")
    const filename = src.split('/').filter(Boolean).pop();
    const endpoint = `/users/signature/file/${filename}`;

    api
      .get(endpoint, { responseType: 'blob' })
      .then((response) => {
        if (!isCancelled) {
          const url = URL.createObjectURL(response.data);
          setBlobUrl(url);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.warn('Failed to load secure image:', err.message);
        if (!isCancelled) {
          setHasError(true);
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
      if (blobUrl && blobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [src]);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center bg-slate-50 animate-pulse ${className}`}>
        <div className="w-5 h-5 border-2 border-slate-300 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (hasError || !blobUrl) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-slate-50 border border-dashed border-slate-300 text-slate-400 p-2 text-center select-none ${className}`}
      >
        <FileSignature className="w-6 h-6 mb-1 text-slate-400" />
        <span className="text-[11px] font-medium text-slate-500 leading-tight">
          {fallbackLabel}
        </span>
      </div>
    );
  }

  return (
    <img
      src={blobUrl}
      alt={alt}
      className={`object-contain select-none ${className}`}
      loading="lazy"
    />
  );
}
