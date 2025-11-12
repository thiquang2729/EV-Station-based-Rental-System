import React from 'react';
import {
  Box,
  Container,
  Text,
  VStack,
  useColorModeValue,
} from '@chakra-ui/react';

const AboutUsSection = () => {
  const textColor = useColorModeValue('gray.800', 'white');
  const bgColor = useColorModeValue('white', 'gray.800');

  return (
    <Box bg={bgColor} py={16}>
      <Container maxW="1200px">
        <VStack spacing={8} textAlign="center">
          <Text
            fontSize={{ base: "2xl", md: "3xl", lg: "4xl" }}
            fontWeight="bold"
            color={textColor}
            fontFamily="heading"
          >
            Về Chúng Tôi
          </Text>
          
          <Box maxW="800px">
            <Text
              fontSize={{ base: "md", md: "lg", lg: "xl" }}
              color={textColor}
              lineHeight="1.8"
              textAlign="center"
            >
              EV Rent là công ty tiên phong trong lĩnh vực cho thuê xe điện tại Việt Nam. 
              Với sứ mệnh mang đến giải pháp di chuyển thông minh, tiết kiệm và bền vững, 
              chúng tôi cam kết cung cấp dịch vụ chất lượng cao, đội xe hiện đại và 
              trải nghiệm khách hàng tuyệt vời.
            </Text>
          </Box>

          {/* Additional Features */}
          <Box
            display="grid"
            gridTemplateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }}
            gap={8}
            mt={12}
            w="100%"
          >
            <VStack spacing={4}>
              <Box
                w={16}
                h={16}
                bg={useColorModeValue('green.100', 'green.900')}
                borderRadius="full"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Text fontSize="2xl">⚡</Text>
              </Box>
              <Text fontSize="lg" fontWeight="600" color={textColor}>
                Xe Điện Hiện Đại
              </Text>
              <Text fontSize="sm" color={textColor} opacity={0.8} textAlign="center">
                Đội xe Tesla Model S mới nhất với công nghệ tiên tiến
              </Text>
            </VStack>

            <VStack spacing={4}>
              <Box
                w={16}
                h={16}
                bg={useColorModeValue('green.100', 'green.900')}
                borderRadius="full"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Text fontSize="2xl">🛡️</Text>
              </Box>
              <Text fontSize="lg" fontWeight="600" color={textColor}>
                An Toàn Tuyệt Đối
              </Text>
              <Text fontSize="sm" color={textColor} opacity={0.8} textAlign="center">
                Bảo hiểm đầy đủ và hỗ trợ 24/7 cho mọi chuyến đi
              </Text>
            </VStack>

            <VStack spacing={4}>
              <Box
                w={16}
                h={16}
                bg={useColorModeValue('green.100', 'green.900')}
                borderRadius="full"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Text fontSize="2xl">🌱</Text>
              </Box>
              <Text fontSize="lg" fontWeight="600" color={textColor}>
                Thân Thiện Môi Trường
              </Text>
              <Text fontSize="sm" color={textColor} opacity={0.8} textAlign="center">
                Góp phần bảo vệ môi trường với xe điện không khí thải
              </Text>
            </VStack>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
};

export default AboutUsSection;
