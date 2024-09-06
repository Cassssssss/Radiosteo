import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import axios from '../utils/axiosConfig';

const ListContainer = styled.div`
  background-color: ${props => props.theme.card};
  color: ${props => props.theme.text};
  padding: 2rem;
  border-radius: 8px;
`;

const QuestionnaireItem = styled.li`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  border-bottom: 1px solid ${props => props.theme.border};
`;

const QuestionnaireTitle = styled.span`
  color: ${props => props.theme.text};
  font-size: 1.1rem;
`;

const ActionButton = styled.button`
  background-color: ${props => props.theme.primary};
  color: ${props => props.theme.buttonText};
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-left: 0.5rem;
  
  &:hover {
    background-color: ${props => props.theme.secondary};
  }
`;

function QuestionnaireListPage() {
  const [questionnaires, setQuestionnaires] = useState([]);
  const [deletedQuestionnaires, setDeletedQuestionnaires] = useState([]);

  const fetchQuestionnaires = useCallback(async () => {
    try {
      const response = await axios.get('/questionnaires');
      setQuestionnaires(response.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des questionnaires:', error);
    }
  }, []);

  useEffect(() => {
    fetchQuestionnaires();
    // Update the header title
    const headerTitle = document.getElementById('header-title');
    if (headerTitle) {
      headerTitle.textContent = 'Liste des questionnaires';
    }
  }, [fetchQuestionnaires]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'z') {
        undoDelete();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [deletedQuestionnaires]);

  const handleDelete = useCallback(async (id) => {
    const questionnaireToDelete = questionnaires.find(q => q._id === id);
    const isConfirmed = window.confirm(`Êtes-vous sûr de vouloir supprimer le questionnaire "${questionnaireToDelete.title}" ? Cette action peut être annulée avec Cmd+Z (ou Ctrl+Z).`);
    
    if (isConfirmed) {
      try {
        await axios.delete(`/questionnaires/${id}`);
        setQuestionnaires(prevQuestionnaires => prevQuestionnaires.filter(q => q._id !== id));
        setDeletedQuestionnaires(prevDeleted => [...prevDeleted, questionnaireToDelete]);
      } catch (error) {
        console.error('Erreur lors de la suppression du questionnaire:', error);
      }
    }
  }, [questionnaires]);

  const undoDelete = useCallback(async () => {
    if (deletedQuestionnaires.length > 0) {
      const lastDeleted = deletedQuestionnaires[deletedQuestionnaires.length - 1];
      try {
        await axios.post('/questionnaires', lastDeleted);
        await fetchQuestionnaires();
        setDeletedQuestionnaires(prevDeleted => prevDeleted.slice(0, -1));
      } catch (error) {
        console.error('Erreur lors de la restauration du questionnaire:', error);
      }
    }
  }, [deletedQuestionnaires, fetchQuestionnaires]);

  return (
    <ListContainer>
      <ul>
        {questionnaires.map((questionnaire) => (
          <QuestionnaireItem key={questionnaire._id}>
            <QuestionnaireTitle>{questionnaire.title}</QuestionnaireTitle>
            <div>
              <ActionButton as={Link} to={`/use/${questionnaire._id}`}>USE</ActionButton>
              <ActionButton as={Link} to={`/edit/${questionnaire._id}`}>MODIFIER</ActionButton>
              <ActionButton as={Link} to={`/cr/${questionnaire._id}`}>CR</ActionButton>
              <ActionButton onClick={() => handleDelete(questionnaire._id)}>SUPPRIMER</ActionButton>
            </div>
          </QuestionnaireItem>
        ))}
      </ul>
      <ActionButton as={Link} to="/create" className="mt-6">
        CRÉER UN NOUVEAU QUESTIONNAIRE
      </ActionButton>
    </ListContainer>
  );
}

export default QuestionnaireListPage;