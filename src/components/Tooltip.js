import React from 'react';
import { Tooltip as ReactTooltip } from 'react-tooltip';

const Tooltip = ({ id, content, children }) => {
  return (
    <>
      <span data-tooltip-id={id}>{children}</span>
      <ReactTooltip id={id} place="top" effect="solid">
        {content}
      </ReactTooltip>
    </>
  );
};

export default Tooltip;
