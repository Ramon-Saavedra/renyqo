export interface OnceCache<T> {
  load: () => Promise<T>;
  set: (value: T) => void;
  invalidate: () => void;
}

export function createOnceCache<T>(loader: () => Promise<T>): OnceCache<T> {
  let cached: { value: T } | null = null;
  let inFlight: Promise<T> | null = null;
  let generation = 0;

  return {
    load: () => {
      if (cached) return Promise.resolve(cached.value);

      if (!inFlight) {
        const requestGeneration = generation;
        const request = loader()
          .then((value) => {
            if (requestGeneration === generation) cached = { value };
            return value;
          })
          .finally(() => {
            if (inFlight === request) inFlight = null;
          });
        inFlight = request;
      }

      return inFlight;
    },
    set: (value: T) => {
      generation += 1;
      cached = { value };
      inFlight = null;
    },
    invalidate: () => {
      generation += 1;
      cached = null;
      inFlight = null;
    },
  };
}
