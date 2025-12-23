/**
 * BlockSearchService
 *
 * API Service for block search functionality
 * Endpoint: /api/v11/blockchain/blocks/search
 */

export interface BlockSearchResult {
  height: number;
  hash: string;
  validator: string;
  transactions: number;
  timestamp: number;
  size: number;
  gasUsed?: number;
}

/**
 * Search blocks by query
 * @param query - Search query (height, hash, or range)
 * @returns Promise<BlockSearchResult[]>
 */
export const searchBlocks = async (query: string): Promise<BlockSearchResult[]> => {
  try {
    const encodedQuery = encodeURIComponent(query);
    const response = await fetch(`/api/v11/blockchain/blocks/search?q=${encodedQuery}`);

    if (!response.ok) {
      throw new Error(`Search failed: ${response.status}`);
    }

    const data: BlockSearchResult[] = await response.json();
    return data;
  } catch (error) {
    console.error('Block search failed:', error);
    throw error;
  }
};

/**
 * Get block by height
 * @param height - Block height
 * @returns Promise<BlockSearchResult>
 */
export const getBlockByHeight = async (height: number): Promise<BlockSearchResult> => {
  return searchBlocks(`height:${height}`).then((results) => {
    if (results.length === 0) throw new Error(`Block ${height} not found`);
    return results[0];
  });
};

/**
 * Get block by hash
 * @param hash - Block hash
 * @returns Promise<BlockSearchResult>
 */
export const getBlockByHash = async (hash: string): Promise<BlockSearchResult> => {
  return searchBlocks(`hash:${hash}`).then((results) => {
    if (results.length === 0) throw new Error(`Block ${hash} not found`);
    return results[0];
  });
};
