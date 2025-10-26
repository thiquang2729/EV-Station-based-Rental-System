// Chakra imports
import {
  Box,
  Button,
  Flex,
  Icon,
  Text,
  Select,
  useColorModeValue,
  Spinner,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";
// Custom components
import Card from "components/card/Card.jsx";
import LineChart from "components/charts/LineChart";
import React, { useEffect, useState } from "react";
import { MdBarChart, MdOutlineCalendarToday } from "react-icons/md";
// Assets
import { RiArrowUpSFill } from "react-icons/ri";
import { useSelector } from "react-redux";
import userService from "@/services/userService";

export default function UserRegistrationChart(props) {
  const { ...rest } = props;

  // State management
  const [data, setData] = useState([]);
  const [period, setPeriod] = useState('7d');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Redux state
  const { accessToken } = useSelector((state) => state.auth);

  // Chakra Color Mode
  const textColor = useColorModeValue("secondaryGray.900", "white");
  const textColorSecondary = useColorModeValue("secondaryGray.600", "white");
  const boxBg = useColorModeValue("secondaryGray.300", "whiteAlpha.100");
  const iconColor = useColorModeValue("brand.500", "white");
  const bgButton = useColorModeValue("secondaryGray.300", "whiteAlpha.100");
  const bgHover = useColorModeValue(
    { bg: "secondaryGray.400" },
    { bg: "whiteAlpha.50" }
  );
  const bgFocus = useColorModeValue(
    { bg: "secondaryGray.300" },
    { bg: "whiteAlpha.100" }
  );

  // Load data when component mounts or period changes
  useEffect(() => {
    loadData();
  }, [period, accessToken]);

  // Function to load registration statistics
  const loadData = async () => {
    if (!accessToken) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await userService.getUserRegistrationStats(period, accessToken);
      setData(response.data || []);
    } catch (err) {
      console.error('Error loading registration stats:', err);
      setError('Không thể tải dữ liệu thống kê đăng ký');
    } finally {
      setLoading(false);
    }
  };

  // Calculate total registrations and growth
  const totalRegistrations = data.reduce((sum, item) => sum + item.count, 0);
  const previousPeriodTotal = data.length > 1 ? 
    data.slice(0, Math.floor(data.length / 2)).reduce((sum, item) => sum + item.count, 0) : 0;
  const currentPeriodTotal = data.length > 1 ? 
    data.slice(Math.floor(data.length / 2)).reduce((sum, item) => sum + item.count, 0) : totalRegistrations;
  
  const growthPercentage = previousPeriodTotal > 0 ? 
    ((currentPeriodTotal - previousPeriodTotal) / previousPeriodTotal * 100).toFixed(1) : 0;

  // Prepare chart data
  const chartData = [{
    name: "Đăng ký mới",
    data: data.map(item => item.count)
  }];

  // Chart options
  const chartOptions = {
    chart: {
      toolbar: {
        show: false,
      },
    },
    tooltip: {
      style: {
        fontSize: "12px",
        fontFamily: undefined,
      },
      onDatasetHover: {
        style: {
          fontSize: "12px",
          fontFamily: undefined,
        },
      },
      theme: "dark",
    },
    xaxis: {
      categories: data.map(item => {
        const date = new Date(item.date);
        return date.toLocaleDateString('vi-VN', { 
          month: 'short', 
          day: 'numeric' 
        });
      }),
      show: true,
      labels: {
        show: true,
        style: {
          colors: "#A3AED0",
          fontSize: "12px",
          fontWeight: "500",
        },
      },
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    yaxis: {
      show: true,
      color: "black",
      labels: {
        show: true,
        style: {
          colors: "#A3AED0",
          fontSize: "12px",
          fontWeight: "500",
        },
        formatter: (value) => Math.round(value),
      },
    },
    colors: ["#4318FF"],
    stroke: {
      curve: "smooth",
      width: 2,
    },
    grid: {
      show: true,
      borderColor: "#E2E8F0",
      strokeDashArray: 5,
      xaxis: {
        lines: {
          show: true,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
  };

  // Period options
  const periodOptions = [
    { value: '7d', label: '7 ngày' },
    { value: '30d', label: '30 ngày' },
    { value: '90d', label: '90 ngày' }
  ];

  return (
    <Card
      justifyContent='center'
      align='center'
      direction='column'
      w='100%'
      mb='0px'
      {...rest}>
      <Flex justify='space-between' ps='0px' pe='20px' pt='5px'>
        <Flex align='center' w='100%'>
          <Button
            bg={boxBg}
            fontSize='sm'
            fontWeight='500'
            color={textColorSecondary}
            borderRadius='7px'
            mr='10px'>
            <Icon
              as={MdOutlineCalendarToday}
              color={textColorSecondary}
              me='4px'
            />
            {periodOptions.find(opt => opt.value === period)?.label || '7 ngày'}
          </Button>
          
          <Select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            size='sm'
            w='120px'
            bg={boxBg}
            color={textColorSecondary}
            border='none'
            borderRadius='7px'>
            {periodOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>

          <Button
            ms='auto'
            align='center'
            justifyContent='center'
            bg={bgButton}
            _hover={bgHover}
            _focus={bgFocus}
            _active={bgFocus}
            w='37px'
            h='37px'
            lineHeight='100%'
            borderRadius='10px'
            onClick={loadData}
            isLoading={loading}>
            <Icon as={MdBarChart} color={iconColor} w='24px' h='24px' />
          </Button>
        </Flex>
      </Flex>

      {error && (
        <Alert status="error" mt="10px" borderRadius="10px">
          <AlertIcon />
          {error}
        </Alert>
      )}

      <Flex w='100%' flexDirection={{ base: "column", lg: "row" }}>
        <Flex flexDirection='column' me='20px' mt='28px'>
          <Text
            color={textColor}
            fontSize='34px'
            textAlign='start'
            fontWeight='700'
            lineHeight='100%'>
            {loading ? '...' : totalRegistrations.toLocaleString('vi-VN')}
          </Text>
          <Flex align='center' mb='20px'>
            <Text
              color='secondaryGray.600'
              fontSize='sm'
              fontWeight='500'
              mt='4px'
              me='12px'>
              Tổng đăng ký
            </Text>
            {!loading && growthPercentage !== 0 && (
              <Flex align='center'>
                <Icon 
                  as={RiArrowUpSFill} 
                  color={growthPercentage > 0 ? 'green.500' : 'red.500'} 
                  me='2px' 
                  mt='2px' 
                />
                <Text 
                  color={growthPercentage > 0 ? 'green.500' : 'red.500'} 
                  fontSize='sm' 
                  fontWeight='700'>
                  {growthPercentage > 0 ? '+' : ''}{growthPercentage}%
                </Text>
              </Flex>
            )}
          </Flex>

          <Flex align='center'>
            <Icon 
              as={RiArrowUpSFill} 
              color={totalRegistrations > 0 ? 'green.500' : 'gray.500'} 
              me='4px' 
            />
            <Text 
              color={totalRegistrations > 0 ? 'green.500' : 'gray.500'} 
              fontSize='md' 
              fontWeight='700'>
              {totalRegistrations > 0 ? 'Tăng trưởng' : 'Chưa có dữ liệu'}
            </Text>
          </Flex>
        </Flex>
        
        <Box minH='260px' minW='75%' mt='auto'>
          {loading ? (
            <Flex justify='center' align='center' h='260px'>
              <Spinner size='lg' color={iconColor} />
            </Flex>
          ) : (
            <LineChart
              chartData={chartData}
              chartOptions={chartOptions}
            />
          )}
        </Box>
      </Flex>
    </Card>
  );
}
