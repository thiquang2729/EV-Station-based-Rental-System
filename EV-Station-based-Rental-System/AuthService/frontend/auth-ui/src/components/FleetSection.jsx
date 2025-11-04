import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Flex,
  Image,
  SimpleGrid,
  useColorModeValue,
} from '@chakra-ui/react';


const FleetSection = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  const textSecondary = useColorModeValue('gray.600', 'gray.400');
  const brandColor = useColorModeValue('green.500', 'green.400');

  const vehicles = [
    {
      name: "Vinfast VF e34",
      range: "285",
      seats: "5",
      image: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
    },
    {
      name: "Tesla Model 3",
      range: "576",
      seats: "5",
      image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
    },
    {
      name: "Vinfast VF9",
      range: "481",
      seats: "5",
      image: "https://i1-vnexpress.vnecdn.net/2023/03/27/VF9thumjpg-1679907708.jpg?w=750&h=450&q=100&dpr=1&fit=crop&s=Swpqo7PubMKfM8H_JnC3Pw"
    },
    {
      name: "Kia EV6",
      range: "499",
      seats: "5",
      image: "https://images.unsplash.com/photo-1617788138017-80ad40651399?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
    },
    {
      name: "BMW iX",
      range: "630",
      seats: "5",
      image: "https://images.unsplash.com/photo-1555215695-3004980ad54e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
    },
    {
      name: "Mercedes EQS",
      range: "770",
      seats: "5",
      image: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
    },
    {
      name: "Audi e-tron GT",
      range: "488",
      seats: "4",
      image: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
    },
  ];

  // Sliding window: hiển thị 4 xe, mỗi lần chuyển 1 xe
  const visibleVehicles = 4;
  const totalSlides = vehicles.length - visibleVehicles + 1; // 7 xe - 4 + 1 = 4 slides
  
  const getVisibleVehicles = (slideIndex) => {
    return vehicles.slice(slideIndex, slideIndex + visibleVehicles);
  };

  // Auto-play functionality
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 4000); // Change slide every 4 seconds

    return () => clearInterval(interval);
  }, [totalSlides]);

  return (
    <Box 
      bg={bgColor} 
      py="80px"
    >
      <Container maxW="container.xl">
        <VStack spacing="60px" align="center">
          {/* Header */}
          <VStack spacing="20px" align="center" textAlign="center">
            <Heading
              fontSize={{ base: "3xl", md: "4xl", lg: "5xl" }}
              fontWeight="bold"
              color={textColor}
            >
              Đội xe của chúng tôi
            </Heading>
          </VStack>

          {/* Vehicle Carousel - Sliding window 4 xe */}
          <Box
            w="100%"
            h="calc(100vh - 560px)"
            overflow="hidden"
            position="relative"
          >
            <Flex
              transform={`translateX(-${currentSlide * (100 / visibleVehicles)}%)`}
              transition="transform 1s ease-in-out"
              w={`${vehicles.length * (100 / visibleVehicles)}%`}
            >
              {vehicles.map((vehicle, index) => (
                <Box
                  key={index}
                  w={`${100 / vehicles.length}%`}
                  flexShrink={0}
                  px="15px"
                >
                  <Box
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
                    <VStack spacing="20px" align="center">
                      {/* Vehicle Image */}
                      <Box
                        w="100%"
                        h="200px"
                        borderRadius="15px"
                        overflow="hidden"
                        bg="gray.100"
                      >
                        <Image
                          src={vehicle.image}
                          alt={vehicle.name}
                          w="100%"
                          h="100%"
                          objectFit="cover"
                        />
                      </Box>

                      {/* Vehicle Info */}
                      <VStack spacing="15px" align="center" textAlign="center">
                        <Heading
                          fontSize="xl"
                          fontWeight="bold"
                          color={textColor}
                        >
                          {vehicle.name}
                        </Heading>

                        <VStack spacing="8px" align="center">
                          <HStack spacing="5px">
                            <Text fontSize="md" color={textSecondary}>
                              {vehicle.range}
                            </Text>
                            <Text fontSize="md" color={brandColor} fontWeight="600">
                              km
                            </Text>
                            <Text fontSize="md" color={textSecondary}>
                              quãng đường
                            </Text>
                          </HStack>

                          <HStack spacing="5px">
                            <Text fontSize="md" color={brandColor} fontWeight="600">
                              {vehicle.seats}
                            </Text>
                            <Text fontSize="md" color={textSecondary}>
                              chỗ ngồi
                            </Text>
                          </HStack>
                        </VStack>
                      </VStack>
                    </VStack>
                  </Box>
                </Box>
              ))}
            </Flex>
          </Box>

          {/* Dots Indicator */}
          <HStack spacing="10px" justify="center" mt="-10px">
            {Array.from({ length: totalSlides }, (_, index) => (
              <Box
                key={index}
                w="12px"
                h="12px"
                borderRadius="full"
                bg={index === currentSlide ? brandColor : 'gray.300'}
                cursor="pointer"
                transition="all 0.3s"
                _hover={{
                  bg: index === currentSlide ? brandColor : 'gray.400',
                }}
                onClick={() => setCurrentSlide(index)}
              />
            ))}
          </HStack>
        </VStack>
      </Container>
    </Box>
  );
};

export default FleetSection;
