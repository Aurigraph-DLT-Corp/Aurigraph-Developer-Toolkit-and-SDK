export interface RWAAsset {
  id: string;
  name: string;
  type: string;
  value: number;
  status: 'active' | 'inactive' | 'pending';
  owner: string;
  lastUpdated: number;
}

export const getRWAAssets = async (): Promise<RWAAsset[]> => {
  const response = await fetch('/api/v11/rwa/portfolio');
  if (!response.ok) throw new Error('Failed to fetch RWA assets');
  return response.json();
};

export const getAssetById = async (id: string): Promise<RWAAsset> => {
  const assets = await getRWAAssets();
  const asset = assets.find(a => a.id === id);
  if (!asset) throw new Error(`Asset ${id} not found`);
  return asset;
};
