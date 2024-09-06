import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import axios from '../utils/axiosConfig';
import styled, { ThemeContext } from 'styled-components';

const SheetContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background-color: ${props => props.theme.card};
  color: ${props => props.theme.text};
  box-shadow: 0 0 10px rgba(0,0,0,0.1);
  border-radius: 8px;
`;

const SheetTitle = styled.h1`
  color: ${props => props.theme.primary};
  text-align: center;
  margin-bottom: 20px;
  font-weight: bold;
`;

const SheetContent = styled.div`
  font-family: Arial, sans-serif;
  line-height: 1.6;

  h1, h2, h3, h4, h5, h6 {
    color: ${props => props.theme.primary};
    font-weight: bold;
  }

  h1 {
    font-size: 2em;
    margin-top: 0.67em;
    margin-bottom: 0.67em;
  }

  h2 {
    font-size: 1.5em;
    margin-top: 0.83em;
    margin-bottom: 0.83em;
  }

  h3 {
    font-size: 1.17em;
    margin-top: 1em;
    margin-bottom: 1em;
  }

  h4 {
    font-size: 1em;
    margin-top: 1.33em;
    margin-bottom: 1.33em;
  }

  h5 {
    font-size: 0.83em;
    margin-top: 1.67em;
    margin-bottom: 1.67em;
  }

  h6 {
    font-size: 0.67em;
    margin-top: 2.33em;
    margin-bottom: 2.33em;
  }

  strong {
    font-weight: bold;
  }

  em {
    font-style: italic;
  }

  u {
    text-decoration: underline;
  }

  img {
    max-width: 100%;
    height: auto;
  }

  table {
    border-collapse: collapse;
    width: 100%;
  }

  th, td {
    border: 1px solid ${props => props.theme.border};
    padding: 8px;
  }

  th {
    background-color: ${props => props.theme.secondary};
    color: ${props => props.theme.buttonText};
    font-weight: bold;
  }
`;

const SheetViewer = () => {
  const { caseId } = useParams();
  const [sheet, setSheet] = useState({ title: '', content: '' });
  const theme = useContext(ThemeContext);

  useEffect(() => {
    const fetchSheet = async () => {
      try {
        const response = await axios.get(`/cases/${caseId}/sheet`);
        setSheet(response.data);
      } catch (error) {
        console.error('Erreur lors de la récupération de la fiche:', error);
      }
    };

    fetchSheet();
  }, [caseId]);

  return (
    <SheetContainer theme={theme}>
      <SheetTitle>{sheet.title}</SheetTitle>
      <SheetContent 
        dangerouslySetInnerHTML={{ __html: sheet.content }} 
        theme={theme}
      />
    </SheetContainer>
  );
};

export default SheetViewer;