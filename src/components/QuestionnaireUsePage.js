import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from '../utils/axiosConfig';
import QuestionnairePreview from './QuestionnairePreview';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { X } from 'lucide-react';

const QuestionnaireUsePage = () => {
  const { id } = useParams();
  const [questionnaire, setQuestionnaire] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [crTexts, setCRTexts] = useState({});
  const [freeTexts, setFreeTexts] = useState({});
  const [insertedImages, setInsertedImages] = useState([]);
  const [copySuccess, setCopySuccess] = useState('');
  const [hiddenQuestions, setHiddenQuestions] = useState({});
  const [editableCR, setEditableCR] = useState('');
  const crRef = useRef(null);

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
    const generatedCR = generateCR().join('\n');
    setEditableCR(generatedCR);
  }, [questionnaire, selectedOptions, crTexts, freeTexts]);

  const generateCR = () => {
    let cr = [];
    
    const addContent = (content, isTitle = false) => {
      if (isTitle || content.startsWith('<strong>') || content.startsWith('<u>')) {
        cr.push(''); // Add an empty line before titles or bold/underlined text
      }
      cr.push(content.trim());
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
          const techniqueResponses = selectedIndices.map(index => question.options[index].text);
          if (techniqueResponses.length > 0) {
            addContent('<strong>TECHNIQUE :</strong>', true);
            addContent(techniqueResponses.join(', ') + '.');
          }
        } else {
          const selectedIndices = selectedOptions[question.id] || [];
          selectedIndices.forEach(index => {
            const option = question.options[index];
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
    
    if (questionnaire) {
      generateCRRecursive(questionnaire.questions);
    }
    return cr;
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
      // Afficher un message de succès
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };


  const handleImageInsert = (image) => {
    setInsertedImages(prev => [...prev, image.src]);
  };

  const handleImageRemove = (index) => {
    setInsertedImages(prev => prev.filter((_, i) => i !== index));
  };

  const resizeImage = (src, maxWidth, maxHeight) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }
        
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve({ 
          dataUrl: canvas.toDataURL(),
          width: width,
          height: height
        });
      };
      img.onerror = reject;
      img.src = src;
    });
  };

  const copyToClipboard = async () => {
    try {
      const formattedContent = editableCR.split('\n').map(line => 
        line.startsWith('<strong>') || line.startsWith('<u>') ? `<p><br>${line}</p>` : `<p>${line}</p>`
      ).join('');

      const resizedImages = await Promise.all(
        insertedImages.map(src => resizeImage(src, 200, 200))
      );

      const htmlContent = `
        <html>
          <head>
            <style>
              body { font-family: Calibri, sans-serif; font-size: 12pt; }
              p { margin: 0; padding: 0; }
              .image-container { display: inline-block; margin: 10px 10px 0 0; vertical-align: top; }
              .image-container img { max-width: 200px; max-height: 200px; }
              .image-row { white-space: nowrap; overflow: hidden; }
            </style>
          </head>
          <body>
            ${formattedContent}
            <div class="image-row">
              ${resizedImages.map(img => `
                <div class="image-container">
                  <img src="${img.dataUrl}" alt="Image insérée" style="width: ${img.width}px; height: ${img.height}px;" />
                </div>
              `).join('')}
            </div>
          </body>
        </html>
      `;

      const blob = new Blob([htmlContent], { type: 'text/html' });
      const clipboardItem = new ClipboardItem({ 'text/html': blob });
      await navigator.clipboard.write([clipboardItem]);
      
      setCopySuccess('Copié !');
      setTimeout(() => setCopySuccess(''), 2000);
    } catch (err) {
      console.error('Erreur lors de la copie:', err);
      setCopySuccess('Échec de la copie');
    }
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
            <div className="bg-white dark:bg-gray-900 p-4 rounded-md">
              <QuestionnairePreview 
                questions={questionnaire.questions}
                selectedOptions={selectedOptions}
                setSelectedOptions={handleOptionChange}
                crTexts={crTexts}
                setCRTexts={setCRTexts}
                freeTexts={freeTexts}
                onFreeTextChange={handleFreeTextChange}
                showCRFields={false}
                onImageInsert={handleImageInsert}
                hiddenQuestions={hiddenQuestions}
                toggleQuestionVisibility={() => {}}
              />
            </div>
          </div>
        </div>
        <div className="w-full lg:w-2/4">
          <div className="rounded-lg p-0">
            <h3 className="text-xl font-semibold mb-4">Aperçu du CR</h3>
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-md whitespace-pre-wrap font-calibri text-base">
              <div
                ref={crRef}
                contentEditable={true}
                onBlur={(e) => setEditableCR(e.target.innerHTML)}
                dangerouslySetInnerHTML={{ __html: editableCR }}
                className="focus:outline-none"
              />
              {insertedImages.length > 0 && <br />}
              <div className="flex flex-wrap">
                {insertedImages.map((src, index) => (
                  <div key={index} className="relative" style={{maxWidth: '200px', maxHeight: '200px', margin: '0 10px 10px 0'}}>
                    <img 
                      src={src} 
                      alt={`Image insérée ${index + 1}`} 
                      style={{
                        maxWidth: '100%', 
                        maxHeight: '100%', 
                        objectFit: 'contain',
                        backgroundColor: '#f0f0f0',
                      }} 
                    />
                    <button 
                      onClick={() => handleImageRemove(index)}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      title="Supprimer l'image"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 flex justify-between items-center">
              <button 
                onClick={copyToClipboard}
                className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
              >
                Copier
              </button>
              <button 
                onClick={() => setEditableCR(generateCR().join('\n'))}
                className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition-colors"
              >
                Régénérer CR
              </button>
              {copySuccess && <span className="text-green-600">{copySuccess}</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionnaireUsePage;