import React from 'react';
import styled from 'styled-components';

const ErrorContainer = styled.div`
  color: red;
  padding: 10px;
  margin: 10px 0;
  border: 1px solid red;
  border-radius: 4px;
  background-color: #ffebee;
`;

const ErrorMessage = ({ children }) => (
  <ErrorContainer>{children}</ErrorContainer>
);

export default ErrorMessage;