// src/utils/unitParser.ts
export function parseStorageToMB(storageStr: string): number {
  // Remove "SSD", "NVMe", "HDD", etc.
  const cleaned = storageStr.replace(/\s*(SSD|NVMe|HDD|SATA)/i, '').trim();
  
  const match = cleaned.match(/^(\d+(?:\.\d+)?)\s*(GB|MB|TB|KB)?$/i);
  if (!match) {
    console.warn(`Could not parse storage string: "${storageStr}", defaulting to 1024 MB`);
    return 1024; // safe default: 1 GB
  }

  const value = parseFloat(match[1]);
  const unit = (match[2] || 'GB').toUpperCase();

  switch (unit) {
    case 'TB':
      return value * 1024 * 1024; // 1 TB = 1,048,576 MB
    case 'GB':
      return value * 1024;
    case 'MB':
      return value;
    default:
      return value * 1024; // fallback to GB
  }
}