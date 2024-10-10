import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from '../utils/axiosConfig';
import { Star, ChevronDown, Eye, EyeOff } from 'lucide-react';
import styled from 'styled-components';

const PageContainer = styled.div`
  padding: 2rem;
  background-color: ${props => props.theme.background};
  color: ${props => props.theme.text};
  min-height: 100vh;
`;

const Title = styled.h1`
  font-size: 2rem;
  margin-bottom: 1rem;
  color: ${props => props.theme.primary};
  text-align: center;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.75rem;
  margin-bottom: 1rem;
  border-radius: 8px;
  border: 1px solid ${props => props.theme.border};
  background-color: ${props => props.theme.inputBackground};
  color: ${props => props.theme.text};
`;

const FilterContainer = styled.div`
  display: flex;
  justify-content: center; /* Centre les boutons horizontalement */
  align-items: center;
  gap: 1rem; /* Ajoute de l'espace entre les boutons */
  margin-bottom: 4rem;
`;

const DifficultyFilter = styled.div`
  position: relative;
`;

const DifficultyButton = styled.button`
  padding: 0.75rem;
  background-color: ${props => props.theme.primary};
  color: ${props => props.theme.buttonText};
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: bold;
`;

const DifficultyDropdown = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  background-color: ${props => props.theme.card};
  border: 1px solid ${props => props.theme.border};
  border-radius: 8px;
  padding: 0.75rem;
  z-index: 10;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const DifficultyOption = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  color: ${props => props.theme.text};
`;

const SpoilerButton = styled.button`
  padding: 0.75rem;
  background-color: ${props => props.theme.primary};
  color: ${props => props.theme.buttonText};
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: bold;
`;

const CasesList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
`;

const CaseCard = styled(Link)`
  display: flex;
  flex-direction: column;
  padding: 1rem;
  border: 1px solid ${props => props.theme.border};
  border-radius: 8px;
  text-decoration: none;
  color: ${props => props.theme.text};
  background-color: ${props => props.theme.card};
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-5px);
  }
`;

const CaseImage = styled.img`
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 8px;
  margin-bottom: 0.5rem;
`;

const CaseTitle = styled.h2`
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
  text-align: center;
`;

const StarRating = styled.div`
  display: flex;
  justify-content: center;
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const Tag = styled.span`
  background-color: ${props => props.theme.primary};
  color: ${props => props.theme.buttonText};
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
`;

const TagFilter = styled.div`
  position: relative;
`;

const TagButton = styled.button`
  padding: 0.75rem;
  background-color: ${props => props.theme.primary};
  color: ${props => props.theme.buttonText};
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: bold;
`;

const TagDropdown = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  background-color: ${props => props.theme.card};
  border: 1px solid ${props => props.theme.border};
  border-radius: 8px;
  padding: 0.75rem;
  z-index: 10;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-height: 200px;
  overflow-y: auto;
`;

const TagOption = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  color: ${props => props.theme.text};
`;

function CaseCardComponent({ cas, showSpoilers }) {
  return (
    <CaseCard to={`/radiology-viewer/${cas._id}`}>
      <CaseImage 
        src={cas.mainImage ? cas.mainImage : (cas.folders && cas.folders[0] && cas.folderMainImages && cas.folderMainImages[cas.folders[0]]) || '/images/default.jpg'}
        alt={cas.title}
        loading="lazy"
      />
      <CaseTitle>{showSpoilers ? cas.title : '?'}</CaseTitle>
      <StarRating>
        {[...Array(5)].map((_, index) => (
          <Star
            key={index}
            size={20}
            fill={index < cas.difficulty ? "gold" : "gray"}
            stroke={index < cas.difficulty ? "gold" : "gray"}
          />
        ))}
      </StarRating>
      <TagsContainer>
        {cas.tags && cas.tags.map(tag => (
          <Tag key={tag}>{tag}</Tag>
        ))}
      </TagsContainer>
    </CaseCard>
  );
}

function CasesListPage() {
  const [cases, setCases] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState([1,2,3,4,5]);
  const [showSpoilers, setShowSpoilers] = useState(false);
  const [showDifficultyDropdown, setShowDifficultyDropdown] = useState(false);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [tagFilter, setTagFilter] = useState([]);
  const [allTags, setAllTags] = useState([]);

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      const response = await axios.get('/cases');
      setCases(response.data);
      const tags = new Set(response.data.flatMap(cas => cas.tags || []));
      setAllTags(Array.from(tags));
    } catch (error) {
      console.error('Erreur lors de la récupération des cas:', error);
    }
  };

  const filteredCases = cases.filter(cas => 
    cas.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
    difficultyFilter.includes(cas.difficulty) &&
    (tagFilter.length === 0 || tagFilter.some(tag => cas.tags && cas.tags.includes(tag)))
  );

  const handleDifficultyChange = (difficulty) => {
    setDifficultyFilter(prev => 
      prev.includes(difficulty) 
        ? prev.filter(d => d !== difficulty)
        : [...prev, difficulty]
    );
  };

  const handleTagChange = (tag) => {
    setTagFilter(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  return (
    <PageContainer>
      <Title>Liste des cas</Title>
      
      <SearchInput
        type="text"
        placeholder="Rechercher un cas..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <FilterContainer>
        <DifficultyFilter>
          <DifficultyButton onClick={() => setShowDifficultyDropdown(!showDifficultyDropdown)}>
            Difficulté <ChevronDown size={16} />
          </DifficultyButton>
          {showDifficultyDropdown && (
            <DifficultyDropdown>
              {[1,2,3,4,5].map(difficulty => (
                <DifficultyOption key={difficulty}>
                  <input 
                    type="checkbox"
                    checked={difficultyFilter.includes(difficulty)}
                    onChange={() => handleDifficultyChange(difficulty)}
                  />
                  {difficulty} étoile{difficulty > 1 ? 's' : ''}
                </DifficultyOption>
              ))}
            </DifficultyDropdown>
          )}
        </DifficultyFilter>

        <TagFilter>
          <TagButton onClick={() => setShowTagDropdown(!showTagDropdown)}>
            Tags <ChevronDown size={16} />
          </TagButton>
          {showTagDropdown && (
            <TagDropdown>
              {allTags.map(tag => (
                <TagOption key={tag}>
                  <input 
                    type="checkbox"
                    checked={tagFilter.includes(tag)}
                    onChange={() => handleTagChange(tag)}
                  />
                  {tag}
                </TagOption>
              ))}
            </TagDropdown>
          )}
        </TagFilter>

        <SpoilerButton onClick={() => setShowSpoilers(!showSpoilers)}>
          {showSpoilers ? <EyeOff size={16} /> : <Eye size={16} />}
          Spoiler
        </SpoilerButton>
      </FilterContainer>

      <CasesList>
        {filteredCases.map((cas) => (
          <CaseCardComponent key={cas._id} cas={cas} showSpoilers={showSpoilers} />
        ))}
      </CasesList>
    </PageContainer>
  );
}

export default CasesListPage;