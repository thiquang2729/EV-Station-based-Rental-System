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
} from '@chakra-ui/react';
import { MdPerson, MdDirectionsCar, MdFlashOn } from 'react-icons/md';

const ProcessSection = () => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  const textSecondary = useColorModeValue('gray.600', 'gray.400');
  const brandColor = useColorModeValue('green.500', 'green.400');
  const iconBg = useColorModeValue('green.50', 'green.900');

  const steps = [
    {
      icon: MdPerson,
      title: "Tạo tài khoản và tải lên giấy tờ để xác thực thông tin cá nhân của bạn.",
    },
    {
      icon: MdDirectionsCar,
      title: "Tìm trạm xe gần nhất, chọn xe và mở khóa ngay trên ứng dụng.",
    },
    {
      icon: MdFlashOn,
      title: "Tận hưởng chuyến đi của bạn và trả xe tại bất kỳ trạm nào trong mạng lưới.",
    },
  ];

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
              Quy trình thuê xe
            </Heading>
            <Text
              fontSize={{ base: "lg", md: "xl" }}
              color={textSecondary}
              maxW="600px"
            >
              Chỉ với 3 bước đơn giản để bắt đầu hành trình của bạn.
            </Text>
          </VStack>

          {/* Steps */}
          <HStack
            spacing={{ base: "40px", md: "60px", lg: "80px" }}
            align="flex-start"
            flexWrap={{ base: "wrap", lg: "nowrap" }}
            justify="center"
          >
            {steps.map((step, index) => (
              <VStack
                key={index}
                spacing="20px"
                align="center"
                textAlign="center"
                maxW="300px"
                flex="1"
                minW="250px"
              >
                {/* Icon */}
                <Flex
                  align="center"
                  justify="center"
                  w="80px"
                  h="80px"
                  borderRadius="full"
                  bg={iconBg}
                  color={brandColor}
                >
                  <Icon as={step.icon} w="40px" h="40px" />
                </Flex>

                {/* Description */}
                <Text
                  fontSize={{ base: "sm", md: "md" }}
                  color={textColor}
                  fontWeight="500"
                  lineHeight="1.6"
                >
                  {step.title}
                </Text>
              </VStack>
            ))}
          </HStack>
        </VStack>
      </Container>
    </Box>
  );
};

export default ProcessSection;
