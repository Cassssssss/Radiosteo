import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, Plus, Trash2, GripVertical, Copy, Camera, Upload, X, ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react';
import axios from '../utils/axiosConfig';
import styles from './RadiologyViewer.module.css';

const CollapsibleImageGallery = memo(({ folder, images, onImageClick, onDeleteImage }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={styles.galleryContainer}>
      <div className={styles.galleryHeader} onClick={() => setIsOpen(!isOpen)}>
        <h3>{folder}</h3>
        {isOpen ? <ChevronUp /> : <ChevronDown />}
      </div>
      {isOpen && (
        <div className={styles.imagesGrid}>
          {images.map((image, index) => (
            <div key={index} className={styles.imageWrapper}>
              <img
                src={`http://localhost:5002/${image}`}
                alt={`${folder} image ${index}`}
                onClick={() => onImageClick(folder, index)}
                className={styles.thumbnailImage}
                loading="lazy"
              />
              <button onClick={() => onDeleteImage(folder, image)} className={styles.deleteButton}>
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

function RadiologyViewer() {
  const { caseId } = useParams();
  const [currentCase, setCurrentCase] = useState(null);
  const [currentIndexLeft, setCurrentIndexLeft] = useState(0);
  const [currentIndexRight, setCurrentIndexRight] = useState(0);
  const [currentFolderLeft, setCurrentFolderLeft] = useState('');
  const [currentFolderRight, setCurrentFolderRight] = useState('');
  const [isSingleViewMode, setIsSingleViewMode] = useState(false);
  const [isResponseVisible, setIsResponseVisible] = useState(false);
  const [imageControls, setImageControls] = useState({
    left: { scale: 1, contrast: 100, brightness: 100, translateX: 0, translateY: 0 },
    right: { scale: 1, contrast: 100, brightness: 100, translateX: 0, translateY: 0 },
    single: { scale: 1, contrast: 100, brightness: 100, translateX: 0, translateY: 0 }
  });
  const [isPanning, setIsPanning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isZooming, setIsZooming] = useState(false);
  const [isAdjustingContrast, setIsAdjustingContrast] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [accumulatedDelta, setAccumulatedDelta] = useState(0);
  const [isShortcutGuideVisible, setIsShortcutGuideVisible] = useState(false);

  const leftViewerRef = useRef(null);
  const rightViewerRef = useRef(null);
  const singleViewerRef = useRef(null);
  const defaultImageSrc = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==';

  const loadImage = useCallback((folder, index, side) => {
    if (currentCase && currentCase.images && currentCase.images[folder]) {
      const imagePath = currentCase.images[folder][index];
      if (imagePath) {
        const imageUrl = `http://localhost:5002/${imagePath}`;
        const imageElement = side === 'left' ? leftViewerRef.current :
                             side === 'right' ? rightViewerRef.current :
                             singleViewerRef.current;
        if (imageElement) {
          imageElement.src = imageUrl;
          if (side === 'left' || side === 'single') {
            setCurrentIndexLeft(index);
            setCurrentFolderLeft(folder);
          } else if (side === 'right') {
            setCurrentIndexRight(index);
            setCurrentFolderRight(folder);
          }
        }
      }
    }
  }, [currentCase]);

  useEffect(() => {
    fetchCase();
  }, [caseId]);
  
  const fetchCase = useCallback(async () => {
    try {
      const response = await axios.get(`http://localhost:5002/api/cases/${caseId}`);
      setCurrentCase(response.data);
      if (response.data.folders && response.data.folders.length > 0) {
        setCurrentFolderLeft(response.data.folders[0]);
        setCurrentFolderRight(response.data.folders[0]);
        if (response.data.images && response.data.images[response.data.folders[0]]) {
          loadImage(response.data.folders[0], 0, 'left');
          loadImage(response.data.folders[0], 0, 'right');
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement du cas:', error);
    }
  }, [caseId, loadImage]);

  const applyImageTransforms = useCallback((side) => {
    const controls = imageControls[side];
    const imageElement = side === 'left' ? leftViewerRef.current : 
                         side === 'right' ? rightViewerRef.current : 
                         singleViewerRef.current;
    if (imageElement) {
      imageElement.style.transform = `scale(${controls.scale}) translate(${controls.translateX}px, ${controls.translateY}px)`;
      imageElement.style.filter = `contrast(${controls.contrast}%) brightness(${controls.brightness}%)`;
    }
  }, [imageControls]);

  const handleScroll = useCallback((deltaY, slowMode = false, side) => {
    const threshold = slowMode ? 10 : 50;
    setAccumulatedDelta(prev => {
      const newDelta = prev + deltaY;
      if (Math.abs(newDelta) >= threshold) {
        const direction = newDelta > 0 ? 1 : -1;
        const currentFolder = side === 'left' || side === 'single' ? currentFolderLeft : currentFolderRight;
        const currentIndex = side === 'left' || side === 'single' ? currentIndexLeft : currentIndexRight;
        const images = currentCase.images[currentFolder];
        const newIndex = (currentIndex + direction + images.length) % images.length;
        loadImage(currentFolder, newIndex, side);
        return 0;
      }
      return newDelta;
    });
  }, [currentCase, currentFolderLeft, currentFolderRight, currentIndexLeft, currentIndexRight, loadImage]);

  const handleZoom = useCallback((side, delta) => {
    setImageControls(prev => {
      const newControls = {...prev};
      newControls[side].scale = Math.max(0.1, Math.min(5, newControls[side].scale * (1 + delta * 0.001)));
      return newControls;
    });
    applyImageTransforms(side);
  }, [applyImageTransforms]);

  const handleContrast = useCallback((side, delta) => {
    setImageControls(prev => {
      const newControls = {...prev};
      newControls[side].contrast = Math.max(0, Math.min(200, newControls[side].contrast + delta * 0.5));
      return newControls;
    });
    applyImageTransforms(side);
  }, [applyImageTransforms]);

  const handlePan = useCallback((side, deltaX, deltaY) => {
    setImageControls(prev => {
      const newControls = {...prev};
      newControls[side].translateX += deltaX;
      newControls[side].translateY += deltaY;
      return newControls;
    });
    applyImageTransforms(side);
  }, [applyImageTransforms]);

  const toggleViewMode = useCallback(() => {
    setIsSingleViewMode(prev => {
      if (!prev) {
        setTimeout(() => {
          if (singleViewerRef.current && leftViewerRef.current) {
            singleViewerRef.current.src = leftViewerRef.current.src;
            setImageControls(prevControls => ({
              ...prevControls,
              single: {...prevControls.left}
            }));
          }
        }, 0);
      } else {
        setTimeout(() => {
          if (leftViewerRef.current && singleViewerRef.current) {
            leftViewerRef.current.src = singleViewerRef.current.src;
            rightViewerRef.current.src = singleViewerRef.current.src;
            setImageControls(prevControls => ({
              ...prevControls,
              left: {...prevControls.single},
              right: {...prevControls.single}
            }));
          }
        }, 0);
      }
      return !prev;
    });
  }, []);

  const handleDragStart = useCallback((event, folder) => {
    event.dataTransfer.setData('text/plain', folder);
    event.target.classList.add('dragging');
  }, []);

  const handleDrop = useCallback((event, side) => {
    event.preventDefault();
    const folder = event.dataTransfer.getData('text');
    loadImage(folder, 0, side);
    event.target.classList.remove('drag-over');
    document.querySelectorAll('.folder-thumbnail').forEach(el => el.classList.remove('dragging'));
  }, [loadImage]);

  const handleMouseDown = useCallback((e, side) => {
    if (e.button === 0 && e.shiftKey) {
      setIsPanning(true);
    } else if (e.button === 2 && e.shiftKey) {
      setIsAdjustingContrast(true);
    } else if (e.button === 2) {
      setIsZooming(true);
    } else if (e.button === 0) {
      setIsDragging(true);
    }
    setStartX(e.clientX);
    setStartY(e.clientY);
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback((e, side) => {
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    if (isPanning) {
      handlePan(side, deltaX, deltaY);
    } else if (isZooming) {
      handleZoom(side, -deltaY);
    } else if (isAdjustingContrast) {
      handleContrast(side, deltaX);
    } else if (isDragging) {
      handleScroll(deltaY, true, side);
    }

    setStartX(e.clientX);
    setStartY(e.clientY);
  }, [isPanning, isZooming, isAdjustingContrast, isDragging, startX, startY, handlePan, handleZoom, handleContrast, handleScroll]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsPanning(false);
    setIsZooming(false);
    setIsAdjustingContrast(false);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "&") {
        if (!isSingleViewMode) toggleViewMode();
      } else if (event.key === "é") {
        if (isSingleViewMode) toggleViewMode();
      } else if (event.key === "ArrowDown") {
        handleScroll(100, false, isSingleViewMode ? 'single' : 'left');
        if (!isSingleViewMode) handleScroll(100, false, 'right');
      } else if (event.key === "ArrowUp") {
        handleScroll(-100, false, isSingleViewMode ? 'single' : 'left');
        if (!isSingleViewMode) handleScroll(-100, false, 'right');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleScroll, isSingleViewMode, toggleViewMode]);

  const renderViewer = useCallback((side) => (
    <div 
      className={`${styles.viewer} ${styles.viewerHalf}`}
      onWheel={(e) => {
        e.preventDefault();
        if (e.ctrlKey) {
          handleZoom(side, -e.deltaY);
        } else {
          handleScroll(e.deltaY, false, side);
        }
      }}
      onMouseDown={(e) => handleMouseDown(e, side)}
      onMouseMove={(e) => handleMouseMove(e, side)}
      onMouseUp={handleMouseUp}
      onContextMenu={(e) => e.preventDefault()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => handleDrop(e, side)}
    >
      <div className={styles.folderLabel}>
        {side === 'left' ? currentFolderLeft : currentFolderRight}
      </div>
      <img 
        ref={side === 'left' ? leftViewerRef : rightViewerRef}
        className={styles.image} 
        alt={`Image médicale ${side}`}
        src={defaultImageSrc}
      />
    </div>
  ), [handleZoom, handleScroll, handleMouseDown, handleMouseMove, handleMouseUp, handleDrop, currentFolderLeft, currentFolderRight]);

  if (!currentCase) return <div>Chargement...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.layout}>
          <div id="folder-thumbnails" className={styles.folderGrid}>
            {currentCase.folders.map(folder => (
              <div 
                key={folder} 
                className={styles.folderThumbnail}
                draggable 
                onDragStart={(e) => handleDragStart(e, folder)}
              >
                <img 
                  src={currentCase.images && currentCase.images[folder] && currentCase.images[folder][0] ? 
                    `http://localhost:5002/${currentCase.images[folder][0]}` : 
                    'http://localhost:5002/images/default.jpg'} 
                  alt={`${folder} thumbnail`} 
                  className={styles.folderThumbnailImage} 
                />
                <div className={styles.folderThumbnailLabel}>{folder}</div>
              </div>
            ))}
          </div>
  
          <div id="main-viewer" className={styles.mainViewer}>
            {isSingleViewMode ? (
              <div 
                id="single-viewer" 
                className={`${styles.viewer} ${styles.singleViewer}`}
                onWheel={(e) => {
                  e.preventDefault();
                  if (e.ctrlKey) {
                    handleZoom('single', -e.deltaY);
                  } else {
                    handleScroll(e.deltaY, false, 'single');
                  }
                }}
                onMouseDown={(e) => handleMouseDown(e, 'single')}
                onMouseMove={(e) => handleMouseMove(e, 'single')}
                onMouseUp={handleMouseUp}
                onContextMenu={(e) => e.preventDefault()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, 'single')}
              >
                <div className={styles.folderLabel}>{currentFolderLeft}</div>
                <img ref={singleViewerRef} className={styles.image} alt="Image médicale" src={defaultImageSrc} />
              </div>
            ) : (
              <div id="dual-viewer" className={styles.dualViewer}>
                {renderViewer('left')}
                {renderViewer('right')}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className={styles.bottomBar}>
        <div 
          className={styles.shortcutGuide}
          onMouseEnter={() => setIsShortcutGuideVisible(true)}
          onMouseLeave={() => setIsShortcutGuideVisible(false)}
        >
          <div className={styles.shortcutIcon}>?</div>
          {isShortcutGuideVisible && (
            <div className={`${styles.shortcutPopup} ${styles.visible}`}>
              <h3 className={styles.shortcutTitle}>Guide des raccourcis</h3>
              <ul className={styles.shortcutList}>
                <li><strong>Zoom :</strong> Clic droit + Déplacer la souris verticalement</li>
                <li><strong>Défilement des images :</strong> Molette de la souris ou flèches haut/bas</li>
                <li><strong>Contraste :</strong> Shift + Clic droit + Déplacer la souris horizontalement</li>
                <li><strong>Déplacer l'image :</strong> Shift + Clic gauche + Déplacer la souris</li>
                <li><strong>Mode simple/double écran :</strong> Touche "&" pour simple, "é" pour double</li>
              </ul>
            </div>
          )}
        </div>
  
        <div>
          <button 
            className={styles.responseButton}
            onClick={() => setIsResponseVisible(!isResponseVisible)}
          >
            {isResponseVisible ? "Cacher la réponse" : "Réponse"}
          </button>
          <Link to={`/sheet/${caseId}`} className={styles.sheetLink}>
            Voir la fiche récapitulative
          </Link>
        </div>
      </div>
  
      {isResponseVisible && currentCase && currentCase.answer && (
        <div className={styles.responseBox}>
          <p className={styles.responseText}>{currentCase.answer}</p>
        </div>
      )}
    </div>
  );
}

export default memo(RadiologyViewer);