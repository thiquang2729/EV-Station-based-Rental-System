import React from 'react';
import {
  Box,
  Container,
  Flex,
  Text,
  VStack,
  HStack,
  Icon,
  useColorModeValue,
} from '@chakra-ui/react';
import { MdFlashOn, MdEmail, MdPhone, MdLocationOn } from 'react-icons/md';

const Footer = () => {
  const bgColor = useColorModeValue('gray.800', 'gray.900');
  const textColor = useColorModeValue('white', 'gray.100');
  const brandColor = useColorModeValue('green.400', 'green.300');

  return (
    <Box bg={bgColor} color={textColor} py={12}>
      <Container maxW="1200px">
        <Flex
          direction={{ base: 'column', md: 'row' }}
          justify="space-between"
          align={{ base: 'center', md: 'flex-start' }}
          gap={8}
        >
          {/* Brand Section */}
          <VStack align={{ base: 'center', md: 'flex-start' }} spacing={4}>
            <HStack spacing={3}>
              <Icon as={MdFlashOn} w={8} h={8} color={brandColor} />
              <Text fontSize="xl" fontWeight="bold" color={brandColor}>
                EV Rent
              </Text>
            </HStack>
            <Text fontSize="sm" opacity={0.8} textAlign={{ base: 'center', md: 'left' }} maxW="300px">
              Công ty tiên phong trong lĩnh vực cho thuê xe điện tại Việt Nam. 
              Mang đến giải pháp di chuyển thông minh và bền vững.
            </Text>
          </VStack>

          {/* Contact Section */}
          <VStack align={{ base: 'center', md: 'flex-start' }} spacing={4}>
            <Text fontSize="lg" fontWeight="600">
              Liên hệ
            </Text>
            <VStack spacing={2} align={{ base: 'center', md: 'flex-start' }}>
              <HStack spacing={3}>
                <Icon as={MdEmail} w={4} h={4} color={brandColor} />
                <Text fontSize="sm">support@evrent.vn</Text>
              </HStack>
              <HStack spacing={3}>
                <Icon as={MdPhone} w={4} h={4} color={brandColor} />
                <Text fontSize="sm">1900 1234</Text>
              </HStack>
              <HStack spacing={3}>
                <Icon as={MdLocationOn} w={4} h={4} color={brandColor} />
                <Text fontSize="sm">Hà Nội, Việt Nam</Text>
              </HStack>
            </VStack>
          </VStack>

          {/* Services Section */}
          <VStack align={{ base: 'center', md: 'flex-start' }} spacing={4}>
            <Text fontSize="lg" fontWeight="600">
              Dịch vụ
            </Text>
            <VStack spacing={2} align={{ base: 'center', md: 'flex-start' }}>
              <Text fontSize="sm" _hover={{ color: brandColor }} cursor="pointer">
                Thuê xe điện
              </Text>
              <Text fontSize="sm" _hover={{ color: brandColor }} cursor="pointer">
                Bảo trì xe
              </Text>
              <Text fontSize="sm" _hover={{ color: brandColor }} cursor="pointer">
                Hỗ trợ 24/7
              </Text>
              <Text fontSize="sm" _hover={{ color: brandColor }} cursor="pointer">
                Bảo hiểm
              </Text>
            </VStack>
          </VStack>
        </Flex>

        {/* Bottom Section */}
        <Box mt={8} pt={8} borderTop="1px solid" borderColor="gray.600">
          <Flex
            direction={{ base: 'column', md: 'row' }}
            justify="space-between"
            align="center"
            gap={4}
          >
            <Text fontSize="sm" opacity={0.8}>
              © 2024 EV Rent. Tất cả quyền được bảo lưu.
            </Text>
            <HStack spacing={6}>
              <Text fontSize="sm" _hover={{ color: brandColor }} cursor="pointer">
                Điều khoản sử dụng
              </Text>
              <Text fontSize="sm" _hover={{ color: brandColor }} cursor="pointer">
                Chính sách bảo mật
              </Text>
            </HStack>
          </Flex>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
