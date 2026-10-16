import { useCallback, useEffect, useRef, useState } from "react";
import { setApplicantReplies } from "../api/conversation";
interface RequestState {
  applicationId: string;
  pending: boolean;
  error: string | null;
}
export function useApplicantReplyPermission(
  applicationId: string,
  refresh: () => void,
) {
  const [state, setState] = useState<RequestState>({
    applicationId,
    pending: false,
    error: null,
  });
  const generation = useRef(0);
  const lock = useRef<string | null>(null);
  useEffect(() => {
    generation.current += 1;
    return () => {
      generation.current += 1;
    };
  }, [applicationId]);
  const setEnabled = useCallback(
    async (enabled: boolean) => {
      if (lock.current === applicationId) return;
      lock.current = applicationId;
      const request = generation.current;
      setState({ applicationId, pending: true, error: null });
      let error: string | null = null;
      try {
        await setApplicantReplies(applicationId, enabled);
      } catch {
        error =
          "Die Freigabe konnte nicht aktualisiert werden. Bitte prüfe den aktuellen Stand.";
      } finally {
        if (generation.current === request) {
          lock.current = null;
          setState({ applicationId, pending: false, error });
          refresh();
        }
      }
    },
    [applicationId, refresh],
  );
  return {
    pending: state.applicationId === applicationId && state.pending,
    error: state.applicationId === applicationId ? state.error : null,
    setEnabled,
  };
}
