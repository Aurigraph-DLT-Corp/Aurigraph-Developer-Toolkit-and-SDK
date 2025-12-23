export interface Token {
  symbol: string;
  name: string;
  contractAddress: string;
  totalSupply: number;
  decimals: number;
  status: 'active' | 'paused' | 'inactive';
  owner: string;
}

export const getTokens = async (): Promise<Token[]> => {
  const response = await fetch('/api/v11/tokens/manage');
  if (!response.ok) throw new Error('Failed to fetch tokens');
  return response.json();
};

export const createToken = async (token: Omit<Token, 'status' | 'owner'>): Promise<Token> => {
  const response = await fetch('/api/v11/tokens/manage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(token),
  });
  if (!response.ok) throw new Error('Failed to create token');
  return response.json();
};

export const updateToken = async (symbol: string, updates: Partial<Token>): Promise<Token> => {
  const response = await fetch(`/api/v11/tokens/manage/${symbol}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!response.ok) throw new Error('Failed to update token');
  return response.json();
};
