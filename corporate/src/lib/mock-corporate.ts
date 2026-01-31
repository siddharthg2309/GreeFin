export const MOCK_CORPORATE_ID = '00000000-0000-0000-0000-000000000100';

export const mockCorporate = {
  id: MOCK_CORPORATE_ID,
  name: 'Tata Green Initiative',
  email: 'green@tata.com',
  companyName: 'Tata Power',
  sector: 'Energy',
  companyLogo: null,
};

export function getCurrentCorporateId(): string {
  return MOCK_CORPORATE_ID;
}

