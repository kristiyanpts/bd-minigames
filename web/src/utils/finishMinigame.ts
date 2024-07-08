import { fetchNui } from "./fetchNui";

export const finishMinigame = async (result: boolean) => {
  return await fetchNui("finishedMinigame", result, true);
};
