import type {
  Cinema,
} from "../models/cinema.model.js";

export interface CinemaRepository {
  findAll(): Promise<Cinema[]>;

  findById(
    id: string
  ): Promise<Cinema | null>;

  create(
    data: CreateCinemaData
  ): Promise<Cinema>;

  update(
    id: string,
    data: UpdateCinemaData
  ): Promise<Cinema | null>;

  delete(
    id: string
  ): Promise<Cinema | null>;

  hasRooms(
    id: string
  ): Promise<boolean>;
  /*
  That exists because your Cinema service must prevent deletion when the Cinema still has Rooms.
  The project docs explicitly say CinemaService must ensure 
  operations do not break the Cinema–Room relationship.
  */
}

export interface CreateCinemaData {
  name: string;
  address: string;
  city: string;
}

export interface UpdateCinemaData {
  name?: string | undefined;
  address?: string | undefined;
  city?: string | undefined;
}