"use client";

import { useEffect, useState } from "react";

const ACTIVATION_OFFSET_PX = 200;

export function useActiveStepFromScroll<Id extends string>(
  stepIds: readonly [Id, ...Id[]],
): Id {
  const [activeId, setActiveId] = useState<Id>(stepIds[0]);

  useEffect(() => {
    const compute = () => {
      let current: Id = stepIds[0];
      for (const id of stepIds) {
        const el = document.getElementById(id);
        if (!el) continue;
        const top = el.getBoundingClientRect().top;
        if (top < ACTIVATION_OFFSET_PX) current = id;
      }
      setActiveId(current);
    };
    compute();
    window.addEventListener("scroll", compute, { passive: true });
    return () => window.removeEventListener("scroll", compute);
  }, [stepIds]);

  return activeId;
}
