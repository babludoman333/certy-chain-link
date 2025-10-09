// Utility functions for generating blockchain-related data

export const generateRandomHash = (): string => {
  const chars = '0123456789abcdef';
  let hash = '';
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
};

export const generateRandomUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const generateRandomTimestamp = (): number => {
  // Generate a timestamp within the last 2 years
  const now = Date.now();
  const twoYearsAgo = now - (2 * 365 * 24 * 60 * 60 * 1000);
  return Math.floor(Math.random() * (now - twoYearsAgo) + twoYearsAgo);
};

export const generateBlockchainData = () => {
  return {
    hash: generateRandomHash(),
    issuerId: generateRandomUUID(),
    timestamp: generateRandomTimestamp(),
    txnId: `TXN-${Date.now()}-${generateRandomHash().substring(0, 6)}`
  };
};
