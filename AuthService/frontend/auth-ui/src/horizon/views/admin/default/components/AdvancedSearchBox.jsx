import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Box,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Button,
  Icon,
  Text,
  VStack,
  HStack,
  Badge,
  Flex,
  useColorModeValue,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  PopoverArrow,
  Divider,
  IconButton,
  Tooltip,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Select,
  Checkbox,
  CheckboxGroup,
  Stack,
  RangeSlider,
  RangeSliderTrack,
  RangeSliderFilledTrack,
  RangeSliderThumb,
} from "@chakra-ui/react";
import {
  MdSearch,
  MdClear,
  MdHistory,
  MdFilterList,
  MdKeyboardArrowDown,
  MdPerson,
  MdEmail,
  MdPhone,
  MdCalendarToday,
  MdVerified,
  MdWarning,
  MdCancel,
  MdTrendingUp,
} from "react-icons/md";
import { useSelector } from "react-redux";

export default function AdvancedSearchBox({
  searchTerm,
  setSearchTerm,
  onSearch,
  onFiltersChange,
  isLoading,
  placeholder = "Tìm kiếm người dùng...",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [searchHistory, setSearchHistory] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [filters, setFilters] = useState({
    role: null,
    verificationStatus: null,
    riskStatus: null,
    dateRange: [0, 365], // days ago
  });
  
  const inputRef = useRef(null);
  const { isOpen: isFilterOpen, onOpen: onFilterOpen, onClose: onFilterClose } = useDisclosure();
  
  const textColor = useColorModeValue("secondaryGray.900", "white");
  const textColorSecondary = useColorModeValue("secondaryGray.600", "white");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.100");
  const brandColor = useColorModeValue("brand.500", "brand.400");
  const bgColor = useColorModeValue("white", "navy.800");
  const hoverBg = useColorModeValue("gray.50", "whiteAlpha.50");

  // Load search history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('userSearchHistory');
    const savedRecent = localStorage.getItem('userRecentSearches');
    
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory));
    }
    if (savedRecent) {
      setRecentSearches(JSON.parse(savedRecent));
    }
  }, []);

  // Generate suggestions based on search term
  const generateSuggestions = useMemo(() => {
    if (!searchTerm || searchTerm.length < 2) return [];
    
    const allSuggestions = [
      // Common search patterns
      { type: 'pattern', text: `${searchTerm}@gmail.com`, icon: MdEmail },
      { type: 'pattern', text: `${searchTerm}@yahoo.com`, icon: MdEmail },
      { type: 'pattern', text: `+84${searchTerm}`, icon: MdPhone },
      
      // Role-based suggestions
      { type: 'role', text: `Admin ${searchTerm}`, icon: MdPerson },
      { type: 'role', text: `Renter ${searchTerm}`, icon: MdPerson },
      
      // Status-based suggestions
      { type: 'status', text: `${searchTerm} - Verified`, icon: MdVerified },
      { type: 'status', text: `${searchTerm} - Pending`, icon: MdWarning },
      { type: 'status', text: `${searchTerm} - Banned`, icon: MdCancel },
    ];

    // Add recent searches that match
    const matchingRecent = recentSearches
      .filter(item => item.toLowerCase().includes(searchTerm.toLowerCase()))
      .slice(0, 3)
      .map(item => ({ type: 'recent', text: item, icon: MdHistory }));

    return [...matchingRecent, ...allSuggestions].slice(0, 8);
  }, [searchTerm, recentSearches]);

  // Handle input change
  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setIsOpen(value.length > 0);
    setSelectedIndex(-1);
  };

  // Handle search
  const handleSearch = (searchValue = searchTerm) => {
    if (!searchValue.trim()) return;
    
    // Add to recent searches
    const newRecent = [searchValue, ...recentSearches.filter(item => item !== searchValue)].slice(0, 10);
    setRecentSearches(newRecent);
    localStorage.setItem('userRecentSearches', JSON.stringify(newRecent));
    
    // Add to search history
    const newHistory = [searchValue, ...searchHistory.filter(item => item !== searchValue)].slice(0, 20);
    setSearchHistory(newHistory);
    localStorage.setItem('userSearchHistory', JSON.stringify(newHistory));
    
    // Close suggestions
    setIsOpen(false);
    setSelectedIndex(-1);
    
    // Trigger search
    onSearch(searchValue);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSearch(suggestions[selectedIndex].text);
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Clear search
  const handleClear = () => {
    setSearchTerm('');
    setIsOpen(false);
    setSelectedIndex(-1);
    onSearch('');
  };

  // Clear history
  const clearHistory = () => {
    setSearchHistory([]);
    setRecentSearches([]);
    localStorage.removeItem('userSearchHistory');
    localStorage.removeItem('userRecentSearches');
  };

  // Apply filters
  const applyFilters = () => {
    onFilterClose();
    // Pass filters to parent component
    if (onFiltersChange) {
      onFiltersChange(filters);
    }
  };

  return (
    <Box position="relative" w="100%" mb="20px">
      <HStack spacing="10px" align="center">
        {/* Main Search Input */}
        <Box flex="1" position="relative">
          <InputGroup>
            <InputLeftElement>
              <Icon as={MdSearch} color={textColorSecondary} />
            </InputLeftElement>
            <Input
              ref={inputRef}
              placeholder={placeholder}
              value={searchTerm}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsOpen(searchTerm.length > 0)}
              bg={bgColor}
              borderColor={borderColor}
              _focus={{ borderColor: brandColor }}
              _hover={{ borderColor: brandColor }}
            />
            <InputRightElement>
              {searchTerm && (
                <IconButton
                  size="sm"
                  variant="ghost"
                  icon={<Icon as={MdClear} />}
                  onClick={handleClear}
                  aria-label="Clear search"
                />
              )}
            </InputRightElement>
          </InputGroup>

          {/* Search Suggestions Dropdown */}
          {isOpen && (
            <Box
              position="absolute"
              top="100%"
              left="0"
              right="0"
              zIndex={1000}
              bg={bgColor}
              border="1px solid"
              borderColor={borderColor}
              borderRadius="md"
              boxShadow="lg"
              mt="2px"
            >
              <VStack spacing="0" align="stretch">
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <>
                    <Box p="10px" bg={useColorModeValue("gray.50", "navy.700")}>
                      <HStack justify="space-between">
                        <Text fontSize="xs" fontWeight="600" color={textColorSecondary}>
                          Tìm kiếm gần đây
                        </Text>
                        <Button size="xs" variant="ghost" onClick={clearHistory}>
                          Xóa
                        </Button>
                      </HStack>
                    </Box>
                    {recentSearches.slice(0, 3).map((item, index) => (
                      <Box
                        key={index}
                        p="10px 15px"
                        cursor="pointer"
                        bg={selectedIndex === index ? hoverBg : "transparent"}
                        _hover={{ bg: hoverBg }}
                        onClick={() => handleSearch(item)}
                      >
                        <HStack>
                          <Icon as={MdHistory} color={textColorSecondary} />
                          <Text fontSize="sm" color={textColor}>
                            {item}
                          </Text>
                        </HStack>
                      </Box>
                    ))}
                    <Divider />
                  </>
                )}

                {/* Suggestions */}
                {suggestions.length > 0 && (
                  <>
                    <Box p="10px" bg={useColorModeValue("gray.50", "navy.700")}>
                      <Text fontSize="xs" fontWeight="600" color={textColorSecondary}>
                        Gợi ý
                      </Text>
                    </Box>
                    {suggestions.map((suggestion, index) => (
                      <Box
                        key={index}
                        p="10px 15px"
                        cursor="pointer"
                        bg={selectedIndex === index ? hoverBg : "transparent"}
                        _hover={{ bg: hoverBg }}
                        onClick={() => handleSearch(suggestion.text)}
                      >
                        <HStack>
                          <Icon as={suggestion.icon} color={textColorSecondary} />
                          <Text fontSize="sm" color={textColor}>
                            {suggestion.text}
                          </Text>
                          {suggestion.type === 'recent' && (
                            <Badge size="sm" colorScheme="blue">Gần đây</Badge>
                          )}
                        </HStack>
                      </Box>
                    ))}
                  </>
                )}

                {/* No suggestions */}
                {suggestions.length === 0 && recentSearches.length === 0 && (
                  <Box p="20px" textAlign="center">
                    <Text fontSize="sm" color={textColorSecondary}>
                      Nhập để tìm kiếm người dùng
                    </Text>
                  </Box>
                )}
              </VStack>
            </Box>
          )}
        </Box>

        {/* Filter Button */}
        <Menu>
          <MenuButton as={Button} variant="outline" h="40px" w="90px" borderRadius="10px">
            <Icon as={MdFilterList} />
            <Text fontSize="sm" ml="5px">Bộ lọc</Text>
          </MenuButton>
          <MenuList>
            <MenuItem onClick={onFilterOpen}>
              <Icon as={MdFilterList} mr="10px" />
              Bộ lọc nâng cao
            </MenuItem>
            <MenuDivider />
            <MenuItem onClick={() => {
              const newFilters = { ...filters, role: 'ADMIN' };
              setFilters(newFilters);
              if (onFiltersChange) onFiltersChange(newFilters);
            }}>
              <Icon as={MdPerson} mr="10px" />
              Chỉ Admin
            </MenuItem>
            <MenuItem onClick={() => {
              const newFilters = { ...filters, role: 'RENTER' };
              setFilters(newFilters);
              if (onFiltersChange) onFiltersChange(newFilters);
            }}>
              <Icon as={MdPerson} mr="10px" />
              Chỉ Renter
            </MenuItem>
            <MenuDivider />
            <MenuItem onClick={() => {
              const newFilters = { ...filters, verificationStatus: 'VERIFIED' };
              setFilters(newFilters);
              if (onFiltersChange) onFiltersChange(newFilters);
            }}>
              <Icon as={MdVerified} mr="10px" />
              Đã xác thực
            </MenuItem>
            <MenuItem onClick={() => {
              const newFilters = { ...filters, verificationStatus: 'PENDING' };
              setFilters(newFilters);
              if (onFiltersChange) onFiltersChange(newFilters);
            }}>
              <Icon as={MdWarning} mr="10px" />
              Chờ xác thực
            </MenuItem>
            <MenuDivider />
            <MenuItem onClick={() => {
              const newFilters = { ...filters, riskStatus: 'BANNED' };
              setFilters(newFilters);
              if (onFiltersChange) onFiltersChange(newFilters);
            }}>
              <Icon as={MdCancel} mr="10px" />
              Người dùng bị cấm
            </MenuItem>
            <MenuItem onClick={() => {
              const newFilters = { ...filters, riskStatus: 'WARNED' };
              setFilters(newFilters);
              if (onFiltersChange) onFiltersChange(newFilters);
            }}>
              <Icon as={MdWarning} mr="10px" />
              Người dùng cảnh báo
            </MenuItem>
          </MenuList>
        </Menu>

        {/* Search Button */}
        <Button
        borderRadius="10px"
          colorScheme="blue"
          onClick={() => handleSearch()}
          isLoading={isLoading}
          loadingText="Tìm kiếm..."
        >
          Tìm kiếm
        </Button>
      </HStack>

      {/* Advanced Filters Modal */}
      <Modal isOpen={isFilterOpen} onClose={onFilterClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Bộ lọc tìm kiếm nâng cao</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing="20px" align="stretch">
              {/* Role Filter */}
              <FormControl>
                <FormLabel>Vai trò</FormLabel>
                <Select
                  placeholder="Tất cả vai trò"
                  value={filters.role || ''}
                  onChange={(e) => setFilters({ ...filters, role: e.target.value || null })}
                >
                  <option value="ADMIN">Admin</option>
                  <option value="RENTER">Renter</option>
                </Select>
              </FormControl>

              {/* Verification Status */}
              <FormControl>
                <FormLabel>Trạng thái xác thực</FormLabel>
                <Select
                  placeholder="Tất cả trạng thái"
                  value={filters.verificationStatus || ''}
                  onChange={(e) => setFilters({ ...filters, verificationStatus: e.target.value || null })}
                >
                  <option value="VERIFIED">Đã xác thực</option>
                  <option value="PENDING">Chờ xác thực</option>
                  <option value="REJECTED">Từ chối</option>
                </Select>
              </FormControl>

              {/* Risk Status */}
              <FormControl>
                <FormLabel>Mức độ rủi ro</FormLabel>
                <Select
                  placeholder="Tất cả mức độ"
                  value={filters.riskStatus || ''}
                  onChange={(e) => setFilters({ ...filters, riskStatus: e.target.value || null })}
                >
                  <option value="NONE">Không có rủi ro</option>
                  <option value="WARNED">Cảnh báo</option>
                  <option value="BANNED">Bị cấm</option>
                </Select>
              </FormControl>

              {/* Date Range */}
              <FormControl>
                <FormLabel>Khoảng thời gian đăng ký</FormLabel>
                <VStack spacing="10px">
                  <RangeSlider
                    value={filters.dateRange}
                    onChange={(val) => setFilters({ ...filters, dateRange: val })}
                    min={0}
                    max={365}
                    step={1}
                  >
                    <RangeSliderTrack>
                      <RangeSliderFilledTrack />
                    </RangeSliderTrack>
                    <RangeSliderThumb index={0} />
                    <RangeSliderThumb index={1} />
                  </RangeSlider>
                  <HStack justify="space-between" w="100%">
                    <Text fontSize="sm" color={textColorSecondary}>
                      {filters.dateRange[1]} ngày trước
                    </Text>
                    <Text fontSize="sm" color={textColorSecondary}>
                      {filters.dateRange[0]} ngày trước
                    </Text>
                  </HStack>
                </VStack>
              </FormControl>

              {/* Action Buttons */}
              <HStack justify="space-between">
                <Button variant="ghost" onClick={() => setFilters({
                  role: null,
                  verificationStatus: null,
                  riskStatus: null,
                  dateRange: [0, 365]
                })}>
                  Xóa bộ lọc
                </Button>
                <HStack>
                  <Button variant="outline" onClick={onFilterClose}>
                    Hủy
                  </Button>
                  <Button colorScheme="blue" onClick={applyFilters}>
                    Áp dụng
                  </Button>
                </HStack>
              </HStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}
