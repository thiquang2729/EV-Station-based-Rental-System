import React, { useState, useEffect } from 'react';
import { Box, Button, Text, VStack, Spinner } from '@chakra-ui/react';

const AnalyticsService = () => {
  const [countdown, setCountdown] = useState(3);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && !isRedirecting) {
      setIsRedirecting(true);
      window.location.href = 'http://localhost:5173/?page=DASHBOARD';
    }
  }, [countdown, isRedirecting]);

  const handleRedirectNow = () => {
    setIsRedirecting(true);
    window.location.href = 'http://localhost:5173/?page=DASHBOARD';
  };

  const handleGoBack = () => {
    window.location.href = '/admin/default';
  };

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      minH="100vh"
      bg="gray.50"
    >
      <VStack spacing={4} p={8} bg="white" borderRadius="lg" boxShadow="md">
        <Spinner size="xl" color="blue.500" />
        <Text fontSize="lg" fontWeight="semibold">
          Đang chuyển đến Phân tích Dữ liệu...
        </Text>
        <Text fontSize="sm" color="gray.600">
          Tự động chuyển hướng sau {countdown} giây
        </Text>
        <VStack spacing={2} w="100%">
          <Button
            colorScheme="blue"
            onClick={handleRedirectNow}
            w="100%"
            isDisabled={isRedirecting}
          >
            Chuyển ngay
          </Button>
          <Button
            variant="outline"
            onClick={handleGoBack}
            w="100%"
            isDisabled={isRedirecting}
          >
            Trở về Admin
          </Button>
        </VStack>
      </VStack>
    </Box>
  );
};

export default AnalyticsService;

