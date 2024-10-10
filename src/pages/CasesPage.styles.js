import styled from 'styled-components';
import shouldForwardProp from '@styled-system/should-forward-prop';

export const PageContainer = styled.div`
  background-color: ${props => props.theme.background};
  min-height: calc(100vh - 60px);
  padding: 2rem;
`;

export const Title = styled.h1`
  color: ${props => props.theme.text};
  text-align: center;
  font-size: 2rem;
  margin-bottom: 2rem;
`;

export const SearchInput = styled.input`
  width: 100%;
  padding: 10px;
  margin-bottom: 20px;
  border-radius: 5px;
  border: 1px solid ${props => props.theme.border};
  font-size: 1rem;
`;

export const SectionContainer = styled.div`
  margin-bottom: 2rem;
  padding: 1.5rem;
  background-color: ${props => props.theme.surface};
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  border: 1px solid ${props => props.theme.border};
`;

export const InputGroup = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
  gap: 1rem;
`;

export const Input = styled.input`
  flex: 1;
  padding: 10px;
  border-radius: 5px;
  border: 1px solid ${props => props.theme.border};
  font-size: 1rem;
`;

export const Button = styled.button`
  background-color: ${props => props.theme.primary};
  color: white;
  border: none;
  border-radius: 5px;
  padding: 10px 20px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: ${props => props.theme.secondary};
  }

  &:disabled {
    background-color: ${props => props.theme.disabled};
    cursor: not-allowed;
  }
`;

export const Select = styled.select`
  width: 100%;
  padding: 10px;
  margin-top: 10px;
  border-radius: 5px;
  border: 1px solid ${props => props.theme.border};
  font-size: 1rem;
`;

export const FolderContainer = styled.div`
  margin-bottom: 1.5rem;
  padding: 1rem;
  background-color: ${props => props.theme.background};
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  border: 1px solid ${props => props.theme.border};
`;

export const FolderHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

export const MainImageButton = styled(Button)`
  background-color: ${props => props.theme.secondary};
  
  &:hover {
    background-color: ${props => props.theme.secondaryHover};
  }
`;

export const FolderTitle = styled.h3`
  margin: 0;
  font-size: 1.2rem;
  color: ${props => props.theme.text};
`;

export const FolderActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

export const UploadButton = styled.label`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 15px;
  background-color: ${props => props.theme.primary};
  color: white;
  border-radius: 5px;
  cursor: pointer;
  margin-bottom: 10px;
  font-size: 0.9rem;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: ${props => props.theme.secondary};
  }
`;

export const FileInput = styled.input`
  display: none;
`;

export const ImagePreviewContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10rem;
`;

export const ImagePreview = styled.div`
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
`;

export const PreviewImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

export const RemoveImageButton = styled.button`
  position: absolute;
  top: 5px;
  right: 5px;
  background-color: rgba(255, 0, 0, 0.7);
  color: white;
  border: none;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: rgba(255, 0, 0, 1);
  }
`;

export const CasesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
  margin-bottom: 2rem;
`;

export const FoldersSection = styled.div`
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid ${props => props.theme.border};
`;

export const CaseCard = styled.div`
  background-color: ${props => props.theme.surface};
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  }
`;

export const CaseImage = styled.img`
  width: 100%;
  height: 200px;
  object-fit: cover;
`;

export const CaseTitle = styled.h2`
  color: ${props => props.theme.text};
  text-align: center;
  padding: 1rem;
  font-size: 1.1rem;
`;

export const CaseActions = styled.div`
  display: flex;
  justify-content: space-around;
  padding: 0.5rem;
`;

export const GalleryContainer = styled.div`
  margin-bottom: 1.5rem;
  border: 1px solid ${props => props.theme.border};
  border-radius: 8px;
  overflow: hidden;
`;

export const GalleryHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: ${props => props.theme.surface};
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: ${props => props.theme.hover};
  }
`;

export const ImagesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 10px;
  padding: 1rem;
  background-color: ${props => props.theme.background};
`;

export const ImageWrapper = styled.div`
  position: relative;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
`;

export const ThumbnailImage = styled.img`
  width: 100%;
  height: 100px;
  object-fit: cover;
  cursor: pointer;
  transition: transform 0.3s ease;

  &:hover {
    transform: scale(1.05);
  }
`;

export const DeleteButton = styled.button`
  position: absolute;
  top: 5px;
  right: 5px;
  background-color: rgba(255, 0, 0, 0.7);
  color: white;
  border: none;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: rgba(255, 0, 0, 1);
  }
`;

export const LargeImageContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
`;

export const LargeImage = styled.img`
  width: 80vmin;
  height: 80vmin;
  object-fit: contain;
  background-color: black;
`;

export const CloseButton = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  background-color: transparent;
  color: white;
  border: none;
  font-size: 24px;
  cursor: pointer;
  z-index: 10000;
`;

export const NavigationButton = styled.button`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background-color: rgba(255, 255, 255, 0.3);
  color: white;
  border: none;
  cursor: pointer;
  padding: 10px;
  font-size: 24px;
  z-index: 10000;
`;

export const DifficultySelect = styled.select`
  width: 100%;
  padding: 5px;
  margin-top: 5px;
  border-radius: 4px;
  border: 1px solid ${props => props.theme.border};
`;

export const StarRatingContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 5px;
`;

export const Star = styled('span').withConfig({
  shouldForwardProp: (prop) => !['filled'].includes(prop),
})`
  cursor: pointer;
  margin: 0 2px;
  svg {
    width: 24px;
    height: 24px;
    transition: fill 0.2s ease;
    fill: ${props => (props.filled ? 'gold' : 'gray')};
  }
`;

export const AnswerSection = styled.div`
  margin-top: 1rem;
`;

export const AnswerText = styled.p`
  margin-bottom: 0.5rem;
`;

export const AnswerInput = styled.input`
  width: 100%;
  padding: 0.5rem;
  margin-bottom: 0.5rem;
`;

export const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
`;

export const Tag = styled.span`
  background-color: ${props => props.theme.primary};
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
`;

export const RemoveTagButton = styled.button`
  background: none;
  border: none;
  color: white;
  margin-left: 0.25rem;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
`;

export const AddTagForm = styled.form`
  display: flex;
  align-items: center;
`;

export const TagInput = styled.input`
  padding: 0.25rem;
  border: 1px solid ${props => props.theme.border};
  border-radius: 4px;
  font-size: 0.75rem;
`;

export const AddTagButton = styled.button`
  background-color: ${props => props.theme.primary};
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.25rem;
  margin-left: 0.25rem;
  cursor: pointer;
  display: flex;
  align-items: center;
`;

export const MainImageLabel = styled.div`
  position: absolute;
  top: 5px;
  left: 5px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 2px 5px;
  font-size: 10px;
  border-radius: 3px;
`;

export const FolderMainImage = styled.img`
  width: 30px;
  height: 30px;
  object-fit: cover;
  border-radius: 4px;
  margin-right: 10px;
`;