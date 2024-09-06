// Créez un nouveau fichier ImageViewer.js

import React, { useState } from 'react';
import styled from 'styled-components';

const ViewerContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const ImageContainer = styled.div`
  max-width: 100%;
  max-height: 70vh;
  overflow: hidden;
`;

const Image = styled.img`
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
`;

const ThumbnailContainer = styled.div`
  display: flex;
  overflow-x: auto;
  margin-top: 1rem;
`;

const Thumbnail = styled.img`
  width: 50px;
  height: 50px;
  object-fit: cover;
  margin-right: 0.5rem;
  cursor: pointer;
  border: 2px solid ${props => props.isSelected ? 'blue' : 'transparent'};
`;

function ImageViewer({ images }) {
  const [selectedImage, setSelectedImage] = useState(images[0]);

  return (
    <ViewerContainer>
      <ImageContainer>
        <Image src={selectedImage} alt="Selected" />
      </ImageContainer>
      <ThumbnailContainer>
        {images.map((image, index) => (
          <Thumbnail
            key={index}
            src={image}
            alt={`Thumbnail ${index}`}
            onClick={() => setSelectedImage(image)}
            isSelected={image === selectedImage}
          />
        ))}
      </ThumbnailContainer>
    </ViewerContainer>
  );
}

export default ImageViewer;