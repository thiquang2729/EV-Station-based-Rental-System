import React from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  Button,
  useColorModeValue,
} from '@chakra-ui/react';

const CTASection = () => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  const textSecondary = useColorModeValue('gray.600', 'gray.400');
  const brandColor = useColorModeValue('green.500', 'green.400');

  return (
    <Box bg={bgColor} py="80px">
      <Container maxW="container.md">
        <VStack spacing="40px" align="center" textAlign="center">
          {/* Main Heading */}
          <Heading
            fontSize={{ base: "3xl", md: "4xl", lg: "5xl" }}
            fontWeight="bold"
            color={textColor}
            lineHeight="1.2"
          >
            Sẵn sàng cho một hành trình xanh?
          </Heading>

          {/* Description */}
          <Text
            fontSize={{ base: "lg", md: "xl" }}
            color={textSecondary}
            lineHeight="1.6"
            maxW="600px"
          >
            Tham gia cộng đồng EV Rent ngay hôm nay để trải nghiệm tương lai của việc di chuyển. 
            Đăng ký nhanh chóng, dễ dàng và nhận ngay ưu đãi cho chuyến đi đầu tiên!
          </Text>

          {/* CTA Button */}
          <Button
            size="lg"
            bg={brandColor}
            color="white"
            px="40px"
            py="25px"
            fontSize="lg"
            fontWeight="600"
            borderRadius="full"
            _hover={{
              bg: useColorModeValue('green.600', 'green.300'),
              transform: 'translateY(-2px)',
            }}
            transition="all 0.3s"
            boxShadow="lg"
          >
            Đăng ký ngay
          </Button>
        </VStack>
      </Container>
    </Box>
  );
};

export default CTASection;
