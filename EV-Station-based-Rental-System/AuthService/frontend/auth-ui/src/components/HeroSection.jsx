import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Text,
  Button,
  Icon,
  useColorModeValue,
  Image,
  AspectRatio,
} from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';

const HeroSection = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const brandColor = useColorModeValue('green.500', 'green.400');
  
  // Mock data for carousel slides
  const slides = [
    {
      id: 1,
      title: "Ưu Đãi Đặc Biệt Cho Thành Viên Mới",
      subtitle: "Giảm giá 30% cho lần thuê đầu tiên khi đăng ký tài khoản ngay hôm nay.",
      image: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      cta: "Đăng ký ngay"
    },
    {
      id: 2,
      title: "Xe Điện Hiện Đại",
      subtitle: "Trải nghiệm công nghệ tiên tiến với đội xe Tesla Model S mới nhất.",
      image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      cta: "Khám phá ngay"
    },
    {
      id: 3,
      title: "Dịch Vụ 24/7",
      subtitle: "Hỗ trợ khách hàng 24/7 với đội ngũ chuyên nghiệp.",
      image: "https://i1-vnexpress.vnecdn.net/2023/03/27/VF9thumjpg-1679907708.jpg?w=750&h=450&q=100&dpr=1&fit=crop&s=Swpqo7PubMKfM8H_JnC3Pw",
      cta: "Liên hệ ngay"
    }
  ];

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      if (!isTransitioning) {
        setIsTransitioning(true);
        setCurrentSlide((prev) => (prev + 1) % slides.length);
        setTimeout(() => setIsTransitioning(false), 800);
      }
    }, 2500); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [isAutoPlaying, slides.length, isTransitioning]);

  // Pause auto-play when user hovers over the carousel
  const handleMouseEnter = () => {
    setIsAutoPlaying(false);
  };

  const handleMouseLeave = () => {
    setIsAutoPlaying(true);
  };

  const nextSlide = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setTimeout(() => setIsTransitioning(false), 800);
  };

  const prevSlide = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setTimeout(() => setIsTransitioning(false), 800);
  };

  const goToSlide = (index) => {
    if (isTransitioning || index === currentSlide) return;
    setIsTransitioning(true);
    setCurrentSlide(index);
    setTimeout(() => setIsTransitioning(false), 800);
  };

  return (
    <Box 
      position="relative" 
      overflow="hidden"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Carousel Container */}
      <AspectRatio ratio={16/9} maxH="600px">
        <Box position="relative" overflow="hidden">
          {/* Background Images Container */}
          <Box
            position="relative"
            w="100%"
            h="100%"
            display="flex"
            transform={`translateX(-${currentSlide * 100}%)`}
            transition="transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)"
          >
            {slides.map((slide, index) => (
              <Box
                key={slide.id}
                minW="100%"
                h="100%"
                position="relative"
                flexShrink={0}
              >
                <Image
                  src={slide.image}
                  alt={`Slide ${index + 1}`}
                  objectFit="cover"
                  w="100%"
                  h="100%"
                  filter="brightness(0.7)"
                />
              </Box>
            ))}
          </Box>
          
          {/* Overlay Content */}
          <Flex
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            align="center"
            justify="center"
            bg="rgba(0,0,0,0.3)"
            px={8}
            transition="all 0.8s ease-in-out"
          >
            <Box 
              textAlign="center" 
              color="white" 
              maxW="800px"
              opacity={isTransitioning ? 0.7 : 1}
              transform={isTransitioning ? "translateY(10px)" : "translateY(0)"}
              transition="all 0.8s ease-in-out"
            >
              <Text
                fontSize={{ base: "2xl", md: "4xl", lg: "5xl" }}
                fontWeight="bold"
                mb={4}
                lineHeight="1.2"
                transition="all 0.8s ease-in-out"
              >
                {slides[currentSlide].title}
              </Text>
              <Text
                fontSize={{ base: "lg", md: "xl", lg: "2xl" }}
                mb={8}
                opacity={0.9}
                lineHeight="1.4"
                transition="all 0.8s ease-in-out"
              >
                {slides[currentSlide].subtitle}
              </Text>
              <Button
                size="lg"
                bg={brandColor}
                color="white"
                px={8}
                py={6}
                fontSize="lg"
                fontWeight="600"
                borderRadius="full"
                _hover={{
                  bg: useColorModeValue('green.600', 'green.300'),
                  transform: 'translateY(-2px)',
                }}
                transition="all 0.3s"
                disabled={isTransitioning}
                opacity={isTransitioning ? 0.8 : 1}
              >
                {slides[currentSlide].cta}
              </Button>
            </Box>
          </Flex>
        </Box>
      </AspectRatio>

      {/* Navigation Arrows */}
      <Button
        position="absolute"
        left={4}
        top="50%"
        transform="translateY(-50%)"
        bg="rgba(255,255,255,0.2)"
        color="white"
        borderRadius="full"
        w={12}
        h={12}
        onClick={prevSlide}
        _hover={{ bg: "rgba(255,255,255,0.3)" }}
        zIndex={10}
      >
        <Icon as={ChevronLeftIcon} w={6} h={6} />
      </Button>
      
      <Button
        position="absolute"
        right={4}
        top="50%"
        transform="translateY(-50%)"
        bg="rgba(255,255,255,0.2)"
        color="white"
        borderRadius="full"
        w={12}
        h={12}
        onClick={nextSlide}
        _hover={{ bg: "rgba(255,255,255,0.3)" }}
        zIndex={10}
      >
        <Icon as={ChevronRightIcon} w={6} h={6} />
      </Button>

      {/* Dots Indicator */}
      <Flex
        position="absolute"
        bottom={6}
        left="50%"
        transform="translateX(-50%)"
        gap={2}
        zIndex={10}
      >
        {slides.map((_, index) => (
          <Button
            key={index}
            w={index === currentSlide ? 8 : 3}
            h={3}
            borderRadius="full"
            bg={index === currentSlide ? "white" : "rgba(255,255,255,0.5)"}
            p={0}
            minW="auto"
            onClick={() => goToSlide(index)}
            _hover={{ bg: "white" }}
            transition="all 0.3s ease-in-out"
          />
        ))}
      </Flex>
    </Box>
  );
};

export default HeroSection;
