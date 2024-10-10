import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ChevronDown, ChevronUp, Plus, Trash2, GripVertical, Copy, Camera, Upload } from 'lucide-react';
import axios from '../utils/axiosConfig';
import QuestionnairePreview from './QuestionnairePreview';

// Styled components (inchangés)
const CreatorWrapper = styled.div`
  background-color: ${props => props.theme.background};
  color: ${props => props.theme.text};
  padding: 2rem;
  border-radius: 8px;
`;

const CreatorCard = styled.div`
  background-color: ${props => props.theme.card};
  color: ${props => props.theme.text};
  border: 1px solid ${props => props.theme.border};
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
`;

const QuestionCard = styled.div`
  background-color: ${props => props.theme.cardSecondary};
  border: 1px solid ${props => props.theme.border};
  border-radius: 8px;
  margin-bottom: 0.75rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
`;

const QuestionHeader = styled.div`
  display: flex;
  align-items: center;
  padding: 0.75rem;
  border-bottom: 1px solid ${props => props.theme.border};
  background-color: ${props => props.depth === 0 ? props.theme.primary + '10' : 'transparent'};
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
`;

const QuestionContent = styled.div`
  padding: 0.75rem;
  background-color: ${props => props.depth % 2 === 0 ? props.theme.background : props.theme.cardSecondary + '50'};
`;

const OptionCard = styled.div`
  background-color: ${props => props.theme.cardTertiary + '30'};
  border: 1px solid ${props => props.theme.border + '90'};
  border-radius: 4px;
  margin-bottom: 0.5rem;
  padding: 0.5rem;
`;

const SubQuestionWrapper = styled.div`
  margin-left: ${props => Math.min(props.depth * 0.5, 1.5)}rem;
  border-left: 2px solid ${props => props.theme.primary + '50'};
  padding-left: 0.75rem;
  margin-top: 0.5rem;
`;

const StyledSelect = styled.select`
  width: 100%;
  padding: 0.5rem;
  margin-bottom: 1rem;
  border-radius: 4px;
  background-color: ${props => props.theme.inputBackground};
  color: ${props => props.theme.inputText};
  border: 1px solid ${props => props.theme.border};
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

const ImageUpload = memo(({ onImageUpload, currentImage, id, onAddCaption, caption, questionnaireTitle }) => {
  const [showPreview, setShowPreview] = useState(false);
  const [showCaptionModal, setShowCaptionModal] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploading(true);
      try {
        await onImageUpload(file, id, questionnaireTitle);
      } catch (error) {
        console.error('Erreur lors du téléchargement de l\'image:', error);
      } finally {
        setUploading(false);
      }
    }
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
          onMouseEnter={() => setShowPreview(true)}
          onMouseLeave={() => setShowPreview(false)}
        >
          <Camera 
            size={20} 
            className="text-blue-500 cursor-pointer" 
            onClick={() => setShowCaptionModal(true)}
          />
          {showPreview && (
            <div className="absolute z-10 p-2 bg-white rounded-lg shadow-xl" style={{ top: '100%', left: '50%', transform: 'translateX(-50%)' }}>
              <img
                src={currentImage}
                alt="Preview"
                className="max-w-xs max-h-64 object-contain"
              />
              {caption && <p className="mt-2 text-sm text-gray-500">{caption}</p>}
            </div>
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
});

const DraggableQuestion = memo(({ question, index, moveQuestion, path, children }) => {
  const ref = useRef(null);
  const [, drag] = useDrag({
    type: 'QUESTION',
    item: { index, path },
    collect: monitor => ({
      isDragging: monitor.isDragging(),
    }),
  });
  
  const [, drop] = useDrop({
    accept: 'QUESTION',
    hover: (item, monitor) => {
      if (!ref.current) return;
      const dragPath = item.path;
      const hoverPath = path;
      
      if (dragPath.join('-') === hoverPath.join('-')) return;
      if (dragPath.includes('options') !== hoverPath.includes('options')) return;
      
      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;
      
      if (dragPath[dragPath.length - 1] < hoverPath[hoverPath.length - 1] && hoverClientY < hoverMiddleY) return;
      if (dragPath[dragPath.length - 1] > hoverPath[hoverPath.length - 1] && hoverClientY > hoverMiddleY) return;
      
      moveQuestion(dragPath, hoverPath);
      item.path = hoverPath;
    },
  });
  
  drag(drop(ref));
  
  return (
    <div ref={ref} className="mb-4 relative">
      <div className="absolute left-0 top-0 bottom-0 w-6 flex items-center justify-center cursor-move">
        <GripVertical size={20} className="text-gray-400" />
      </div>
      {children}
    </div>
  );
});

function QuestionnaireCreator() {
  const [questionnaire, setQuestionnaire] = useState({
    title: '',
    questions: [],
    selectedOptions: {},
    crData: { crTexts: {}, freeTexts: {} },
  });
  const [expandedQuestions, setExpandedQuestions] = useState({});
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      const fetchQuestionnaire = async () => {
        try {
          const response = await axios.get(`/questionnaires/${id}`);
          const loadedQuestionnaire = response.data;
          setQuestionnaire({
            ...loadedQuestionnaire,
            selectedOptions: loadedQuestionnaire.selectedOptions || {},
            crData: {
              crTexts: loadedQuestionnaire.crData?.crTexts || {},
              freeTexts: loadedQuestionnaire.crData?.freeTexts || {}
            }
          });
          const initialExpanded = loadedQuestionnaire.questions.reduce((acc, _, index) => {
            acc[index] = true;
            return acc;
          }, {});
          setExpandedQuestions(initialExpanded);
        } catch (error) {
          console.error('Erreur lors du chargement du questionnaire:', error);
        }
      };
      fetchQuestionnaire();
    }
  }, [id]);

  const updateQuestionnaire = useCallback((field, value) => {
    setQuestionnaire(prev => ({ ...prev, [field]: value }));
  }, []);

  const moveQuestion = useCallback((dragPath, hoverPath) => {
    setQuestionnaire(prev => {
      const newQuestions = JSON.parse(JSON.stringify(prev.questions));
      
      const getQuestionAt = (questions, path) => {
        let current = questions;
        for (let i = 0; i < path.length; i++) {
          if (path[i] === 'options' || path[i] === 'subQuestions') {
            current = current[path[i]];
          } else {
            current = current[path[i]];
          }
        }
        return current;
      };

      const removeQuestionAt = (questions, path) => {
        const parentPath = path.slice(0, -1);
        const index = path[path.length - 1];
        const parent = getQuestionAt(questions, parentPath);
        return parent.splice(index, 1)[0];
      };

      const insertQuestionAt = (questions, path, question) => {
        const parentPath = path.slice(0, -1);
        const index = path[path.length - 1];
        const parent = getQuestionAt(questions, parentPath);
        parent.splice(index, 0, question);
      };

      const movedQuestion = removeQuestionAt(newQuestions, dragPath);
      insertQuestionAt(newQuestions, hoverPath, movedQuestion);

      return { ...prev, questions: newQuestions };
    });
  }, []);

  const toggleQuestion = useCallback((path) => {
    setExpandedQuestions(prev => {
      const key = path.join('-');
      return { ...prev, [key]: !prev[key] };
    });
  }, []);

  const updateQuestion = useCallback((path, field, value) => {
    setQuestionnaire(prev => {
      const updatedQuestions = JSON.parse(JSON.stringify(prev.questions));
      let current = updatedQuestions;
      for (let i = 0; i < path.length - 1; i++) {
        if (path[i] === 'options' || path[i] === 'subQuestions') {
          current = current[path[i]];
        } else {
          current = current[path[i]];
        }
      }
      if (typeof value === 'function') {
        current[path[path.length - 1]][field] = value(current[path[path.length - 1]][field]);
      } else {
        current[path[path.length - 1]][field] = value;
      }
      return { ...prev, questions: updatedQuestions };
    });
  }, []);

  const handleImageUpload = useCallback(async (file, elementId, questionnaireTitle) => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('questionnaireTitle', questionnaireTitle);
  
    try {
      const response = await axios.post('/upload-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      const path = elementId.split('-');
      updateQuestion(path, 'image', { src: response.data.imageUrl, caption: '' });
    } catch (error) {
      console.error('Erreur lors du téléchargement de l\'image:', error);
    }
  }, [updateQuestion]);

  const handleAddCaption = useCallback((elementId, caption) => {
    const path = elementId.split('-');
    updateQuestion(path, 'image', prevImage => ({ ...prevImage, caption: caption }));
  }, [updateQuestion]);

  const duplicateQuestion = useCallback((question) => {
    const deepCopy = JSON.parse(JSON.stringify(question));
    const updateIds = (q) => {
      q.id = Date.now().toString();
      if (q.options) {
        q.options.forEach(option => {
          option.id = Date.now().toString();
          if (option.subQuestions) {
            option.subQuestions.forEach(updateIds);
          }
        });
      }
    };
    updateIds(deepCopy);
    return deepCopy;
  }, []);

  const addQuestion = useCallback((path = [], duplicatedQuestion = null) => {
    const newQuestion = duplicatedQuestion || { id: Date.now().toString(), text: '', type: 'single', options: [] };
    setQuestionnaire(prev => {
      const updatedQuestions = JSON.parse(JSON.stringify(prev.questions));
      
      const addRecursive = (questions, currentPath) => {
        if (currentPath.length === 0) {
          questions.push(newQuestion);
          return questions;
        }
        
        const [index, ...restPath] = currentPath;
        
        if (restPath[0] === 'options') {
          if (!questions[index].options) {
            questions[index].options = [];
          }
          questions[index].options = addRecursive(questions[index].options, restPath.slice(1));
        } else if (restPath[0] === 'subQuestions') {
          if (!questions[index].subQuestions) {
            questions[index].subQuestions = [];
          }
          questions[index].subQuestions = addRecursive(questions[index].subQuestions, restPath.slice(1));
        }
        
        return questions;
      };
      
      return { ...prev, questions: addRecursive(updatedQuestions, path) };
    });
  }, []);
  
  const addOption = useCallback((path) => {
    setQuestionnaire(prev => {
      const updatedQuestions = JSON.parse(JSON.stringify(prev.questions));
      let current = updatedQuestions;
      for (let i = 0; i < path.length; i++) {
        if (path[i] === 'options' || path[i] === 'subQuestions') {
          current = current[path[i]];
        } else {
          current = current[path[i]];
        }
      }
      if (!current.options) {
        current.options = [];
      }
      current.options.push({ id: Date.now().toString(), text: '', subQuestions: [] });
      return { ...prev, questions: updatedQuestions };
    });
  }, []);
  
  const deleteQuestion = useCallback((path) => {
    setQuestionnaire(prev => {
      const updatedQuestions = JSON.parse(JSON.stringify(prev.questions));
      const parentPath = path.slice(0, -1);
      const index = path[path.length - 1];
      
      if (parentPath.length === 0) {
        updatedQuestions.splice(index, 1);
      } else {
        let current = updatedQuestions;
        for (let i = 0; i < parentPath.length; i++) {
          if (parentPath[i] === 'options' || parentPath[i] === 'subQuestions') {
            current = current[parentPath[i]];
          } else {
            current = current[path[i]];
          }
        }
        current.splice(index, 1);
      }
      
      return { ...prev, questions: updatedQuestions };
    });
  }, []);
  
  const deleteOption = useCallback((path) => {
    setQuestionnaire(prev => {
      const updatedQuestions = JSON.parse(JSON.stringify(prev.questions));
      const parentPath = path.slice(0, -1);
      const index = path[path.length - 1];
      let current = updatedQuestions;
      for (let i = 0; i < parentPath.length; i++) {
        if (parentPath[i] === 'options' || parentPath[i] === 'subQuestions') {
          current = current[parentPath[i]];
        } else {
          current = current[path[i]];
        }
      }
      current.splice(index, 1);
      return { ...prev, questions: updatedQuestions };
    });
  }, []);
  
  const handleSave = useCallback(async () => {
    try {
      console.log('Données à sauvegarder:', JSON.stringify(questionnaire, null, 2));
      let response;
      if (id) {
        response = await axios.put(`/questionnaires/${id}`, questionnaire);
      } else {
        response = await axios.post('/questionnaires', questionnaire);
      }
      console.log('Réponse du serveur:', response.data);
      setQuestionnaire(response.data);
      navigate('/questionnaires');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du questionnaire:', error);
      if (error.response) {
        console.error('Réponse du serveur:', error.response.data);
        console.error('Status:', error.response.status);
        console.error('Headers:', error.response.headers);
      } else if (error.request) {
        console.error('Pas de réponse reçue:', error.request);
      } else {
        console.error('Erreur de configuration de la requête:', error.message);
      }
    }
  }, [questionnaire, id, navigate]);
  
  const handleFreeTextChange = useCallback((questionId, value) => {
    setQuestionnaire(prev => ({
      ...prev,
      crData: {
        ...prev.crData,
        freeTexts: {
          ...(prev.crData?.freeTexts || {}),
          [questionId]: value
        }
      }
    }));
  }, []);
  
  const handleOptionChange = useCallback((questionId, optionIndex, questionType) => {
    setQuestionnaire(prev => {
      const updatedQuestionnaire = JSON.parse(JSON.stringify(prev));
      if (!updatedQuestionnaire.selectedOptions) {
        updatedQuestionnaire.selectedOptions = {};
      }
      if (!updatedQuestionnaire.selectedOptions[questionId]) {
        updatedQuestionnaire.selectedOptions[questionId] = [];
      }
      
      if (questionType === 'single') {
        updatedQuestionnaire.selectedOptions[questionId] = [optionIndex];
      } else if (questionType === 'multiple') {
        const index = updatedQuestionnaire.selectedOptions[questionId].indexOf(optionIndex);
        if (index > -1) {
          updatedQuestionnaire.selectedOptions[questionId] = updatedQuestionnaire.selectedOptions[questionId].filter(i => i !== optionIndex);
        } else {
          updatedQuestionnaire.selectedOptions[questionId].push(optionIndex);
        }
      }
      
      return updatedQuestionnaire;
    });
  }, []);
  
  const renderQuestion = useCallback((question, path) => {
    const isExpanded = expandedQuestions[path.join('-')] ?? true;
    const questionId = path.join('-');
    const depth = path.length;
  
    return (
      <DraggableQuestion
        key={question.id || `question-${questionId}`}
        question={question}
        index={path[path.length - 1]}
        moveQuestion={moveQuestion}
        path={path}
      >
        <QuestionCard>
          <QuestionHeader depth={depth}>
            <button
              className="mr-2 p-1 rounded-full hover:bg-opacity-20 hover:bg-gray-500"
              onClick={() => toggleQuestion(path)}
            >
              {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            <input 
              className="flex-grow p-2 border-b border-transparent focus:border-blue-500 focus:outline-none bg-transparent"
              type="text" 
              value={question.text || ''} 
              onChange={(e) => updateQuestion(path, 'text', e.target.value)}
              placeholder="Texte de la question"
            />
           <ImageUpload
  onImageUpload={handleImageUpload}
  currentImage={question.image?.src}
  id={questionId}
  onAddCaption={handleAddCaption}
  caption={question.image?.caption}
  questionnaireTitle={questionnaire.title} // Assurez-vous que cette ligne est présente
/>
            <button
              className="ml-2 p-1 text-blue-500 hover:text-blue-700 rounded-full hover:bg-blue-100"
              onClick={() => {
                const duplicated = duplicateQuestion(question);
                addQuestion(path.slice(0, -1), duplicated);
              }}
              title="Dupliquer la question"
            >
              <Copy size={16} />
            </button>
            <button
              className="ml-2 p-1 text-red-500 hover:text-red-700 rounded-full hover:bg-red-100"
              onClick={() => deleteQuestion(path)}
            >
              <Trash2 size={16} />
            </button>
          </QuestionHeader>
          {isExpanded && (
            <QuestionContent depth={depth}>
              <StyledSelect
                value={question.type || 'single'}
                onChange={(e) => updateQuestion(path, 'type', e.target.value)}
              >
                <option value="single">Choix unique</option>
                <option value="multiple">Choix multiple</option>
                <option value="text">Texte libre</option>
                <option value="number">Numérique</option>
              </StyledSelect>
              {['single', 'multiple'].includes(question.type) && (
                <div className="space-y-2">
                  {question.options && question.options.map((option, oIndex) => (
                    <OptionCard key={option.id || `${questionId}-option-${oIndex}`}>
                      <div className="flex items-center p-1 rounded">
                        <input
                          className="flex-grow p-1 bg-transparent border-b border-transparent focus:border-blue-500 focus:outline-none text-sm"
                          type="text"
                          value={option.text || ''}
                          onChange={(e) => updateQuestion([...path, 'options', oIndex], 'text', e.target.value)}
                          placeholder="Texte de l'option"
                        />
                        <ImageUpload
                          onImageUpload={handleImageUpload}
                          currentImage={option.image?.src}
                          id={`${questionId}-options-${oIndex}`}
                          onAddCaption={handleAddCaption}
                          caption={option.image?.caption}
                          questionnaireTitle={questionnaire.title}
                        />
                        <button
                          className="ml-1 p-1 text-red-500 hover:text-red-700 rounded-full hover:bg-red-100"
                          onClick={() => deleteOption([...path, 'options', oIndex])}
                        >
                          <Trash2 size={14} />
                        </button>
                        <button 
                          className="ml-1 p-1 text-blue-500 hover:text-blue-700 rounded-full hover:bg-blue-100"
                          onClick={() => addQuestion([...path, 'options', oIndex, 'subQuestions'])}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      {option.subQuestions && option.subQuestions.map((subQuestion, sqIndex) => (
                        <SubQuestionWrapper key={subQuestion.id || `${questionId}-option-${oIndex}-subquestion-${sqIndex}`} depth={depth + 1}>
                          {renderQuestion(subQuestion, [...path, 'options', oIndex, 'subQuestions', sqIndex])}
                        </SubQuestionWrapper>
                      ))}
                    </OptionCard>
                  ))}
                  <button 
                    className="w-full p-2 mt-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
                    onClick={() => addOption(path)}
                  >
                    <Plus size={14} className="inline mr-1" /> Ajouter une option
                  </button>
                </div>
              )}
            </QuestionContent>
          )}
        </QuestionCard>
      </DraggableQuestion>
    );
  }, [expandedQuestions, moveQuestion, toggleQuestion, updateQuestion, handleImageUpload, duplicateQuestion, addQuestion, deleteQuestion, deleteOption, addOption, handleAddCaption, questionnaire.title]);
  
  return (
    <CreatorWrapper>
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-2/3">
          <CreatorCard>
            <input 
              className="w-full p-2 text-xl border-b-2 border-blue-500 focus:outline-none focus:border-blue-700 mb-6"
              type="text" 
              value={questionnaire.title} 
              onChange={(e) => updateQuestionnaire('title', e.target.value)}
              placeholder="Titre du questionnaire" 
            />
            <DndProvider backend={HTML5Backend}>
              {questionnaire.questions.map((question, index) => renderQuestion(question, [index]))}
            </DndProvider>
            <div className="flex justify-between mt-6">
              <button 
                className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors text-sm"
                onClick={() => addQuestion()}
              >
                <Plus size={14} className="inline mr-1" /> Ajouter une question
              </button>
              <button 
                className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition-colors text-sm"
                onClick={handleSave}
              >
                Sauvegarder le questionnaire
              </button>
            </div>
          </CreatorCard>
        </div>
        <div className="lg:w-2/4">
          <CreatorCard>
            <h3 className="text-xl font-semibold mb-4">Aperçu du questionnaire</h3>
            <div className="bg-opacity-50 bg-gray-100 p-4 rounded-md">
              <QuestionnairePreview 
                title={questionnaire.title} 
                questions={questionnaire.questions}
                selectedOptions={questionnaire.selectedOptions}
                setSelectedOptions={handleOptionChange}
                crTexts={questionnaire.crData?.crTexts || {}}
                setCRTexts={(newCRTexts) => updateQuestionnaire('crData', {
                  ...questionnaire.crData,
                  crTexts: newCRTexts
                })}
                freeTexts={questionnaire.crData?.freeTexts || {}}
                onFreeTextChange={handleFreeTextChange}
                showCRFields={false}
              />
            </div>
          </CreatorCard>
        </div>
      </div>
    </CreatorWrapper>
  );
  }
  
  export default memo(QuestionnaireCreator);