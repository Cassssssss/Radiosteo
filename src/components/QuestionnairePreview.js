import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import { PlusCircle, Camera, EyeOff, Eye, ChevronDown, ChevronUp, Plus } from 'lucide-react';

const ImagePreviewWrapper = styled.div`
  position: fixed;
  z-index: 9999;
  background-color: white;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 4px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
`;

const ImagePreview = ({ image, alt, position }) => (
  <ImagePreviewWrapper style={{ left: `${position.x}px`, top: `${position.y}px` }}>
    <img src={image.src} alt={alt} style={{ maxWidth: '400px', maxHeight: '400px', width: 'auto', height: 'auto', objectFit: 'contain' }} />
    <p style={{ marginTop: '5px', fontSize: '12px' }}>{image.caption || 'Pas de légende'}</p>
  </ImagePreviewWrapper>
);

const FormatButton = styled.button`
  padding: 0.5rem;
  margin-right: 0.5rem;
  border: 1px solid ${props => props.theme.border};
  background-color: ${props => props.theme.card};
  color: ${props => props.theme.text};
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: ${props => props.theme.primary};
    color: ${props => props.theme.buttonText};
  }
`;

const TextFormatButtons = ({ onBold, onUnderline, onSize, onCenter }) => (
  <div className="flex space-x-2 mb-2">
    <FormatButton onClick={onBold}>B</FormatButton>
    <FormatButton onClick={onUnderline}>U</FormatButton>
    <FormatButton onClick={() => onSize('12px')}>Petit</FormatButton>
    <FormatButton onClick={() => onSize('16px')}>Moyen</FormatButton>
    <FormatButton onClick={() => onSize('20px')}>Grand</FormatButton>
    <FormatButton onClick={onCenter}>⧏⧐</FormatButton>
  </div>
);

const QuestionPreview = ({ 
  question, 
  depth = 0, 
  selectedOptions, 
  setSelectedOptions, 
  crTexts, 
  setCRTexts, 
  freeTexts,
  onFreeTextChange,
  showCRFields = false,
  onImageInsert,
  hiddenQuestions,
  toggleQuestionVisibility,
  imageCaptions,
  path = []
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showImage, setShowImage] = useState(null);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const questionRef = useRef(null);

  if (!question || !question.id) return null;

  if (hiddenQuestions && hiddenQuestions[question.id] && !showCRFields) {
    return null;
  }

  const questionSelectedOptions = selectedOptions?.[question.id] || [];
  const questionCRTexts = crTexts?.[question.id] || {};

  const isOptionSelected = (optionIndex) => {
    if (!selectedOptions?.[question.id]) {
      return false;
    }
    return Array.isArray(selectedOptions[question.id])
      ? selectedOptions[question.id].includes(optionIndex)
      : selectedOptions[question.id][optionIndex];
  };

  const handleOptionChange = (optionIndex) => {
    if (typeof setSelectedOptions === 'function') {
      setSelectedOptions(question.id, optionIndex, question.type);
    }
  };

  const handleCRTextChange = (optionIndex, text) => {
    setCRTexts(prev => ({
      ...prev,
      [question.id]: {
        ...(prev[question.id] || {}),
        [optionIndex]: text
      }
    }));
  };

  const formatText = (optionIndex, format, value = '') => {
    const textarea = document.getElementById(`cr-text-${question.id}-${optionIndex}`);
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = textarea.value.substring(start, end);
      let formattedText;
      
      switch (format) {
        case 'bold':
          formattedText = `<strong>${selectedText}</strong>`;
          break;
        case 'underline':
          formattedText = `<u>${selectedText}</u>`;
          break;
        case 'size':
          formattedText = `<span style="font-size: ${value};">${selectedText}</span>`;
          break;
        case 'center':
          formattedText = `<div style="text-align: center;">${selectedText}</div>`;
          break;
        default:
          formattedText = selectedText;
      }

      const newText = textarea.value.substring(0, start) + formattedText + textarea.value.substring(end);
      handleCRTextChange(optionIndex, newText);
    }
  };

  const handleMouseEnter = (event, imageId) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setImagePosition({ x: rect.right + 10, y: rect.top });
    setShowImage(imageId);
  };

  const handleMouseLeave = () => {
    setShowImage(null);
  };

  return (
    <div className={`
      mb-4
      ${depth === 0 ? 'border-l-4 border-blue-500 dark:border-blue-700 pl-4' : 'ml-4 pl-2 border-l-2 border-gray-400 dark:border-gray-700'}
      bg-gray-100
      rounded-lg overflow-hidden
      transition-colors duration-200
    `} ref={questionRef}>
      <div className="flex items-center justify-between cursor-pointer p-2" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center">
          {showCRFields && typeof toggleQuestionVisibility === 'function' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleQuestionVisibility(question.id);
              }}
              className="mr-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              {hiddenQuestions && hiddenQuestions[question.id] ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          )}
          <h3 className={`font-semibold ${depth === 0 ? 'text-lg' : 'text-md'} text-gray-900 dark:text-white transition-colors duration-200`}>
            {question.text || 'Question sans texte'}
          </h3>
          {question.image && (
            <div className="flex items-center ml-2">
              <div 
                className="relative"
                onMouseEnter={(e) => handleMouseEnter(e, question.id)}
                onMouseLeave={handleMouseLeave}
              >
                <Camera size={20} className="text-blue-500 cursor-pointer" />
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onImageInsert(question.image);
                }}
                className="ml-1 p-1 text-blue-500 hover:text-blue-700 rounded-full hover:bg-blue-100"
                title="Ajouter l'image au CR"
              >
                <Plus size={16} />
              </button>
            </div>
          )}
        </div>
        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </div>
      {showImage === question.id && question.image && (
        <ImagePreview 
          image={question.image} 
          alt="Question" 
          position={imagePosition}
        />
      )}
      {isExpanded && (
        <div className="mt-2">
          {(question.type === 'single' || question.type === 'multiple') && Array.isArray(question.options) && (
            <ul className="space-y-1">
              {question.options.map((option, optionIndex) => (
                <li key={option?.id || `${question.id}-option-${optionIndex}`}>
                  <label className="flex items-center">
                    <input
                      type={question.type === 'single' ? 'radio' : 'checkbox'}
                      checked={isOptionSelected(optionIndex)}
                      onChange={() => handleOptionChange(optionIndex)}
                      className="mr-2"
                    />
                    <span className="questionnaire-option text-gray-900 dark:text-white">
                      {option?.text || `Option ${optionIndex + 1}`}
                    </span>
                    {option?.image && (
                      <div className="flex items-center ml-2">
                        <div 
                          className="relative"
                          onMouseEnter={(e) => handleMouseEnter(e, `${question.id}-options-${optionIndex}`)}
                          onMouseLeave={handleMouseLeave}
                        >
                          <Camera size={20} className="text-blue-500 cursor-pointer" />
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onImageInsert(option.image);
                          }}
                          className="ml-1 p-1 text-blue-500 hover:text-blue-700 rounded-full hover:bg-blue-100"
                          title="Ajouter l'image au CR"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    )}
                  </label>
                  {showImage === `${question.id}-options-${optionIndex}` && option.image && (
                    <ImagePreview 
                      image={option.image} 
                      alt="Option" 
                      position={imagePosition}
                    />
                  )}
                  {showCRFields && isOptionSelected(optionIndex) && (
                    <>
                      <TextFormatButtons 
                        onBold={() => formatText(optionIndex, 'bold')}
                        onUnderline={() => formatText(optionIndex, 'underline')}
                        onSize={(size) => formatText(optionIndex, 'size', size)}
                        onCenter={() => formatText(optionIndex, 'center')}
                      />
                      <textarea
                        id={`cr-text-${question.id}-${optionIndex}`}
                        value={questionCRTexts[optionIndex] || ''}
                        onChange={(e) => handleCRTextChange(optionIndex, e.target.value)}
                        placeholder="Texte du CR pour cette option"
                        className="mt-1 w-full p-2 border rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </>
                  )}
                  {isOptionSelected(optionIndex) && Array.isArray(option?.subQuestions) && (
                    <div className="mt-1">
                      {option.subQuestions.map((subQuestion, subIndex) => (
                        <QuestionPreview 
                          key={subQuestion?.id || `${question.id}-${optionIndex}-${subIndex}`}
                          question={subQuestion} 
                          depth={depth + 1}
                          path={[...path, 'options', optionIndex, 'subQuestions', subIndex]}
                          selectedOptions={selectedOptions}
                          setSelectedOptions={setSelectedOptions}
                          crTexts={crTexts}
                          setCRTexts={setCRTexts}
                          freeTexts={freeTexts}
                          onFreeTextChange={onFreeTextChange}
                          showCRFields={showCRFields}
                          onImageInsert={onImageInsert}
                          hiddenQuestions={hiddenQuestions}
                          toggleQuestionVisibility={toggleQuestionVisibility}
                          imageCaptions={imageCaptions}
                        />
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
          {question.type === 'text' && (
            <textarea
              value={freeTexts?.[question.id] || ''}
              onChange={(e) => onFreeTextChange(question.id, e.target.value)}
              placeholder="Votre réponse..."
              className="mt-2 w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          )}
          {question.type === 'number' && (
            <input
              type="number"
              value={freeTexts?.[question.id] || ''}
              onChange={(e) => onFreeTextChange(question.id, e.target.value)}
              placeholder="Votre réponse..."
              className="mt-2 w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          )}
        </div>
      )}
    </div>
  );
};

const QuestionnairePreview = ({ 
  questions, 
  selectedOptions, 
  setSelectedOptions, 
  crTexts, 
  setCRTexts, 
  freeTexts,
  onFreeTextChange,
  showCRFields = false,
  onImageInsert,
  hiddenQuestions,
  toggleQuestionVisibility,
  imageCaptions
}) => {
  if (!Array.isArray(questions)) return null;

  return (
    <div className="max-w-2xl mx-auto p-1">
      {questions.map((question, index) => (
        <QuestionPreview 
          key={question?.id || `question-${index}`}
          question={question}
          selectedOptions={selectedOptions || {}}
          setSelectedOptions={setSelectedOptions}
          crTexts={crTexts || {}}
          setCRTexts={setCRTexts}
          freeTexts={freeTexts || {}}
          onFreeTextChange={onFreeTextChange}
          showCRFields={showCRFields}
          onImageInsert={onImageInsert}
          hiddenQuestions={hiddenQuestions}
          toggleQuestionVisibility={toggleQuestionVisibility}
          imageCaptions={imageCaptions}
        />
      ))}
    </div>
  );
};

export default QuestionnairePreview;