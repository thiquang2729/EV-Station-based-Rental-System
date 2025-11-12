import React from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Flex,
  Icon,
  useColorModeValue,
  SimpleGrid,
} from '@chakra-ui/react';
import { MdStar } from 'react-icons/md';

const TestimonialsSection = () => {
  const bgColor = useColorModeValue('green.50', 'green.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  const textSecondary = useColorModeValue('gray.600', 'gray.400');
  const brandColor = useColorModeValue('green.500', 'green.400');

  const testimonials = [
    {
      name: "Anh Minh Tuấn",
      role: "Khách hàng",
      rating: 5,
      quote: "Dịch vụ tuyệt vời! Xe mới, sạch sẽ và ứng dụng rất dễ sử dụng. Tôi chắc chắn sẽ sử dụng lại dịch vụ của EV Rent.",
    },
    {
      name: "Chị Lan Anh",
      role: "Khách hàng",
      rating: 5,
      quote: "Quy trình thuê xe nhanh chóng và tiện lợi. Mạng lưới trạm sạc rộng khắp giúp tôi không phải lo lắng về việc hết pin. Rất khuyến khích!",
    },
    {
      name: "Anh Quốc Bảo",
      role: "Khách hàng",
      rating: 5,
      quote: "Một giải pháp di chuyển xanh và tiết kiệm. Tôi rất hài lòng với trải nghiệm và sự hỗ trợ nhiệt tình từ đội ngũ chăm sóc khách hàng.",
    },
  ];

  const renderStars = (rating) => {
    return Array.from({ length: rating }, (_, i) => (
      <Icon key={i} as={MdStar} w="20px" h="20px" color="yellow.400" />
    ));
  };

  return (
    <Box bg={bgColor} py="80px">
      <Container maxW="container.xl">
        <VStack spacing="60px" align="center">
          {/* Header */}
          <VStack spacing="20px" align="center" textAlign="center">
            <Heading
              fontSize={{ base: "3xl", md: "4xl", lg: "5xl" }}
              fontWeight="bold"
              color={textColor}
            >
              Khách hàng nói gì về chúng tôi
            </Heading>
          </VStack>

          {/* Testimonials */}
          <SimpleGrid
            columns={{ base: 1, md: 3 }}
            spacing="30px"
            w="100%"
            maxW="1200px"
          >
            {testimonials.map((testimonial, index) => (
              <Box
                key={index}
                bg={cardBg}
                borderRadius="20px"
                p="30px"
                boxShadow="lg"
                transition="all 0.3s"
                _hover={{
                  transform: 'translateY(-5px)',
                  boxShadow: 'xl',
                }}
              >
                <VStack spacing="20px" align="flex-start">
                  {/* Rating */}
                  <HStack spacing="5px">
                    {renderStars(testimonial.rating)}
                  </HStack>

                  {/* Quote */}
                  <Text
                    fontSize="md"
                    color={textColor}
                    fontStyle="italic"
                    lineHeight="1.6"
                  >
                    "{testimonial.quote}"
                  </Text>

                  {/* Author */}
                  <VStack spacing="5px" align="flex-start">
                    <Text
                      fontSize="md"
                      fontWeight="bold"
                      color={textColor}
                    >
                      {testimonial.name}
                    </Text>
                    <Text
                      fontSize="sm"
                      color={textSecondary}
                    >
                      {testimonial.role}
                    </Text>
                  </VStack>
                </VStack>
              </Box>
            ))}
          </SimpleGrid>
        </VStack>
      </Container>
    </Box>
  );
};

export default TestimonialsSection;
