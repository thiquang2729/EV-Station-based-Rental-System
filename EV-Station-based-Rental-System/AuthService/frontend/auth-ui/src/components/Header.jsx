import React from 'react';
import {
  Box,
  Flex,
  Text,
  Button,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Icon,
  useColorModeValue,
} from '@chakra-ui/react';
import { MdFlashOn, MdPerson } from 'react-icons/md';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { useLocation, useNavigate } from 'react-router-dom';

const Header = ({ user, onLogout, onNavigateToAboutUser, onNavigateToReports }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  const brandColor = useColorModeValue('green.500', 'green.400');
  const activeBg = useColorModeValue('green.100', 'green.900');

  // Helper function to check if current path is active
  const isActive = (path) => {
    return location.pathname === path;
  };

  // Navigation handlers
  const handleNavigateToHome = () => {
    navigate('/home');
  };

  const handleNavigateToReports = () => {
    navigate('/reports');
  };

  const handleNavigateToBooking = () => {
    const target = 'http://localhost:3004';
    window.location.href = target;
  };

  return (
    <Box
      bg={bgColor}
      px={{ base: 4, md: 8 }}
      py={4}
      boxShadow="sm"
      position="sticky"
      top={0}
      zIndex={1000}
    >
      <Flex align="center" justify="space-between" maxW="1200px" mx="auto">
        {/* Logo và Brand */}
        <Flex align="center" gap={3}>
          <Icon as={MdFlashOn} w={8} h={8} color={brandColor} />
          <Text
            fontSize="xl"
            fontWeight="bold"
            color={brandColor}
            fontFamily="heading"
          >
            EV Rent
          </Text>
        </Flex>

        {/* Navigation */}
        <Flex align="center" gap={6} display={{ base: 'none', md: 'flex' }}>
          <Button
            variant="ghost"
            bg={isActive('/home') ? activeBg : 'transparent'}
            color={isActive('/home') ? brandColor : textColor}
            borderRadius="full"
            px={6}
            fontWeight={isActive('/home') ? "600" : "500"}
            onClick={handleNavigateToHome}
            _hover={{ color: brandColor }}
          >
            Home
          </Button>
          <Button
            variant="ghost"
            color={textColor}
            fontWeight="500"
            onClick={handleNavigateToBooking}
            _hover={{ color: brandColor }}
          >
            Booking
          </Button>
          <Button
            variant="ghost"
            bg={isActive('/reports') ? activeBg : 'transparent'}
            color={isActive('/reports') ? brandColor : textColor}
            fontWeight={isActive('/reports') ? "600" : "500"}
            borderRadius="full"
            px={6}
            onClick={handleNavigateToReports}
            _hover={{ color: brandColor }}
          >
            Báo cáo
          </Button>
        </Flex>

        {/* User Menu */}
        {user && (
          <Menu>
            <MenuButton
              as={Button}
              variant="ghost"
              rightIcon={<ChevronDownIcon />}
              leftIcon={
                <Avatar
                  size="sm"
                  name={user.fullName || user.email}
                  bg={brandColor}
                  color="white"
                />
              }
              color={textColor}
              fontWeight="500"
            >
              {user.fullName || 'Van A'}
            </MenuButton>
            <MenuList>
              <MenuItem onClick={onNavigateToAboutUser} icon={<Icon as={MdPerson} />}>
                Thông tin cá nhân
              </MenuItem>
              <MenuItem onClick={onLogout}>Đăng xuất</MenuItem>
            </MenuList>
          </Menu>
        )}
      </Flex>
    </Box>
  );
};

export default Header;
