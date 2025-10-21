// frontend/auth-ui/src/components/StationMonitor.jsx
import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Button,
  Box,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import stationService from '../../services/stationService';

const StationMonitor = () => {
  const [stations, setStations] = useState([]);
  const [healthStatus, setHealthStatus] = useState({});
  const [kongStatus, setKongStatus] = useState(null);
  const [loadBalancingTest, setLoadBalancingTest] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
    // Auto refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [stationsData, healthData, kongData] = await Promise.all([
        stationService.getStations().catch(() => []),
        stationService.checkStationHealth().catch(() => ({})),
        stationService.getKongStatus().catch(() => null)
      ]);
      
      setStations(stationsData);
      setHealthStatus(healthData);
      setKongStatus(kongData);
    } catch (err) {
      setError('Failed to load station data');
      console.error('Station monitor error:', err);
    } finally {
      setLoading(false);
    }
  };

  const testLoadBalancing = async () => {
    try {
      setLoading(true);
      const results = await stationService.testLoadBalancing();
      setLoadBalancingTest(results);
    } catch (err) {
      setError('Failed to test load balancing');
      console.error('Load balancing test error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'up': return 'success';
      case 'down': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'up': return <CheckCircleIcon color="success" />;
      case 'down': return <ErrorIcon color="error" />;
      default: return <InfoIcon color="info" />;
    }
  };

  if (loading && !stations.length) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Kong API Gateway - Station Monitor
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<RefreshIcon />}
          onClick={fetchData}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Kong Gateway Status */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Kong Gateway Status
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Chip 
                    label={`Kong: ${kongStatus ? 'Connected' : 'Disconnected'}`}
                    color={kongStatus ? 'success' : 'error'}
                    icon={kongStatus ? <CheckCircleIcon /> : <ErrorIcon />}
                  />
                </Grid>
                <Grid item xs={6}>
                  <Chip 
                    label={`Load Balancing: Active`}
                    color="info"
                    icon={<InfoIcon />}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Service Health Status */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Station Service Health Status
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getStatusIcon(healthStatus.port1?.status)}
                    <Chip 
                      label={`Port 3001: ${healthStatus.port1?.status || 'unknown'}`}
                      color={getStatusColor(healthStatus.port1?.status)}
                    />
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getStatusIcon(healthStatus.port2?.status)}
                    <Chip 
                      label={`Port 3002: ${healthStatus.port2?.status || 'unknown'}`}
                      color={getStatusColor(healthStatus.port2?.status)}
                    />
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getStatusIcon(healthStatus.port3?.status)}
                    <Chip 
                      label={`Port 3003: ${healthStatus.port3?.status || 'unknown'}`}
                      color={getStatusColor(healthStatus.port3?.status)}
                    />
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Load Balancing Test */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Load Balancing Test
                </Typography>
                <Button 
                  variant="outlined" 
                  onClick={testLoadBalancing}
                  disabled={loading}
                >
                  Test Load Balancing
                </Button>
              </Box>
              
              {loadBalancingTest.length > 0 && (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Request #</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Response Time</TableCell>
                        <TableCell>Server</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {loadBalancingTest.map((test, index) => (
                        <TableRow key={index}>
                          <TableCell>{test.request}</TableCell>
                          <TableCell>
                            <Chip 
                              label={test.status}
                              color={test.status === 'success' ? 'success' : 'error'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{test.data?.responseTime || 'N/A'}</TableCell>
                          <TableCell>{test.data?.server || 'N/A'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Stations List */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Available Stations (Load Balanced)
              </Typography>
              <Grid container spacing={2}>
                {stations.length > 0 ? (
                  stations.map((station, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="h6">{station.name || `Station ${index + 1}`}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {station.location || 'Remote Location'}
                          </Typography>
                          <Chip 
                            label={station.status || 'active'}
                            color={station.status === 'active' ? 'success' : 'default'}
                            size="small"
                          />
                        </CardContent>
                      </Card>
                    </Grid>
                  ))
                ) : (
                  <Grid item xs={12}>
                    <Alert severity="info">
                      No stations available. Check if Station Service is running on remote machine.
                    </Alert>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default StationMonitor;