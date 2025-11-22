/**
 * Generate short, readable IDs for stations
 * Format: ST-XXXXXX (6 random alphanumeric characters)
 * Example: ST-A3B9C2, ST-X7Y2Z1
 */

function generateShortId(prefix = 'ST') {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars: 0, O, I, 1
  const length = 6;
  let result = prefix + '-';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

/**
 * Generate sequential ID for stations (if you prefer sequential)
 * Format: ST001, ST002, ST003...
 * Note: Requires checking existing IDs in database
 */
async function generateSequentialId(prisma, prefix = 'ST', padLength = 3) {
  // Get the highest number from existing stations
  const stations = await prisma.station.findMany({
    where: {
      id: {
        startsWith: prefix
      }
    },
    orderBy: {
      id: 'desc'
    },
    take: 1
  });

  let nextNumber = 1;
  if (stations.length > 0) {
    const lastId = stations[0].id;
    const match = lastId.match(new RegExp(`^${prefix}(\\d+)$`));
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }

  return `${prefix}${String(nextNumber).padStart(padLength, '0')}`;
}

module.exports = {
  generateShortId,
  generateSequentialId
};

