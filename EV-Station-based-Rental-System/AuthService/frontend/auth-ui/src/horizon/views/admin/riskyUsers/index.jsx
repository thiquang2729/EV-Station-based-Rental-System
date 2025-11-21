import React, { useEffect, useState } from "react";
import { Box, SimpleGrid, Spinner, Text, useColorModeValue, Flex, useDisclosure, Badge } from "@chakra-ui/react";
import { useSelector } from "react-redux";
import userService from "@/services/userService";
import { getDocumentsByUserId } from "@/services/documentService";
import { buildApiUrl } from "@/config/apiConfig";
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
  const [userDocuments, setUserDocuments] = useState([]);
  const [verificationLogs, setVerificationLogs] = useState([]);
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
        
        // Xử lý response structure: { success: true, data: [...], pagination: {...} }
        let bannedUsersList = [];
        if (bannedRes?.data) {
          bannedUsersList = Array.isArray(bannedRes.data) ? bannedRes.data : [];
        } else if (Array.isArray(bannedRes)) {
          bannedUsersList = bannedRes;
        }
        
        let warnedUsersList = [];
        if (warnedRes?.data) {
          warnedUsersList = Array.isArray(warnedRes.data) ? warnedRes.data : [];
        } else if (Array.isArray(warnedRes)) {
          warnedUsersList = warnedRes;
        }
        
        setBannedUsers(bannedUsersList);
        setWarnedUsers(warnedUsersList);
      } catch (e) {
        console.error('Error loading risky users:', e);
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
      console.log('Response.data:', res.data);
      
      // Xử lý các trường hợp response structure khác nhau
      let userDetails = null;
      
      if (res.data?.data) {
        // Case 1: response.data = { success: true, data: {...} }
        const extracted = res.data.data;
        if (Array.isArray(extracted)) {
          // Nếu là array, tìm user theo ID
          userDetails = extracted.find(u => u.id === user.id) || extracted[0];
        } else {
          userDetails = extracted;
        }
      } else if (res.data) {
        // Case 2: response.data là object hoặc array trực tiếp
        const extracted = res.data;
        if (Array.isArray(extracted)) {
          // Nếu là array, tìm user theo ID
          userDetails = extracted.find(u => u.id === user.id) || extracted[0];
        } else {
          userDetails = extracted;
        }
      } else {
        // Case 3: response chính là user object hoặc array
        if (Array.isArray(res)) {
          userDetails = res.find(u => u.id === user.id) || res[0];
        } else {
          userDetails = res;
        }
      }
      
      console.log('Extracted risky user details:', userDetails);
      
      if (!userDetails || (typeof userDetails === 'object' && !userDetails.id)) {
        console.error("Invalid user details structure:", { userDetails, res });
        throw new Error("Không tìm thấy thông tin người dùng");
      }
      
      // Đảm bảo phoneNumber được set đúng
      if (!userDetails.phoneNumber && userDetails.phone_number) {
        userDetails.phoneNumber = userDetails.phone_number;
      }
      if (!userDetails.phoneNumber && userDetails.phone) {
        userDetails.phoneNumber = userDetails.phone;
      }
      
      setUserDetails(userDetails);

      // Load user documents
      try {
        const docsResponse = await getDocumentsByUserId({ userId: user.id, accessToken });
        const documents = Array.isArray(docsResponse.data) ? docsResponse.data : (docsResponse.data?.data || docsResponse.data || []);
        setUserDocuments(documents);
      } catch (docsError) {
        console.error('Error loading documents:', docsError);
        setUserDocuments([]);
      }

      // Load verification logs
      try {
        const logsResponse = await fetch(buildApiUrl(`/api/v1/users/${user.id}/verification-logs`), {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });
        if (logsResponse.ok) {
          const logsData = await logsResponse.json();
          const logs = Array.isArray(logsData.data) ? logsData.data : (logsData.data?.data || logsData.data || []);
          setVerificationLogs(logs);
        } else {
          setVerificationLogs([]);
        }
      } catch (logsError) {
        console.error('Error loading verification logs:', logsError);
        setVerificationLogs([]);
      }
    } catch (e) {
      console.error('Error loading risky user details:', e);
      setUserDetails(null);
      setUserDocuments([]);
      setVerificationLogs([]);
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
                  onDelete={() => {}}
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
                  onDelete={() => {}}
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
        userDocuments={userDocuments}
        verificationLogs={verificationLogs}
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


