import React, { useState } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const ImageUploader = ({ images = [], onChange }) => {
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);

    try {
      const uploadedUrls = [];
      for (const file of files) {
        // Validate
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} n'est pas une image`);
          continue;
        }
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} dépasse 5MB`);
          continue;
        }

        const formData = new FormData();
        formData.append('file', file);

        const response = await axios.post(
          `${API_URL}/api/upload/image`,
          formData,
          {
            withCredentials: true,
            headers: { 'Content-Type': 'multipart/form-data' }
          }
        );

        uploadedUrls.push(response.data.url);
      }

      if (uploadedUrls.length > 0) {
        onChange([...images, ...uploadedUrls]);
        toast.success(`${uploadedUrls.length} image(s) uploadée(s)`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.detail || 'Erreur lors de l\'upload');
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleRemove = (indexToRemove) => {
    onChange(images.filter((_, idx) => idx !== indexToRemove));
  };

  return (
    <div className="space-y-3" data-testid="image-uploader">
      {/* Upload Button */}
      <label className={`flex items-center justify-center gap-3 p-6 border-2 border-dashed border-slate-300 hover:border-[#3B5BFF] cursor-pointer transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
          data-testid="file-input"
        />
        {uploading ? (
          <>
            <Loader2 size={24} className="animate-spin text-[#3B5BFF]" />
            <span className="text-slate-600">Upload en cours...</span>
          </>
        ) : (
          <>
            <Upload size={24} className="text-slate-500" />
            <div className="text-center">
              <p className="font-medium text-slate-700">Cliquez pour parcourir vos fichiers</p>
              <p className="text-xs text-slate-500 mt-1">PNG, JPG, WEBP jusqu'à 5MB (plusieurs images possibles)</p>
            </div>
          </>
        )}
      </label>

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3" data-testid="image-preview-grid">
          {images.map((url, index) => (
            <div key={index} className="relative group aspect-square bg-slate-100 border border-slate-200">
              <img
                src={url}
                alt={`Image ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%23f1f5f9"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%2394a3b8"%3EErreur%3C/text%3E%3C/svg%3E';
                }}
              />
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                data-testid={`remove-image-${index}`}
              >
                <X size={14} />
              </button>
              {index === 0 && (
                <span className="absolute bottom-2 left-2 bg-[#3B5BFF] text-white text-xs font-bold px-2 py-1">
                  PRINCIPALE
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {images.length === 0 && !uploading && (
        <div className="text-center py-4 text-sm text-slate-400 flex items-center justify-center gap-2">
          <ImageIcon size={16} />
          Aucune image pour le moment
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
