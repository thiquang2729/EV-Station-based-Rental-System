// CSV utils are imported dynamically in the function when needed

export async function getStationsReport(req, res, next) {
  // Set timeout để tránh request bị treo
  const timeout = setTimeout(() => {
    if (!res.headersSent) {
      console.warn('[getStationsReport] Request timeout, returning empty data');
      res.status(200).json({ success: true, data: [] });
    }
  }, 10000); // 10 seconds timeout

  try {
    const { date, format } = req.query;
    console.log('[getStationsReport] Request received:', { date, format, user: req.user?.id });
    
    // Import rental hours repo
    const rentalHoursRepo = await import('../repositories/rental-hours.repo.js');
    
    // Get rental hours by date
    const rentalHours = await Promise.race([
      rentalHoursRepo.getRentalHoursByDate(date),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Query timeout')), 5000))
    ]).catch(err => {
      console.error('[getStationsReport] Error querying rental hours:', err.message);
      return [];
    });
    
    console.log('[getStationsReport] Returning data:', { count: rentalHours.length });
    
    clearTimeout(timeout);
    
    if (format === 'csv') {
      const { generateCSV, setCSVHeaders } = await import('../utils/csv.js');
      const headers = ['hour', 'rentalHours', 'bookingCount'];
      const csv = generateCSV(rentalHours, headers);
      setCSVHeaders(res, `rental-hours-${date}.csv`);
      return res.send(csv);
    }
    
    res.json({ success: true, data: rentalHours });
  } catch (err) { 
    clearTimeout(timeout);
    console.error('[getStationsReport] Unexpected error:', err);
    console.error('[getStationsReport] Error stack:', err.stack);
    // Return empty data instead of crashing
    if (!res.headersSent) {
      res.status(200).json({ success: true, data: [] });
    }
  }
}
