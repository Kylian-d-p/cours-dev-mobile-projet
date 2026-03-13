export type DreamType = "nightmare" | "dream" | "neutral";

export interface Dream {
  id: string;
  dreamText: string;
  isLucidDream: boolean;
  dreamType: DreamType;
  keywords: { id: string; label: string }[];
  date: string;
  emotionalState: "happy" | "sad" | "anxious" | "neutral" | "angry";
  emotionalIntensity: number; // 1 to 10
  place: string;
  clarity: number; // 1 to 10
  sleepQuality: number; // 1 to 10
  characters: {id: string; name: string}[];
  personnalSignificance: string;
}
