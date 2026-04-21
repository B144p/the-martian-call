import type { User, Message, SignalEntry, MissedSignal, StatsResponse } from '@/src/types/api';

export const mockUser: User = {
  id: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  callsign: 'W1AW',
  continent_id: 'na',
  antenna_direction: 90,
  is_transmitting: false,
  last_seen_at: '2026-04-21T12:00:00.000Z',
};

export const mockTransmittingUser: User = {
  ...mockUser,
  is_transmitting: true,
};

export const mockMessage: Message = {
  id: 'a3bb189e-8bf9-3888-9912-ace4e6543002',
  content: 'Greetings from the red planet',
  hex_sequence: '47 72 65 65 74 69 6E 67 73 20 66 72 6F 6D 20 74 68 65 20 72 65 64 20 70 6C 61 6E 65 74',
  status: 'transmitting',
  chars_sent: 10,
  transmission_started_at: new Date(Date.now() - 2000).toISOString(),
  transmission_ends_at: new Date(Date.now() + 12000).toISOString(),
};

export const mockSentMessage: Message = {
  ...mockMessage,
  status: 'sent',
  chars_sent: 29,
};

export const mockInterruptedMessage: Message = {
  ...mockMessage,
  status: 'interrupted',
};

export const mockSignalEntries: SignalEntry[] = [
  {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    sender_callsign: 'DL1ABC',
    sender_continent: 'eu',
    sender_direction: 270,
    content: 'Transmission from the old world. Copy?',
    transmitted_at: '2026-04-21T11:45:00.000Z',
    is_interrupted: false,
  },
  {
    id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    sender_callsign: 'VK2XYZ',
    sender_continent: 'oc',
    sender_direction: 0,
    content: 'Signal bearing north from Oceania.',
    transmitted_at: '2026-04-21T11:30:00.000Z',
    is_interrupted: false,
  },
  {
    id: '6ba7b811-9dad-11d1-80b4-00c04fd430c9',
    sender_callsign: 'JA1QXY',
    sender_continent: 'as',
    sender_direction: 60,
    content: 'Partial transmission—',
    transmitted_at: '2026-04-21T11:15:00.000Z',
    is_interrupted: true,
  },
];

export const mockMissedSignals: MissedSignal[] = [
  {
    id: 'b6f5a8d3-1c2e-4f7a-8b9c-0d1e2f3a4b5c',
    sender_continent: 'eu',
    sender_direction: 270,
    transmitted_at: '2026-04-21T10:00:00.000Z',
  },
  {
    id: 'c7a6b9e4-2d3f-4e8b-9c0d-1e2f3a4b5c6d',
    sender_continent: 'as',
    sender_direction: 90,
    transmitted_at: '2026-04-21T09:30:00.000Z',
  },
];

export const mockStats: StatsResponse = {
  online_count: 12,
  total_users: 248,
  online_continents: ['na', 'eu', 'as'],
};
