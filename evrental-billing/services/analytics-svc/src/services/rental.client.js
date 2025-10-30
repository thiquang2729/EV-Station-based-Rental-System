import axios from 'axios';

const rentalBaseUrl = process.env.SERVICE_RENTAL_BASE_URL || 'http://rental-svc:8081';

export async function getBookingsByStation(stationId, from, to) {
  try {
    const response = await axios.get(`${rentalBaseUrl}/api/v1/bookings`, {
      params: { stationId, from, to },
      timeout: 5000
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch bookings for station ${stationId}:`, error.message);
    return { data: [] };
  }
}

export async function getStationCapacity(stationId) {
  try {
    const response = await axios.get(`${rentalBaseUrl}/api/v1/stations/${stationId}/capacity`, {
      timeout: 5000
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch capacity for station ${stationId}:`, error.message);
    return { capacity: 0 };
  }
}
