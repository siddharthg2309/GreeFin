// Hardcoded user for hackathon demo (no auth required)
export const MOCK_USER_ID = '00000000-0000-0000-0000-000000000001';

export const mockUser = {
  id: MOCK_USER_ID,
  name: 'Pragit R V',
  email: 'pragit@greenfin.com',
  profilePic: null,
};

export function getCurrentUserId(): string {
  return MOCK_USER_ID;
}

