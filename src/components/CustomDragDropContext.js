import React from 'react';
import { DragDropContext } from 'react-beautiful-dnd';

const CustomDragDropContext = ({ children, ...props }) => {
  return <DragDropContext {...props}>{children}</DragDropContext>;
};

export default CustomDragDropContext;
