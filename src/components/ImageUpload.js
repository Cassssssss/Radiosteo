import React, { useState } from 'react';
import axios from 'axios';
import { Camera, Upload, X } from 'lucide-react';
import styled from 'styled-components';

const ImagePreviewWrapper = styled.div`
  position: fixed;
  z-index: 9999;
  background-color: white;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 4px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  width: 80%;
  max-width: 500px;
`;

const ImageUpload = ({ onImageUpload, currentImage, id, onAddCaption, caption, questionnaireTitle }) => {
  const [showPreview, setShowPreview] = useState(false);
  const [showCaptionModal, setShowCaptionModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploading(true);
      const formData = new FormData();
      formData.append('image', file);
      formData.append('questionnaireTitle', questionnaireTitle); // Assurez-vous que cette ligne est présente
  
      try {
        const response = await axios.post('/api/upload-image', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        onImageUpload(response.data.imageUrl, id);
      } catch (error) {
        console.error('Erreur lors du téléchargement de l\'image:', error);
      } finally {
        setUploading(false);
      }
    }
  };

  const handleMouseEnter = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setImagePosition({ x: rect.right + 10, y: rect.top });
    setShowPreview(true);
  };

  const handleMouseLeave = () => {
    setShowPreview(false);
  };

  return (
    <div className="relative inline-block">
      <input
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        className="hidden"
        id={`image-upload-${id}`}
        disabled={uploading}
      />
      <label
        htmlFor={`image-upload-${id}`}
        className="cursor-pointer inline-flex items-center px-2 py-1 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
      >
        {currentImage ? <Camera size={20} /> : <Upload size={20} />}
      </label>
      {uploading && <span className="ml-2">Téléchargement en cours...</span>}
      {currentImage && (
        <div 
          className="inline-block ml-2"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <Camera 
            size={20} 
            className="text-blue-500 cursor-pointer" 
            onClick={() => setShowCaptionModal(true)}
          />
          {showPreview && (
            <ImagePreviewWrapper style={{ left: `${imagePosition.x}px`, top: `${imagePosition.y}px` }}>
              <img
                src={currentImage}
                alt="Preview"
                className="max-w-xs max-h-64 object-contain"
              />
              {caption && <p className="mt-2 text-sm text-gray-500">{caption}</p>}
            </ImagePreviewWrapper>
          )}
        </div>
      )}
      {showCaptionModal && (
        <Modal>
          <ModalContent>
            <h2 className="text-xl font-semibold mb-4">Ajouter une légende</h2>
            <textarea
              className="w-full p-2 border rounded mb-4"
              value={caption}
              onChange={(e) => onAddCaption(id, e.target.value)}
              placeholder="Entrez la légende de l'image"
            />
            <div className="flex justify-end">
              <button
                className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors text-sm"
                onClick={() => setShowCaptionModal(false)}
              >
                Fermer
              </button>
            </div>
          </ModalContent>
        </Modal>
      )}
    </div>
  );
};

export default ImageUpload;