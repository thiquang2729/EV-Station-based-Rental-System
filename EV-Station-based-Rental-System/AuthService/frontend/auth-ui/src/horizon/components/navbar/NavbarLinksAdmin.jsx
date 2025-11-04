import {
  Avatar,
  Button,
  Divider,
  Flex,
  Icon,
  Image,
  Link,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Spinner,
  Text,
  useColorMode,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { ItemContent } from "components/menu/ItemContent";
import { SearchBar } from "components/navbar/searchBar/SearchBar";
import { SidebarResponsive } from "components/sidebar/Sidebar";
import PropTypes from "prop-types";
import React, { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { FaEthereum } from "react-icons/fa";
import { IoMdMoon, IoMdSunny } from "react-icons/io";
import { MdInfoOutline, MdNotificationsNone } from "react-icons/md";
import routes from "routes";
import navImage from "assets/img/layout/Navbar.png";
import { logoutUser, resetStatus } from "@/features/auth/authSlice";

const HORIZON_DOCS = [
  {
    title: "Thư viện Horizon UI",
    href: "https://www.horizon-ui.com/",
    description: "Khám phá thêm các thành phần và mẫu giao diện có sẵn.",
  },
  {
    title: "Tài liệu hướng dẫn",
    href: "https://horizon-ui.com/documentation/docs/introduction",
    description: "Đọc tài liệu chính thức để tuỳ biến sâu hơn.",
  },
];

const FALLBACK_USER_NAME = "Người dùng";

const HeaderLinks = ({ secondary }) => {
  const { colorMode, toggleColorMode } = useColorMode();
  const toast = useToast();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const navbarIcon = useColorModeValue("gray.400", "white");
  const menuBg = useColorModeValue("white", "navy.800");
  const textColor = useColorModeValue("secondaryGray.900", "white");
  const textColorBrand = useColorModeValue("brand.700", "brand.400");
  const borderColor = useColorModeValue("#E6ECFA", "rgba(135, 140, 189, 0.3)");
  const shadow = useColorModeValue(
    "14px 17px 40px 4px rgba(112, 144, 176, 0.18)",
    "14px 17px 40px 4px rgba(112, 144, 176, 0.06)"
  );

  const displayName = useMemo(
    () => user?.fullName || user?.name || user?.email || FALLBACK_USER_NAME,
    [user]
  );

  const displayEmail = user?.email || "Chưa cập nhật email";

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }
    setIsLoggingOut(true);

    try {
      await dispatch(logoutUser()).unwrap();
      dispatch(resetStatus());
      toast({
        status: "success",
        title: "Đã đăng xuất",
        duration: 2000,
        position: "bottom-right",
      });
      navigate("/login", { replace: true, state: { loggedOut: true } });
    } catch (error) {
      toast({
        status: "error",
        title: "Không thể đăng xuất",
        description:
          error?.message || "Vui lòng thử lại hoặc kiểm tra kết nối của bạn.",
        duration: 4000,
        position: "bottom-right",
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <Flex
      w={{ sm: "100%", md: "auto" }}
      alignItems="center"
      flexDirection="row"
      bg={menuBg}
      flexWrap={secondary ? { base: "wrap", md: "nowrap" } : "nowrap"}
      p="10px"
      borderRadius="30px"
      boxShadow={shadow}
      gap="8px"
    >
      <SearchBar
        mb={secondary ? { base: "10px", md: "unset" } : "unset"}
        me="10px"
        borderRadius="30px"
      />

      {secondary ? (
        <Flex
          align="center"
          bg={useColorModeValue("secondaryGray.300", "navy.900")}
          borderRadius="30px"
          py="6px"
          px="10px"
          me="6px"
        >
          <Flex
            align="center"
            justify="center"
            bg={useColorModeValue("white", "navy.800")}
            h="29px"
            w="29px"
            borderRadius="30px"
            me="7px"
          >
            <Icon color={useColorModeValue("gray.700", "white")} as={FaEthereum} />
          </Flex>
          <Text fontSize="sm" fontWeight="700" color={useColorModeValue("gray.700", "white")}>
            1,924 ETH
          </Text>
        </Flex>
      ) : null}

      <SidebarResponsive routes={routes} />

      <Menu>
        <MenuButton p="0px">
          <Icon
            mt="6px"
            as={MdNotificationsNone}
            color={navbarIcon}
            w="18px"
            h="18px"
            me="10px"
          />
        </MenuButton>
        <MenuList
          boxShadow={shadow}
          p="20px"
          borderRadius="20px"
          bg={menuBg}
          border="none"
          mt="22px"
          minW={{ base: "260px", md: "360px" }}
        >
          <Flex justify="space-between" align="center" mb="12px">
            <Text fontSize="md" fontWeight="600" color={textColor}>
              Thông báo
            </Text>
            <Link fontSize="sm" color={textColorBrand}>
              Đánh dấu đã đọc
            </Link>
          </Flex>

          <ItemContent
            info="Trạm Nguyễn Văn Linh vừa hoàn tất kiểm tra định kỳ."
            aName="Hệ thống"
            aSrc={navImage}
            aTime="2 phút trước"
          />
          <ItemContent
            info="Tài khoản quản lý mới đã được tạo."
            aName="Admin"
            aSrc={navImage}
            aTime="1 giờ trước"
          />
          <ItemContent
            info="Có 3 yêu cầu thuê xe chưa xử lý."
            aName="EV Rental"
            aSrc={navImage}
            aTime="Hôm nay"
          />

          <Flex align="center" mt="12px" gap="8px">
            <Icon as={MdInfoOutline} color={textColorBrand} />
            <Text fontSize="sm" color={textColor}>
              Bạn có thể cấu hình thông báo trong phần cài đặt hệ thống.
            </Text>
          </Flex>
        </MenuList>
      </Menu>

      <Button
        variant="no-hover"
        bg="transparent"
        p="0px"
        minW="unset"
        minH="unset"
        h="18px"
        w="max-content"
        onClick={toggleColorMode}
      >
        <Icon
          me="10px"
          h="18px"
          w="18px"
          color={navbarIcon}
          as={colorMode === "light" ? IoMdMoon : IoMdSunny}
        />
      </Button>

      <Menu>
        <MenuButton p="0px">
          <Avatar
            _hover={{ cursor: "pointer" }}
            color="white"
            name={displayName}
            bg="#11047A"
            size="sm"
            w="40px"
            h="40px"
          />
        </MenuButton>
        <MenuList
          boxShadow={shadow}
          p="0px"
          mt="10px"
          borderRadius="20px"
          bg={menuBg}
          border="none"
          minW="240px"
        >
          <Flex direction="column" p="16px" pb="12px">
            <Text fontWeight="700" color={textColor} fontSize="sm">
              {displayName}
            </Text>
            <Text fontSize="xs" color={useColorModeValue("gray.500", "gray.300")}>
              {displayEmail}
            </Text>
          </Flex>
          <Divider borderColor={borderColor} />
          <MenuItem
            _hover={{ bg: "none" }}
            _focus={{ bg: "none" }}
            px="16px"
            py="12px"
          >
            <Text fontSize="sm" color={textColor}>
              Cài đặt tài khoản
            </Text>
          </MenuItem>
          {HORIZON_DOCS.map((item) => (
            <MenuItem
              key={item.href}
              as={Link}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              _hover={{ textDecoration: "none", bg: "none" }}
              _focus={{ bg: "none" }}
              px="16px"
              py="12px"
            >
              <Flex direction="column" align="start">
                <Text fontSize="sm" fontWeight="600" color={textColorBrand}>
                  {item.title}
                </Text>
                <Text fontSize="xs" color={useColorModeValue("gray.500", "gray.300")}>
                  {item.description}
                </Text>
              </Flex>
            </MenuItem>
          ))}
          <Divider borderColor={borderColor} />
          <MenuItem
            _hover={{ bg: "none" }}
            _focus={{ bg: "none" }}
            color="red.400"
            px="16px"
            py="12px"
            onClick={handleLogout}
            isDisabled={isLoggingOut}
          >
            <Flex align="center" gap="8px">
              {isLoggingOut && <Spinner size="xs" />}
              <Text fontSize="sm">
                {isLoggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
              </Text>
            </Flex>
          </MenuItem>
        </MenuList>
      </Menu>
    </Flex>
  );
};

HeaderLinks.propTypes = {
  variant: PropTypes.string,
  fixed: PropTypes.bool,
  secondary: PropTypes.bool,
  onOpen: PropTypes.func,
};

export default HeaderLinks;
