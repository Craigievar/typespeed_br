// @flow

import React, { useState, useEffect, useCallback, useRef } from 'react';

function useAnimation(
  animationSelector: () => ?string,
  animationTime: number,
  deps: Array<any>
): ?string {
  const [animation, setAnimation] = useState<?string>(animationSelector());
  const animationTimerRef = useRef<number>(0);

  useEffect(() => {
    console.log('using effect');
    if (Date.now() - animationTime < animationTimerRef.current) {
      setAnimation(null);
      setTimeout(() => {
        setAnimation(animationSelector());
      });
    } else {
      setAnimation(animationSelector());
    }

    animationTimerRef.current = Date.now();

    const timeoutID = setTimeout(() => {
      setAnimation(null);
    }, animationTime);

    return () => {
      clearTimeout(timeoutID);
    };
  }, deps);

  return animation;
}

export default useAnimation;
