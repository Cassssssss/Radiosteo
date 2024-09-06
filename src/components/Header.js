import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { Moon, Sun, Menu, X } from 'lucide-react';

const HeaderWrapper = styled.header`
  background-color: ${props => props.theme.headerBackground};
  color: ${props => props.theme.headerText};
  padding: 1rem 0;
  width: 100%;
  transition: background-color 0.3s ease, color 0.3s ease;
`;

const HeaderContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 2500px;
  width: 100%;
  margin: 0 auto;
  padding: 0 2rem;
`;

const Logo = styled(Link)`
  font-size: 1.5rem;
  font-weight: bold;
  color: ${props => props.theme.headerText};
  text-decoration: none;
`;

const Nav = styled.nav`
  display: flex;
  gap: 1rem;
  align-items: center;
`;

const NavLink = styled(Link)`
  color: ${props => props.theme.headerText};
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;

const ThemeToggle = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.headerText};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const CenterTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: bold;
  color: ${props => props.theme.headerText};
  margin: 0;
`;

const MenuButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.headerText};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const MenuDropdown = styled.div`
  position: absolute;
  right: 2rem;
  top: 4rem;
  background-color: ${props => props.theme.headerBackground};
  border: 1px solid ${props => props.theme.headerText};
  border-radius: 4px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  z-index: 1000;
`;

const UserName = styled.span`
  color: ${props => props.theme.headerText};
  margin-right: 1rem;
`;

const LogoutButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.headerText};
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
`;

function Header({ isDarkMode, toggleDarkMode, user, onLogout }) {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return "Accueil";
      case '/questionnaires':
        return "Liste des questionnaires";
      case '/create':
        return "Création de questionnaire";
      case '/cases':
        return "Editeur cas";
      case '/cases-list':
        return "Cas";
      default:
        if (location.pathname.startsWith('/edit/')) return "Modification de questionnaire";
        if (location.pathname.startsWith('/use/')) return "Utilisation du questionnaire";
        if (location.pathname.startsWith('/cr/')) return "Compte-rendu du questionnaire";
        if (location.pathname.startsWith('/radiology-viewer/')) return "Visualiseur";
        return "";
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(prevState => !prevState);
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef]);

  return (
    <HeaderWrapper>
      <HeaderContent>
        <Logo to="/">RIFIM</Logo>
        <CenterTitle id="header-title">{getPageTitle()}</CenterTitle>
        <Nav>
          {user && (
            <>
              <UserName>{user.username}</UserName>
              <LogoutButton onClick={onLogout}>Déconnexion</LogoutButton>
              <div ref={menuRef}>
                <MenuButton onClick={toggleMenu}>
                  {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </MenuButton>
                {isMenuOpen && (
                  <MenuDropdown>
                    <NavLink to="/" onClick={() => setIsMenuOpen(false)}>Accueil</NavLink>
                    <NavLink to="/questionnaires" onClick={() => setIsMenuOpen(false)}>Questionnaires</NavLink>
                    <NavLink to="/cases" onClick={() => setIsMenuOpen(false)}>Editeur cas</NavLink>
                    <NavLink to="/cases-list" onClick={() => setIsMenuOpen(false)}>Cas</NavLink>
                  </MenuDropdown>
                )}
              </div>
            </>
          )}
          <ThemeToggle onClick={toggleDarkMode}>
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </ThemeToggle>
        </Nav>
      </HeaderContent>
    </HeaderWrapper>
  );
}

export default Header;
