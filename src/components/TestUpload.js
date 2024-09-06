import React, { useState } from 'react';
import axios from '../utils/axiosConfig';

const TestUpload = () => {
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    const formData = new FormData();
    formData.append('image', file); // Utilise le champ 'image'

    try {
      const response = await axios.post(`/cases/test-upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('Upload réussi:', response.data);
    } catch (error) {
      console.error('Erreur lors de l\'upload de l\'image:', error);
    }
  };

  return (
    <div>
      <h3>Test d'upload d'image</h3>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload}>Uploader</button>
    </div>
  );
};

export default TestUpload;
