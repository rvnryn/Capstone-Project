import { loadingSetter } from "./loadingSetter";

export const loadingHandler = {
  start: () => loadingSetter(true),
  stop: () => loadingSetter(false),
};
