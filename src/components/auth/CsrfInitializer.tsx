"use client";

import { useEffect } from "react";
import { getCsrfToken } from "@/lib/api/csrf";

export function CsrfInitializer() {
  useEffect(() => {
    void getCsrfToken().catch(() => undefined);
  }, []);

  return null;
}
