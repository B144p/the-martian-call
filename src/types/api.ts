export type ContinentId = 'na' | 'sa' | 'eu' | 'af' | 'as' | 'oc';

export type Direction = 0 | 30 | 60 | 90 | 120 | 150 | 180 | 210 | 240 | 270 | 300 | 330;

export type MessageStatus = 'queued' | 'transmitting' | 'sent' | 'interrupted';

export interface User {
  id: string;
  callsign: string;
  continent_id: ContinentId;
  antenna_direction: Direction;
  is_transmitting: boolean;
  last_seen_at: string;
}

export interface Message {
  id: string;
  content: string;
  hex_sequence: string;
  status: MessageStatus;
  chars_sent: number;
  transmission_started_at: string | null;
  transmission_ends_at: string | null;
}

export interface ApiError {
  code: string;
  message: string;
}

export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
  meta: Record<string, unknown>;
}

export interface SignalEntry {
  id: string;
  sender_callsign: string;
  sender_continent: ContinentId;
  sender_direction: Direction;
  content: string;
  transmitted_at: string;
  is_interrupted: boolean;
}

export interface MissedSignal {
  id: string;
  sender_continent: ContinentId;
  sender_direction: Direction;
  transmitted_at: string;
}

export interface StatsResponse {
  online_count: number;
  total_users: number;
  online_continents: ContinentId[];
}
