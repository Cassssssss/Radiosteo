import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import axios from '../utils/axiosConfig';

const AuthContainer = styled.div`
  max-width: 300px;
  margin: 0 auto;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: ${props => props.theme.surface};
`;

const Input = styled.input`
  width: 100%;
  padding: 10px;
  margin-bottom: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
`;

const Button = styled.button`
  width: 100%;
  padding: 10px;
  background-color: ${props => props.theme.primary};
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background-color: ${props => props.theme.secondary};
  }
`;

const Auth = ({ onLogin }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        const response = await axios.post('/auth/login', { username, password });
        localStorage.setItem('token', response.data.token);
        onLogin(response.data.token, username);
        navigate('/'); // Redirection vers la page d'accueil après connexion
      } catch (error) {
        console.error('Erreur de connexion:', error.response ? error.response.data : error.message);
        // Affichez un message d'erreur à l'utilisateur ici
      }
    };
  
    return (
      <AuthContainer>
        <h2>{isLogin ? 'Connexion' : 'Inscription'}</h2>
        <form onSubmit={handleSubmit}>
          <Input
            type="text"
            placeholder="Nom d'utilisateur"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <Input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit">{isLogin ? 'Se connecter' : "S'inscrire"}</Button>
        </form>
        <p>
          {isLogin ? "Pas de compte ?" : "Déjà un compte ?"}
          <button onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? "S'inscrire" : "Se connecter"}
          </button>
        </p>
      </AuthContainer>
    );
};

export default Auth;