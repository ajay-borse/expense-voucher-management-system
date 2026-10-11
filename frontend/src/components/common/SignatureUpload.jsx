import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, X, FileImage, AlertCircle, CheckCircle2 } from 'lucide-react';
import Button from './Button';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB
const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];
const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg'];

export default function SignatureUpload({
  onFileSelect,
  onFileRemove,
  existingSignatureUrl,
  disabled = false,
  isUploading = false,
  label = 'Digital Signature Upload',
  required = false,
  className = '',
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [validationError, setValidationError] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Revoke object URL on unmount or when preview changes to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const validateAndProcessFile = (file) => {
    setValidationError(null);

    if (!file) return;

    // Validate MIME type and file extension
    const extension = '.' + file.name.split('.').pop().toLowerCase();
    const isValidType =
      ALLOWED_MIME_TYPES.includes(file.type.toLowerCase()) ||
      ALLOWED_EXTENSIONS.includes(extension);

    if (!isValidType) {
      setValidationError('Invalid file format. Only PNG, JPG, and JPEG files are permitted.');
      return;
    }

    // Validate size limit (2 MB)
    if (file.size > MAX_FILE_SIZE) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      setValidationError(`File size (${fileSizeMB} MB) exceeds the maximum allowed limit of 2 MB.`);
      return;
    }

    // Revoke previous object URL if any
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    const objectUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(objectUrl);

    // Notify parent component
    onFileSelect?.(file);
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndProcessFile(file);
    }
    // Reset file input value so re-selecting same file triggers onChange
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled && !isUploading) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);

    if (disabled || isUploading) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndProcessFile(file);
    }
  };

  const handleRemove = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setValidationError(null);
    onFileRemove?.();
  };

  const triggerBrowse = () => {
    if (!disabled && !isUploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Determine active preview: newly selected blob or existing saved URL
  const activeDisplayUrl = previewUrl || existingSignatureUrl;

  return (
    <div className={`w-full space-y-2 ${className}`}>
      {/* Field Label */}
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-slate-700">
          {label}
          {required && <span className="text-rose-500 ml-1">*</span>}
        </label>
        <span className="text-xs text-slate-400">PNG, JPG up to 2MB</span>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".png,.jpg,.jpeg,image/png,image/jpeg"
        onChange={handleFileInputChange}
        disabled={disabled || isUploading}
        className="hidden"
        aria-label="Upload signature image"
      />

      {/* Display active preview if image selected or exists */}
      {activeDisplayUrl ? (
        <div className="relative rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center gap-4">
            {/* Signature Image Preview Container */}
            <div className="w-32 h-18 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center p-2 overflow-hidden shrink-0">
              <img
                src={activeDisplayUrl}
                alt="Digital Signature Preview"
                className="max-h-full max-w-full object-contain select-none"
              />
            </div>

            {/* File Meta and State */}
            <div className="min-w-0 flex-1 text-sm">
              <div className="flex items-center gap-1.5 text-emerald-700 font-semibold text-xs mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>{selectedFile ? 'Ready to attach' : 'Saved signature on file'}</span>
              </div>
              <p className="text-slate-800 font-medium truncate text-xs sm:text-sm">
                {selectedFile ? selectedFile.name : 'Registered Signature Asset'}
              </p>
              {selectedFile && (
                <p className="text-slate-400 text-xs mt-0.5">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              )}
            </div>

            {/* Remove / Replace Controls */}
            {!disabled && !isUploading && (
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={triggerBrowse}
                  title="Replace signature"
                >
                  Replace
                </Button>
                <button
                  type="button"
                  onClick={handleRemove}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-200"
                  aria-label="Remove signature"
                  title="Remove signature"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Drag-and-Drop Dropzone */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={triggerBrowse}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              triggerBrowse();
            }
          }}
          tabIndex={disabled || isUploading ? -1 : 0}
          role="button"
          aria-label="Click or drag signature image here"
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
            disabled || isUploading
              ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
              : isDragOver
              ? 'border-indigo-500 bg-indigo-50/50 scale-[1.005]'
              : 'border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50/50'
          }`}
        >
          <div className="flex flex-col items-center justify-center gap-2">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                isDragOver ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'
              }`}
            >
              <UploadCloud className="w-5 h-5" />
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-700">
                <span className="text-indigo-600 hover:underline">Click to browse</span> or drag and drop
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                PNG, JPG or JPEG (Max 2 MB)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Validation Error Banner */}
      {validationError && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium animate-fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{validationError}</span>
        </div>
      )}
    </div>
  );
}
