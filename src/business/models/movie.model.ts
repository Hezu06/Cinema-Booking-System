export const MovieStatus = {
  COMING_SOON: "COMING_SOON",
  NOW_SHOWING: "NOW_SHOWING",
  ENDED: "ENDED",
} as const;

export type MovieStatus = typeof MovieStatus[keyof typeof MovieStatus];  

/*
  - Use 'export const Status = {...} as const' instead of 
  'export enum Status = {...}' to avoid collision with Prisma Enum
  in .repository.ts.
  - However, do not import Prisma Enum in .repository.ts for Clean Architecture
  (Decouple domain models from Prisma).
  - Do not use string union (type union) 'export type Status = "A" | "B" | "C" instead of 
  'export const Status = {...} as const' because TypeScript types disappear entirely at build time, 
  whereas z.enum() requires actual JavaScript values present at runtime to validate input.
*/

export interface Movie {
  id: string,
  title: string,
  description: string,
  durationMinutes: number, // find a way to change to int later
  genre: string,
  releaseDate: Date,
  posterUrl: string,
  status: MovieStatus
}