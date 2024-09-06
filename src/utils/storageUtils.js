const STORAGE_KEY = 'creationq_questionnaires';

export const saveQuestionnaire = (questionnaire) => {
  const existingQuestionnaires = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  const index = existingQuestionnaires.findIndex(q => q.id === questionnaire.id);
  
  if (index !== -1) {
    existingQuestionnaires[index] = questionnaire;
  } else {
    existingQuestionnaires.push(questionnaire);
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existingQuestionnaires));
  console.log("Saved questionnaire:", questionnaire);
};

export const getQuestionnaires = () => {
  const questionnaires = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  console.log("Retrieved all questionnaires:", questionnaires);
  return questionnaires;
};

export const getQuestionnaire = (id) => {
  const questionnaires = getQuestionnaires();
  const questionnaire = questionnaires.find(q => q.id === id);
  console.log("Retrieved questionnaire by id:", id, questionnaire);
  return questionnaire;
};

export const deleteQuestionnaire = (questionnaireId) => {
  const existingQuestionnaires = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  const updatedQuestionnaires = existingQuestionnaires.filter(q => q.id !== questionnaireId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedQuestionnaires));
  console.log("Deleted questionnaire:", questionnaireId);
};