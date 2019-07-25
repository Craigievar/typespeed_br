// @flow

import React from 'react';
import './animations.css';

const {useState} = React;

type Props = {
  children: React$Node,
  animation: 'pulse' | 'bounce' | 'rubberBand' | 'wobble' | 'flip' | 'hinge'
};

function AnimatedText({children, animation}: Props) {
  return (
    <div class={`text animated ${animation}`}>
      {children}
    </div>
  );
}

export default AnimatedText;
