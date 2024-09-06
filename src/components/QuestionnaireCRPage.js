import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../utils/axiosConfig';
import QuestionnairePreview from './QuestionnairePreview';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

const QuestionnaireCRPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [questionnaire, setQuestionnaire] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [crTexts, setCRTexts] = useState({});
  const [freeTexts, setFreeTexts] = useState({});
  const [hiddenQuestions, setHiddenQuestions] = useState({});
  const [editableCR, setEditableCR] = useState('');

  useEffect(() => {
    const fetchQuestionnaire = async () => {
      try {
        const response = await axios.get(`/questionnaires/${id}`);
        const loadedQuestionnaire = response.data;
        setQuestionnaire(loadedQuestionnaire);
        setSelectedOptions(loadedQuestionnaire.selectedOptions || {});
        setCRTexts(loadedQuestionnaire.crData?.crTexts || {});
        setFreeTexts(loadedQuestionnaire.crData?.freeTexts || {});
        setHiddenQuestions(loadedQuestionnaire.hiddenQuestions || {});
      } catch (error) {
        console.error('Erreur lors du chargement du questionnaire:', error);
      }
    };
    fetchQuestionnaire();
  }, [id]);

  useEffect(() => {
    const headerTitle = document.getElementById('header-title');
    if (headerTitle && questionnaire) {
      headerTitle.textContent = questionnaire.title;
    }
  }, [questionnaire]);

  useEffect(() => {
    const generatedCR = generateCR();
    setEditableCR(generatedCR);
  }, [questionnaire, selectedOptions, crTexts, freeTexts]);

  const generateCR = () => {
    let cr = '';
    
    const addContent = (content, isTitle = false) => {
      if (isTitle || content.startsWith('<strong>') || content.startsWith('<u>')) {
        cr += '\n'; // Add an empty line before titles or bold/underlined text
      }
      cr += content.trim() + '\n';
    };
    
    const generateCRRecursive = (questions) => {
      questions.forEach(question => {
        // Include the answer even if the question is hidden
        if (question.type === 'text' || question.type === 'number') {
          const freeText = freeTexts[question.id];
          if (freeText) {
            if (question.text === 'INDICATION' || question.text === 'CONCLUSION') {
              addContent(`<strong>${question.text} :</strong>`, true);
              addContent(freeText);
            } else {
              addContent(freeText);
            }
          }
        } else if (question.text === 'TECHNIQUE') {
          const selectedIndices = selectedOptions[question.id] || [];
          const techniqueResponses = selectedIndices.map(index => question.options[index]?.text).filter(Boolean);
          if (techniqueResponses.length > 0) {
            addContent('<strong>TECHNIQUE :</strong>', true);
            addContent(techniqueResponses.join(', ') + '.');
          }
        } else {
          const selectedIndices = selectedOptions[question.id] || [];
          selectedIndices.forEach(index => {
            const option = question.options?.[index];
            if (!option) return;
            const crText = crTexts[question.id]?.[index];
            if (crText) {
              addContent(crText);
            }
            if (option.subQuestions) {
              generateCRRecursive(option.subQuestions);
            }
          });
        }
      });
    };
    
    if (questionnaire && Array.isArray(questionnaire.questions)) {
      generateCRRecursive(questionnaire.questions);
    }
    return cr.trim();
  };

  const handleFreeTextChange = (questionId, value) => {
    setFreeTexts(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSave = async () => {
    try {
      await axios.put(`/questionnaires/${id}`, {
        ...questionnaire,
        selectedOptions,
        crData: { crTexts, freeTexts },
        hiddenQuestions
      });
      navigate('/questionnaires');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  const toggleQuestionVisibility = (questionId) => {
    setHiddenQuestions(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };
  
  const handleOptionChange = (questionId, optionIndex, questionType) => {
    setSelectedOptions(prevOptions => {
      const newOptions = { ...prevOptions };
      if (!newOptions[questionId]) {
        newOptions[questionId] = [];
      }
      if (questionType === 'single') {
        newOptions[questionId] = [optionIndex];
      } else if (questionType === 'multiple') {
        const index = newOptions[questionId].indexOf(optionIndex);
        if (index > -1) {
          newOptions[questionId] = newOptions[questionId].filter(i => i !== optionIndex);
        } else {
          newOptions[questionId] = [...newOptions[questionId], optionIndex];
        }
      }
      return newOptions;
    });
  };

  if (!questionnaire) return <div>Chargement...</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-3/5">
          <div className="rounded-lg p-0">
            <h3 className="text-xl font-semibold mb-4">Questionnaire</h3>
            <div className="bg-gray-100 p-4 rounded-md">
              <QuestionnairePreview 
                title=""
                questions={questionnaire.questions}
                selectedOptions={selectedOptions}
                setSelectedOptions={handleOptionChange}
                crTexts={crTexts}
                setCRTexts={setCRTexts}
                freeTexts={freeTexts}
                onFreeTextChange={handleFreeTextChange}
                showCRFields={true}
                hiddenQuestions={hiddenQuestions}
                toggleQuestionVisibility={toggleQuestionVisibility}
              />
            </div>
          </div>
        </div>
        <div className="w-full lg:w-2/4">
          <div className="rounded-lg p-0">
            <h3 className="text-xl font-semibold mb-4">Aperçu du CR</h3>
            <div 
              className="bg-gray-100 p-4 rounded-md whitespace-pre-wrap font-calibri text-base"
              contentEditable={true}
              onBlur={(e) => setEditableCR(e.target.innerHTML)}
              dangerouslySetInnerHTML={{ __html: editableCR }}
            />
          </div>
          <button 
            onClick={handleSave}
            className="mt-4 w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuestionnaireCRPage;