let setLoadingFn: ((state: boolean) => void) | null = null;

export const registerLoadingSetter = (fn: (state: boolean) => void) => {
  setLoadingFn = fn;
};

export const loadingSetter = (state: boolean) => {
  if (setLoadingFn) {
    setLoadingFn(state);
  }
};
