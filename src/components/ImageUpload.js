import React, { useState, useRef } from 'react';
import { Upload, Camera } from 'lucide-react';

const ImageUpload = ({ onImageUpload, currentImage, id }) => {
  const [showPreview, setShowPreview] = useState(false);
  const inputRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onImageUpload(reader.result, id);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePaste = (e) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        processFile(blob);
        break;
      }
    }
  };

  const processFile = (file) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = reader.result;
      console.log("Image processed:", base64data.substring(0, 50) + "...");
      onImageUpload(base64data, id);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div 
      className="relative inline-block" 
      onPaste={handlePaste}
      tabIndex="0" 
      onFocus={() => inputRef.current.focus()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        className="hidden"
        id={`image-upload-${id}`}
      />
      <label
        htmlFor={`image-upload-${id}`}
        className="cursor-pointer inline-flex items-center px-2 py-1 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
      >
        {currentImage ? <Camera size={20} /> : <Upload size={20} />}
      </label>
      {currentImage && (
        <div 
          className="inline-block ml-2"
          onMouseEnter={() => setShowPreview(true)}
          onMouseLeave={() => setShowPreview(false)}
        >
          <Camera size={20} className="text-blue-500 cursor-pointer" />
          {showPreview && (
            <div className="absolute z-10 p-2 bg-white rounded-lg shadow-xl" style={{ top: '100%', left: '50%', transform: 'translateX(-50%)' }}>
              <img
                src={currentImage}
                alt="Preview"
                className="max-w-xs max-h-64 object-contain"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;