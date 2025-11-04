import React, { useEffect, useState } from "react";
import { Box, SimpleGrid, Spinner, Text, useColorModeValue, Flex, useDisclosure, Badge } from "@chakra-ui/react";
import { useSelector } from "react-redux";
import userService from "@/services/userService";
import UserCard from "views/admin/default/components/UserCard";
import UserDetailsModal from "views/admin/default/components/UserDetailsModal";

export default function RiskyUsersPage() {
  const { accessToken } = useSelector((state) => state.auth);
  const [bannedUsers, setBannedUsers] = useState([]);
  const [warnedUsers, setWarnedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const textColorSecondary = useColorModeValue("secondaryGray.600", "white");
  const textColor = useColorModeValue("secondaryGray.900", "white");
  const cardBg = useColorModeValue("white", "navy.800");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.100");
  const brandColor = useColorModeValue("brand.500", "brand.400");
  const hoverBg = useColorModeValue("gray.50", "whiteAlpha.50");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [bannedRes, warnedRes] = await Promise.all([
          userService.fetchUsers({ page: 1, riskStatus: "BANNED", accessToken }),
          userService.fetchUsers({ page: 1, riskStatus: "WARNED", accessToken }),
        ]);
        console.log('Banned response:', bannedRes);
        console.log('Warned response:', warnedRes);
        setBannedUsers(bannedRes.data || bannedRes || []);
        setWarnedUsers(warnedRes.data || warnedRes || []);
      } catch (e) {
        setBannedUsers([]);
        setWarnedUsers([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [accessToken]);

  const openView = async (user) => {
    setSelectedUser(user);
    setUserDetails(null);
    setLoadingDetails(true);
    onOpen();
    try {
      const res = await userService.getUserById({ userId: user.id, accessToken });
      console.log('Risky user details response:', res);
      console.log('Risky user riskStatus:', res.data?.data?.riskStatus || res.data?.riskStatus || res.riskStatus);
      setUserDetails(res.data?.data || res.data || res);
    } catch (e) {
      setUserDetails(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  const getVerificationBadge = (status) => {
    const statusConfig = {
      VERIFIED: { label: "Đã xác thực", colorScheme: "green" },
      PENDING: { label: "Chờ xác thực", colorScheme: "orange" },
      REJECTED: { label: "Từ chối", colorScheme: "red" },
    };
    const config = statusConfig[status] || statusConfig.PENDING;
    return <Badge colorScheme={config.colorScheme}>{config.label}</Badge>;
  };

  const getRiskBadge = (status) => {
    const statusConfig = {
      NONE: { label: "Không", colorScheme: "green" },
      WARNED: { label: "Cảnh báo", colorScheme: "yellow" },
      BANNED: { label: "Cấm", colorScheme: "red" },
    };
    const config = statusConfig[status] || statusConfig.NONE;
    return <Badge colorScheme={config.colorScheme}>{config.label}</Badge>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", { year: "numeric", month: "2-digit", day: "2-digit" });
  };

  return (
    <Box pt={{ base: "130px", md: "80px", xl: "80px" }}>
      {loading ? (
        <Spinner />
      ) : (
        <>
          <Box mb="20px">
            <Text fontSize="lg" fontWeight="700" color={textColor} mb="10px">Khách hàng rủi ro - BANNED</Text>
            <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} gap="20px">
              {(bannedUsers || []).map((u) => (
                <UserCard
                  key={u.id}
                  user={u}
                  onView={openView}
                  onEdit={() => {}}
                  onVerify={() => {}}
                  isAdminStrict={false}
                  deleteStatus={"idle"}
                  deleteUserId={null}
                  ui={{ textColor, textColorSecondary, cardBg, borderColor, hoverBg, brandColor }}
                  helpers={{ getVerificationBadge, formatDate }}
                />
              ))}
            </SimpleGrid>
          </Box>
          <Box>
            <Text fontSize="lg" fontWeight="700" color={textColor} mb="10px">Khách hàng rủi ro - WARNED</Text>
            <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} gap="20px">
              {(warnedUsers || []).map((u) => (
                <UserCard
                  key={u.id}
                  user={u}
                  onView={openView}
                  onEdit={() => {}}
                  onVerify={() => {}}
                  isAdminStrict={false}
                  deleteStatus={"idle"}
                  deleteUserId={null}
                  ui={{ textColor, textColorSecondary, cardBg, borderColor, hoverBg, brandColor }}
                  helpers={{ getVerificationBadge, formatDate }}
                />
              ))}
            </SimpleGrid>
          </Box>
        </>
      )}
      {!loading && bannedUsers.length === 0 && warnedUsers.length === 0 && (
        <Text color={textColorSecondary}>Không có khách hàng rủi ro.</Text>
      )}
      <UserDetailsModal
        isOpen={isOpen}
        onClose={onClose}
        loading={loadingDetails}
        userDetails={userDetails}
        userDocuments={[]}
        verificationLogs={[]}
        ui={{ textColor, textColorSecondary, borderColor, brandColor }}
        helpers={{
          getVerificationBadge,
          getRiskBadge,
          formatDate,
        }}
      />
    </Box>
  );
}


