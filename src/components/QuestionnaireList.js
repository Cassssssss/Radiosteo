import React, { useState, useEffect } from 'react';
import { getQuestionnaires, deleteQuestionnaire } from '../utils/storageUtils';
import { Link } from 'react-router-dom';

function QuestionnaireList() {
  const [questionnaires, setQuestionnaires] = useState([]);

  useEffect(() => {
    setQuestionnaires(getQuestionnaires());
  }, []);

  const handleDelete = (id) => {
    deleteQuestionnaire(id);
    setQuestionnaires(getQuestionnaires());
  };

  return (
    <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
      <h2 className="text-2xl font-bold mb-4">Liste des questionnaires</h2>
      <ul className="divide-y divide-gray-200">
        {questionnaires.map((questionnaire) => (
          <li key={questionnaire.id} className="py-4 flex justify-between items-center">
            <span className="text-lg">{questionnaire.title}</span>
            <div>
              <Link 
                to={`/use/${questionnaire.id}`}
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mr-2"
              >
                Use
              </Link>
              <Link 
                to={`/edit/${questionnaire.id}`}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mr-2"
              >
                Modifier
              </Link>
              <button 
                onClick={() => handleDelete(questionnaire.id)}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Supprimer
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default QuestionnaireList;