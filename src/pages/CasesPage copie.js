import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import { Link } from 'react-router-dom';
import axios from '../utils/axiosConfig';
import { Star, StarHalf, Edit, Save, Upload, X, Folder, Image as ImageIcon, File, ArrowUp, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Trash2, Plus } from 'lucide-react';
import ImageViewer from '../components/ImageViewer';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import * as S from './CasesPage.styles';
import { CasesGrid, FoldersSection } from './CasesPage.styles';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';
const UPLOAD_BASE_URL = process.env.REACT_APP_UPLOAD_URL || 'http://localhost:5002/uploads';

const CollapsibleImageGallery = memo(({ folder, images, onImageClick, onDeleteImage, caseId, fetchFolderMainImage }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [imageLoadError, setImageLoadError] = useState({});
  const [folderMainImage, setFolderMainImage] = useState(null);

  useEffect(() => {
    const loadFolderMainImage = async () => {
      const imageUrl = await fetchFolderMainImage(caseId, folder);
      setFolderMainImage(imageUrl);
    };
    loadFolderMainImage();
  }, [caseId, folder, fetchFolderMainImage]);

  return (
    <S.GalleryContainer>
      <S.GalleryHeader onClick={() => setIsOpen(!isOpen)}>
        <h3>{folder}</h3>
        {folderMainImage && (
          <S.FolderMainImage 
            src={folderMainImage} 
            alt={`Image principale de ${folder}`} 
            onError={() => setImageLoadError(prev => ({ ...prev, [folderMainImage]: true }))}
          />
        )}
        {isOpen ? <ChevronUp /> : <ChevronDown />}
      </S.GalleryHeader>
      {isOpen && (
        <S.ImagesGrid>
          {images.map((image, index) => (
            <S.ImageWrapper key={index}>
              <S.ThumbnailImage
                src={imageLoadError[image] ? '/images/placeholder.jpg' : image}
                alt={`${folder} image ${index}`}
                onClick={() => onImageClick(folder, index)}
                onError={() => setImageLoadError(prev => ({ ...prev, [image]: true }))}
              />
              <S.DeleteButton onClick={() => onDeleteImage(folder, image)}>
                <X size={12} />
              </S.DeleteButton>
            </S.ImageWrapper>
          ))}
        </S.ImagesGrid>
      )}
    </S.GalleryContainer>
  );
});

const CaseCard = memo(({ cas, onUpdateDifficulty, onUpdateAnswer, onAddTag, onRemoveTag, onDeleteCase, onLoadCase }) => {
  const [editingAnswer, setEditingAnswer] = useState(null);
  const [newTag, setNewTag] = useState('');

  const handleAnswerEdit = useCallback(() => {
    setEditingAnswer({ id: cas._id, value: cas.answer || '' });
  }, [cas._id, cas.answer]);

  const handleAnswerSave = useCallback(() => {
    if (editingAnswer) {
      onUpdateAnswer(editingAnswer.id, editingAnswer.value);
      setEditingAnswer(null);
    }
  }, [editingAnswer, onUpdateAnswer]);

  const handleAddTag = useCallback((e) => {
    e.preventDefault();
    onAddTag(cas._id, newTag);
    setNewTag('');
  }, [cas._id, newTag, onAddTag]);

  return (
    <S.CaseCard>
      <Link to={`/radiology-viewer/${cas._id}`}>
        <S.CaseImage 
          src={cas.mainImage ? cas.mainImage : (cas.folders && cas.folders[0] && cas.folderMainImages && cas.folderMainImages[cas.folders[0]]) || '/images/default.jpg'}
          alt={cas.title || 'Image sans titre'} 
        />
        <S.CaseTitle>{cas.title || 'Cas sans titre'}</S.CaseTitle>
      </Link>
      <StarRating
        rating={cas.difficulty || 1}
        onRatingChange={(newRating) => onUpdateDifficulty(cas._id, newRating)}
      />
      <S.AnswerSection>
        {editingAnswer && editingAnswer.id === cas._id ? (
          <>
            <S.AnswerInput
              value={editingAnswer.value}
              onChange={(e) => setEditingAnswer({ ...editingAnswer, value: e.target.value })}
              placeholder="Entrez la réponse..."
            />
            <S.Button onClick={handleAnswerSave}>
              <Save size={16} />
              Sauvegarder
            </S.Button>
          </>
        ) : (
          <>
            <S.AnswerText>{cas.answer || 'Pas de réponse'}</S.AnswerText>
            <S.Button onClick={handleAnswerEdit}>
              <Edit size={16} />
              Modifier la réponse
            </S.Button>
          </>
        )}
      </S.AnswerSection>
      <S.TagsContainer>
        {cas.tags && cas.tags.map(tag => (
          <S.Tag key={tag}>
            {tag}
            <S.RemoveTagButton onClick={() => onRemoveTag(cas._id, tag)}>
              <X size={12} />
            </S.RemoveTagButton>
          </S.Tag>
        ))}
        <S.AddTagForm onSubmit={handleAddTag}>
          <S.TagInput
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="Nouveau tag"
          />
          <S.AddTagButton type="submit">
            <Plus size={16} />
          </S.AddTagButton>
        </S.AddTagForm>
      </S.TagsContainer>
      <S.Button as={Link} to={`/create-sheet/${cas._id}`}>Créer fiche</S.Button>
      <S.Button onClick={() => onLoadCase(cas._id)}>Charger</S.Button>
      <S.Button onClick={() => onDeleteCase(cas._id)}>Supprimer</S.Button>
    </S.CaseCard>
  );
});

const StarRating = memo(({ rating, onRatingChange }) => {
  return (
    <S.StarRatingContainer>
      {[1, 2, 3, 4, 5].map((star) => (
        <S.Star
          key={star}
          onClick={() => onRatingChange(star)}
          filled={rating >= star}
        >
          {rating >= star ? (
            <Star fill="gold" color="gold" />
          ) : rating >= star - 0.5 ? (
            <StarHalf fill="gold" color="gold" />
          ) : (
            <Star color="gray" />
          )}
        </S.Star>
      ))}
    </S.StarRatingContainer>
  );
});

function CasesPage() {
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [newCaseTitle, setNewCaseTitle] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [newImages, setNewImages] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [isScrollVisible, setIsScrollVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [imageDetails, setImageDetails] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [currentFolder, setCurrentFolder] = useState(null);

  useEffect(() => {
    fetchCases();
  }, []);

  useEffect(() => {
    console.log('Cases mises à jour:', cases);
  }, [cases]);

  useEffect(() => {
    const toggleScrollVisibility = () => {
      setIsScrollVisible(window.pageYOffset > 300);
    };

    window.addEventListener('scroll', toggleScrollVisibility);
    return () => window.removeEventListener('scroll', toggleScrollVisibility);
  }, []);

  const fetchCases = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/cases`);
      console.log('Réponse brute de l\'API:', response.data);
      
      const casesWithFullImageUrls = response.data.map(caseItem => ({
        ...caseItem,
        images: caseItem.images || {},
        folderMainImages: caseItem.folderMainImages || {}
      }));
  
      console.log('Cas traités:', casesWithFullImageUrls);
      setCases(casesWithFullImageUrls);
    } catch (error) {
      console.error('Erreur détaillée lors de la récupération des cas:', error);
      setError('Erreur lors de la récupération des cas');
    } finally {
      setIsLoading(false);
    }
  }, [API_BASE_URL]);

  const handleImageUpload = useCallback((event, folder) => {
    const files = Array.from(event.target.files);
    setNewImages(prev => ({
      ...prev,
      [folder]: [
        ...(prev[folder] || []),
        ...files.map(file => ({
          file,
          preview: URL.createObjectURL(file)
        }))
      ]
    }));
  }, []);

  const handleImageClick = useCallback((folder, index) => {
    setSelectedImage(selectedCase.images[folder][index]);
    setSelectedImageIndex(index);
    setCurrentFolder(folder);
  }, [selectedCase]);

  const closeImage = useCallback(() => {
    setSelectedImage(null);
    setSelectedImageIndex(null);
    setCurrentFolder(null);
  }, []);

  const navigateImage = useCallback((direction) => {
    if (!currentFolder || selectedImageIndex === null || !selectedCase || !selectedCase.images) return;
    const images = selectedCase.images[currentFolder];
    let newIndex = selectedImageIndex + direction;
    if (newIndex < 0) newIndex = images.length - 1;
    if (newIndex >= images.length) newIndex = 0;
    setSelectedImage(images[newIndex]);
    setSelectedImageIndex(newIndex);
  }, [currentFolder, selectedImageIndex, selectedCase]);

  const removeImage = useCallback((folder, index) => {
    setNewImages(prev => ({
      ...prev,
      [folder]: prev[folder].filter((_, i) => i !== index)
    }));
  }, []);

  const fetchFolderMainImage = useCallback(async (caseId, folder) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/cases/${caseId}`);
      if (response.data && response.data.folderMainImages && response.data.folderMainImages[folder]) {
        return response.data.folderMainImages[folder];
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des données du cas:', error);
    }
    return null;
  }, [API_BASE_URL]);

  const addNewCase = useCallback(async () => {
    if (newCaseTitle.trim() === '') return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${API_BASE_URL}/cases`, { 
        title: newCaseTitle,
        folders: [],
        images: {},
        difficulty: 1,
        answer: ''
      });
      setCases(prevCases => [...prevCases, response.data]);
      setNewCaseTitle('');
      setSelectedCase(response.data);
    } catch (error) {
      setError('Erreur lors de l\'ajout d\'un nouveau cas');
      console.error('Erreur lors de l\'ajout d\'un nouveau cas:', error);
    } finally {
      setIsLoading(false);
    }
  }, [newCaseTitle, API_BASE_URL]);

  const addNewFolder = useCallback(async () => {
    if (!selectedCase || newFolderName.trim() === '') return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${API_BASE_URL}/cases/${selectedCase._id}/folders`, { folderName: newFolderName });
      setCases(prevCases => prevCases.map(c => c._id === selectedCase._id ? response.data : c));
      setSelectedCase(response.data);
      setNewFolderName('');
    } catch (error) {
      setError('Erreur lors de l\'ajout d\'un nouveau dossier');
      console.error('Erreur lors de l\'ajout d\'un nouveau dossier:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCase, newFolderName, API_BASE_URL]);

  const addImagesToCase = useCallback(async () => {
    if (!selectedCase) return;
    setIsLoading(true);
    setError(null);
    try {
      for (const [folder, images] of Object.entries(newImages)) {
        const formData = new FormData();
        images.forEach((image, index) => {
          formData.append('images', image.file);
        });
        formData.append('folder', folder);
  
        console.log('Envoi de formData:', Object.fromEntries(formData));
  
        const response = await axios.post(`${API_BASE_URL}/cases/${selectedCase._id}/images`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        console.log('Réponse du serveur:', response.data);
      }
      const updatedCase = await axios.get(`${API_BASE_URL}/cases/${selectedCase._id}`);
      setCases(prevCases => prevCases.map(c => c._id === selectedCase._id ? updatedCase.data : c));
      setSelectedCase(updatedCase.data);
      setNewImages({});
    } catch (error) {
      console.error('Erreur détaillée lors de l\'ajout des images:', error.response?.data || error.message);
      setError('Erreur lors de l\'ajout des images au cas');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCase, newImages, API_BASE_URL]);
  
  const setMainImage = useCallback(async (event) => {
    const file = event.target.files[0];
    if (file && selectedCase) {
      setIsLoading(true);
      setError(null);
      try {
        const formData = new FormData();
        formData.append('mainImage', file);
        const response = await axios.post(`${API_BASE_URL}/cases/${selectedCase._id}/main-image`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setCases(prevCases => prevCases.map(c => c._id === selectedCase._id ? response.data : c));
        setSelectedCase(response.data);
      } catch (error) {
        setError('Erreur lors de la définition de l\'image principale');
        console.error('Erreur lors de la définition de l\'image principale:', error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [selectedCase, API_BASE_URL]);
  
  const setFolderMainImage = useCallback(async (event, folder) => {
    const file = event.target.files[0];
    if (file && selectedCase) {
      setIsLoading(true);
      setError(null);
      try {
        const formData = new FormData();
        formData.append('folderMainImage', file);
        formData.append('folder', folder);
        const response = await axios.post(`${API_BASE_URL}/cases/${selectedCase._id}/folder-main-image`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        setCases(prevCases => prevCases.map(c => 
          c._id === selectedCase._id 
            ? {...c, folderMainImages: {...c.folderMainImages, [folder]: response.data.folderMainImages.get(folder)}} 
            : c
        ));
        
        setSelectedCase(prevCase => ({
          ...prevCase,
          folderMainImages: {...prevCase.folderMainImages, [folder]: response.data.folderMainImages.get(folder)}
        }));
        
        // Rechargez le cas pour s'assurer que toutes les données sont à jour
        await loadCase(selectedCase._id);
        
      } catch (error) {
        setError('Erreur lors de la définition de l\'image principale du dossier');
        console.error('Erreur lors de la définition de l\'image principale du dossier:', error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [selectedCase, API_BASE_URL, loadCase]);
  
  const deleteFolder = useCallback(async (folder) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le dossier "${folder}" ?`)) {
      try {
        await axios.delete(`${API_BASE_URL}/cases/${selectedCase._id}/folders/${folder}`);
        const updatedCase = await axios.get(`${API_BASE_URL}/cases/${selectedCase._id}`);
        setCases(prevCases => prevCases.map(c => c._id === selectedCase._id ? updatedCase.data : c));
        setSelectedCase(updatedCase.data);
      } catch (error) {
        console.error('Erreur lors de la suppression du dossier:', error);
        setError('Erreur lors de la suppression du dossier');
      }
    }
  }, [selectedCase, API_BASE_URL]);
  
  const loadCase = useCallback(async (id) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/cases/${id}`);
      setSelectedCase(response.data);
      setCases(prevCases => prevCases.map(c => c._id === id ? response.data : c));
    } catch (error) {
      setError('Erreur lors du chargement du cas');
      console.error('Erreur lors du chargement du cas:', error);
    } finally {
      setIsLoading(false);
    }
  }, [API_BASE_URL]);
  
  const deleteCase = useCallback(async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce cas ?')) {
      setIsLoading(true);
      setError(null);
      try {
        await axios.delete(`${API_BASE_URL}/cases/${id}`);
        setCases(prevCases => prevCases.filter(c => c._id !== id));
        setSelectedCase(null);
      } catch (error) {
        setError('Erreur lors de la suppression du cas');
        console.error('Erreur lors de la suppression du cas:', error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [API_BASE_URL]);
  
  const verifyImages = useCallback(async () => {
    if (!selectedCase) {
      alert("Veuillez sélectionner un cas d'abord.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/cases/${selectedCase._id}/images`);
      setImageDetails(response.data);
      console.log('Détails des images:', response.data);
    } catch (error) {
      console.error('Erreur lors de la vérification des images:', error);
      setError('Erreur lors de la vérification des images. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCase, API_BASE_URL]);
  
  const deleteExistingImage = useCallback(async (folder, imagePath) => {
    try {
      await axios.delete(`${API_BASE_URL}/cases/${selectedCase._id}/images`, {
        data: { folder, imagePath }
      });
      const updatedCase = await axios.get(`${API_BASE_URL}/cases/${selectedCase._id}`);
      setCases(prevCases => prevCases.map(c => c._id === selectedCase._id ? updatedCase.data : c));
      setSelectedCase(updatedCase.data);
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'image:', error);
      setError('Erreur lors de la suppression de l\'image');
    }
  }, [selectedCase, API_BASE_URL]);
  
  const updateCaseDifficulty = useCallback(async (id, difficulty) => {
    try {
      await axios.patch(`${API_BASE_URL}/cases/${id}`, { difficulty });
      setCases(prevCases => prevCases.map(c => 
        c._id === id ? { ...c, difficulty } : c
      ));
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la difficulté:', error);
    }
  }, [API_BASE_URL]);
  
  const updateCaseAnswer = useCallback(async (id, answer) => {
    try {
      await axios.patch(`${API_BASE_URL}/cases/${id}`, { answer });
      setCases(prevCases => prevCases.map(c => 
        c._id === id ? { ...c, answer } : c
      ));
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la réponse:', error);
    }
  }, [API_BASE_URL]);
  
  const handleAddTag = useCallback(async (caseId, tag) => {
    try {
      const response = await axios.patch(`${API_BASE_URL}/cases/${caseId}/tags`, { tagToAdd: tag });
      setCases(prevCases => prevCases.map(c => c._id === caseId ? response.data : c));
    } catch (error) {
      console.error('Erreur lors de l\'ajout du tag:', error);
    }
  }, [API_BASE_URL]);
  
  const handleRemoveTag = useCallback(async (caseId, tagToRemove) => {
    try {
      const response = await axios.patch(`${API_BASE_URL}/cases/${caseId}/tags`, { tagToRemove });
      setCases(prevCases => prevCases.map(c => c._id === caseId ? response.data : c));
    } catch (error) {
      console.error('Erreur lors de la suppression du tag:', error);
    }
  }, [API_BASE_URL]);
  
  const filteredCases = cases.filter(cas => 
    cas.title.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <S.PageContainer>
      <S.Title>Création de cas</S.Title>
  
      <S.SearchInput
        type="text"
        placeholder="Rechercher un cas..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
  
      <S.SectionContainer>
        <S.InputGroup>
          <S.Input
            type="text"
            value={newCaseTitle}
            onChange={(e) => setNewCaseTitle(e.target.value)}
            placeholder="Titre du nouveau cas"
          />
          <S.Button onClick={addNewCase}>Créer un nouveau cas</S.Button>
        </S.InputGroup>
  
        <S.Select
          value={selectedCase?._id || ''}
          onChange={(e) => loadCase(e.target.value)}
        >
          <option value="">Sélectionner un cas</option>
          {cases.map(cas => (
            <option key={cas._id} value={cas._id}>{cas.title}</option>
          ))}
        </S.Select>
      </S.SectionContainer>
  
      {selectedCase && (
        <S.SectionContainer>
          <S.InputGroup>
            <S.UploadButton>
              <ImageIcon size={20} style={{ marginRight: '10px' }} />
              Choisir l'image principale du cas
              <S.FileInput
                type="file"
                accept="image/*"
                onChange={setMainImage}
              />
            </S.UploadButton>
          </S.InputGroup>
  
          <S.InputGroup>
            <S.Input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Nom du nouveau dossier"
            />
            <S.Button onClick={addNewFolder}>
              <Folder size={20} style={{ marginRight: '10px' }} />
              Ajouter un dossier
            </S.Button>
          </S.InputGroup>
  
          {selectedCase.folders.map(folder => (
            <S.FolderContainer key={folder}>
              <S.FolderHeader>
                <S.FolderTitle>{folder}</S.FolderTitle>
                <S.FolderActions>
                  <S.UploadButton>
                    <Upload size={20} style={{ marginRight: '10px' }} />
                    Ajouter des images {folder}
                    <S.FileInput 
                      type="file" 
                      accept="image/*" 
                      multiple
                      onChange={(e) => handleImageUpload(e, folder)} 
                    />
                  </S.UploadButton>
                  <S.MainImageButton as="label">
                    <ImageIcon size={20} style={{ marginRight: '10px' }} />
                    Image principale
                    <S.FileInput
                      type="file"
                      accept="image/*"
                      onChange={(e) => setFolderMainImage(e, folder)}
                    />
                  </S.MainImageButton>
                  <S.Button onClick={() => deleteFolder(folder)}>
                    <Trash2 size={20} style={{ marginRight: '10px' }} />
                    Supprimer le dossier
                  </S.Button>
                </S.FolderActions>
              </S.FolderHeader>
              {newImages[folder] && newImages[folder].length > 0 && (
                <S.ImagePreviewContainer>
                  {newImages[folder].map((img, index) => (
                    <S.ImagePreview key={index}>
                      <S.PreviewImage src={img.preview} alt={`Preview ${index}`} />
                      <S.RemoveImageButton onClick={() => removeImage(folder, index)}>
                        <X size={12} />
                      </S.RemoveImageButton>
                    </S.ImagePreview>
                  ))}
                </S.ImagePreviewContainer>
              )}
            </S.FolderContainer>
          ))}
  
          <S.Button 
            onClick={addImagesToCase} 
            disabled={Object.values(newImages).every(arr => !arr || arr.length === 0)}
          >
            Ajouter les images au cas
          </S.Button>
  
          <S.Button onClick={verifyImages} style={{ marginLeft: '10px' }}>
            Vérifier les images
          </S.Button>
        </S.SectionContainer>
      )}
  
      <S.CasesGrid>
        {filteredCases && filteredCases.length > 0 ? (
          filteredCases.map((cas) => (
            <CaseCard
              key={cas._id}
              cas={cas}
              onUpdateDifficulty={updateCaseDifficulty}
              onUpdateAnswer={updateCaseAnswer}
              onAddTag={handleAddTag}
              onRemoveTag={handleRemoveTag}
              onDeleteCase={deleteCase}
              onLoadCase={loadCase}
            />
          ))
        ) : (
          <p>Aucun cas disponible</p>
        )}
      </S.CasesGrid>
  
      <S.FoldersSection>
      {selectedCase && selectedCase.images && (
  <S.SectionContainer>
    <h2>{selectedCase.title}</h2>
    {selectedCase.folders.map(folder => (
      selectedCase.images[folder] && (
        <CollapsibleImageGallery
          key={folder}
          folder={folder}
          images={selectedCase.images[folder]}
          onImageClick={(image, index) => handleImageClick(folder, index)}
          onDeleteImage={deleteExistingImage}
          caseId={selectedCase._id}
          fetchFolderMainImage={fetchFolderMainImage}
        />
      )
    ))}
           {selectedImage && (
            <S.LargeImageContainer onClick={closeImage}>
              <S.LargeImage src={selectedImage} alt="Selected" onClick={(e) => e.stopPropagation()} />
              <S.CloseButton onClick={(e) => { e.stopPropagation(); closeImage(); }}>
                <X size={24} />
              </S.CloseButton>
              <S.NavigationButton onClick={(e) => { e.stopPropagation(); navigateImage(-1); }} style={{ left: '20px' }}>
                <ChevronLeft size={24} />
              </S.NavigationButton>
              <S.NavigationButton onClick={(e) => { e.stopPropagation(); navigateImage(1); }} style={{ right: '20px' }}>
                <ChevronRight size={24} />
              </S.NavigationButton>
            </S.LargeImageContainer>
          )}
        </S.SectionContainer>
      )}
    </S.FoldersSection>

    {imageDetails && (
      <S.SectionContainer>
        <h3>Détails des images :</h3>
        {Object.entries(imageDetails).map(([folder, images]) => (
          <div key={folder}>
            <h4>{folder} :</h4>
            <ul>
              {images.map((image, index) => (
                <li key={index}>{image}</li>
              ))}
            </ul>
          </div>
        ))}
      </S.SectionContainer>
    )}

{selectedCase && (
  <S.SectionContainer>
    <h3>Images principales des dossiers :</h3>
    {selectedCase.folders.map(folder => (
      <div key={folder}>
        <h4>{folder}</h4>
        {selectedCase.folderMainImages && selectedCase.folderMainImages[folder] ? (
          <img 
            src={selectedCase.folderMainImages[folder]} 
            alt={`Image principale de ${folder}`} 
            style={{ maxWidth: '200px', maxHeight: '200px' }} 
          />
        ) : (
          <p>Pas d'image principale définie pour ce dossier</p>
        )}
      </div>
    ))}
  </S.SectionContainer>
)}

    {isLoading && <LoadingSpinner />}
    {error && <ErrorMessage>{error}</ErrorMessage>}
  </S.PageContainer>
);
}

export default memo(CasesPage);