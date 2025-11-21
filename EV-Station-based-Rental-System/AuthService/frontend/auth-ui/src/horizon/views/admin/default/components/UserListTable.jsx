import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  Flex,
  Icon,
  IconButton,
  Text,
  useColorModeValue,
  useToast,
  SimpleGrid,
  Badge,
  Spinner,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  AlertDialogCloseButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  VStack,
  HStack,
  Image,
  Divider,
  FormControl,
  FormLabel,
  Select,
  Input,
  Textarea,
} from "@chakra-ui/react";
import { 
  MdEdit, 
  MdDelete, 
  MdEmail, 
  MdPerson, 
  MdVerified, 
  MdVisibility,
  MdPhone,
  MdCalendarToday,
  MdBadge,
  MdWarning,
  MdCheckCircle,
  MdImage,
  MdLocationOn,
  MdNote,
  MdSearch,
  MdClear
} from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import { fetchUserList, deleteUserById, resetDeleteState } from "@/features/users/userListSlice";
import { fetchUserStats } from "@/features/users/userStatsSlice";
import { hasAdminAccess, isAdminOnly } from "@/utils/auth";
import userService from "@/services/userService";
import { getDocumentsByUserId } from "@/services/documentService";
import { fetchStations as fetchExternalStations } from "@/services/external/stationService";
import AdvancedSearchBox from "./AdvancedSearchBox";
import UserCard from "./UserCard";
import UserDetailsModal from "./UserDetailsModal";
import { buildApiUrl } from "@/config/apiConfig";
import debounce from "lodash.debounce";

export default function UserListTable() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const toast = useToast();
  const [deleteUserId, setDeleteUserId] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const cancelRef = React.useRef();

  // View User Info Modal
  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure();
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [userDocuments, setUserDocuments] = useState([]);
  const [verificationLogs, setVerificationLogs] = useState([]);
  const [loadingUserDetails, setLoadingUserDetails] = useState(false);

  // Verify Onsite Modal
  const { isOpen: isVerifyOpen, onOpen: onVerifyOpen, onClose: onVerifyClose } = useDisclosure();
  const [verifyFormData, setVerifyFormData] = useState({
    stationId: "",
    note: "",
  });
  const [verifying, setVerifying] = useState(false);
  const [stations, setStations] = useState([]);
  const [loadingStations, setLoadingStations] = useState(false);

  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    role: null,
    verificationStatus: null,
    riskStatus: null,
    dateFrom: null,
    dateTo: null,
  });

  const textColor = useColorModeValue("secondaryGray.900", "white");
  const textColorSecondary = useColorModeValue("secondaryGray.600", "white");
  const cardBg = useColorModeValue("white", "navy.800");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.100");
  const brandColor = useColorModeValue("brand.500", "brand.400");
  const hoverBg = useColorModeValue("gray.50", "whiteAlpha.50");

  const { data: users, status, error, deleteStatus, deleteError, pagination } = useSelector(
    (state) => state.userList
  );
  const { user, accessToken } = useSelector((state) => state.auth);
  const isAdmin = hasAdminAccess(user);
  const isAdminStrict = isAdminOnly(user);

  // Handle search from AdvancedSearchBox
  const handleAdvancedSearch = (searchValue) => {
    setSearchTerm(searchValue);
    dispatch(fetchUserList({ 
      page: 1, 
      search: searchValue.trim() || null,
      ...filters
    }));
  };

  // Handle filters change from AdvancedSearchBox
  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    dispatch(fetchUserList({ 
      page: 1, 
      search: searchTerm.trim() || null,
      ...newFilters
    }));
  };

  useEffect(() => {
    if (isAdmin && status === "idle") {
      dispatch(fetchUserList({ page: 1 }));
    }
  }, [dispatch, status, isAdmin]);

  useEffect(() => {
    if (status === "failed" && error) {
      toast({
        status: "error",
        title: "Lỗi",
        description: error,
        duration: 4000,
        isClosable: true,
        position: "bottom-right",
      });
    }
  }, [status, error, toast]);

  useEffect(() => {
    if (deleteStatus === "succeeded") {
      toast({
        status: "success",
        title: "Thành công",
        description: "Xóa người dùng thành công",
        duration: 3000,
        isClosable: true,
        position: "bottom-right",
      });
      dispatch(resetDeleteState());
    } else if (deleteStatus === "failed" && deleteError) {
      toast({
        status: "error",
        title: "Lỗi",
        description: deleteError,
        duration: 4000,
        isClosable: true,
        position: "bottom-right",
      });
      dispatch(resetDeleteState());
    }
  }, [deleteStatus, deleteError, toast, dispatch]);

  const handleEditClick = (userId) => {
    // Điều hướng đến trang chỉnh sửa người dùng
    navigate("/admin/edit-user", { state: { userId } });
  };

  const handleDeleteClick = (userId) => {
    setDeleteUserId(userId);
    setIsDeleteDialogOpen(true);
  };

  const handleViewUser = async (user) => {
    setSelectedUser(user);
    setLoadingUserDetails(true);
    onViewOpen();

    try {
      // Load user details
      const userResponse = await userService.getUserById({ userId: user.id, accessToken });
      console.log('User details response:', userResponse);
      console.log('Response.data:', userResponse.data);
      
      // Xử lý các trường hợp response structure khác nhau
      let userDetails = null;
      
      if (userResponse.data?.data) {
        // Case 1: response.data = { success: true, data: {...} }
        const extracted = userResponse.data.data;
        if (Array.isArray(extracted)) {
          // Nếu là array, tìm user theo ID
          userDetails = extracted.find(u => u.id === user.id) || extracted[0];
        } else {
          userDetails = extracted;
        }
      } else if (userResponse.data) {
        // Case 2: response.data là object hoặc array trực tiếp
        const extracted = userResponse.data;
        if (Array.isArray(extracted)) {
          // Nếu là array, tìm user theo ID
          userDetails = extracted.find(u => u.id === user.id) || extracted[0];
        } else {
          userDetails = extracted;
        }
      } else {
        // Case 3: response chính là user object hoặc array
        if (Array.isArray(userResponse)) {
          userDetails = userResponse.find(u => u.id === user.id) || userResponse[0];
        } else {
          userDetails = userResponse;
        }
      }
      
      console.log('Extracted user details:', userDetails);
      console.log('All userDetails keys:', userDetails ? Object.keys(userDetails) : 'null');
      console.log('Phone number:', userDetails?.phoneNumber, 'Type:', typeof userDetails?.phoneNumber);
      console.log('Phone_number (snake_case):', userDetails?.phone_number);
      
      if (!userDetails || (typeof userDetails === 'object' && !userDetails.id)) {
        console.error("Invalid user details structure:", { userDetails, userResponse });
        throw new Error("Không tìm thấy thông tin người dùng");
      }
      
      // Đảm bảo phoneNumber được set đúng (có thể là null, undefined, hoặc empty string)
      // Kiểm tra cả camelCase và snake_case
      if (!userDetails.phoneNumber && userDetails.phone_number) {
        userDetails.phoneNumber = userDetails.phone_number;
      }
      if (!userDetails.phoneNumber && userDetails.phone) {
        userDetails.phoneNumber = userDetails.phone;
      }
      
      console.log('Final phoneNumber:', userDetails.phoneNumber);
      
      setUserDetails(userDetails);

      // Load user documents
      const docsResponse = await getDocumentsByUserId({ userId: user.id, accessToken });
      // Xử lý documents response tương tự
      const documents = Array.isArray(docsResponse.data) ? docsResponse.data : (docsResponse.data?.data || docsResponse.data || []);
      setUserDocuments(documents);

      // Load verification logs
      const logsResponse = await fetch(buildApiUrl(`/api/v1/users/${user.id}/verification-logs`), {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (logsResponse.ok) {
        const logsData = await logsResponse.json();
        // Xử lý logs response tương tự
        const logs = Array.isArray(logsData.data) ? logsData.data : (logsData.data?.data || logsData.data || []);
        setVerificationLogs(logs);
      }
    } catch (error) {
      console.error("Error loading user details:", error);
      toast({
        status: "error",
        title: "Lỗi",
        description: error.message || "Không thể tải thông tin người dùng",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoadingUserDetails(false);
    }
  };

  const handleAdminVerify = async (user) => {
    try {
      const response = await fetch(buildApiUrl(`/api/v1/users/${user.id}`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          verificationStatus: 'VERIFIED'
        }),
      });

      if (response.ok) {
        toast({
          status: "success",
          title: "Thành công",
          description: `Đã xác thực user ${user.fullName}`,
          duration: 3000,
          isClosable: true,
        });
        // Refresh user list and stats
        dispatch(fetchUserList({ page: 1, search: searchTerm }));
        dispatch(fetchUserStats());
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Xác thực thất bại");
      }
    } catch (error) {
      toast({
        status: "error",
        title: "Lỗi",
        description: error.message || "Không thể xác thực user",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleVerifyOnsite = async (user) => {
    setSelectedUser(user);
    setVerifyFormData({ stationId: "", note: "" });
    onVerifyOpen();
    setLoadingStations(true);
    try {
      const data = await fetchExternalStations();
      setStations(Array.isArray(data) ? data : []);
    } catch (e) {
      toast({
        status: "error",
        title: "Lỗi",
        description: "Không thể tải danh sách trạm",
        duration: 3000,
        isClosable: true,
      });
      setStations([]);
    } finally {
      setLoadingStations(false);
    }
  };

  const handleVerifySubmit = async () => {
    if (!verifyFormData.stationId.trim()) {
      toast({
        status: "warning",
        title: "Vui lòng chọn trạm",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setVerifying(true);
      const response = await fetch(buildApiUrl(`/api/v1/users/${selectedUser.id}/verify-onsite`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(verifyFormData),
      });

      if (response.ok) {
        toast({
          status: "success",
          title: "Thành công",
          description: "Xác thực tại điểm thành công",
          duration: 3000,
          isClosable: true,
        });
        onVerifyClose();
        // Refresh user list and stats
        dispatch(fetchUserList({ page: 1, search: searchTerm }));
        dispatch(fetchUserStats());
        // Refresh user details if view modal is open
        if (isViewOpen) {
          handleViewUser(selectedUser);
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Xác thực thất bại");
      }
    } catch (error) {
      toast({
        status: "error",
        title: "Lỗi",
        description: error.message || "Không thể xác thực người dùng",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleConfirmDelete = () => {
    if (deleteUserId) {
      dispatch(deleteUserById(deleteUserId));
      // Refresh stats after delete
      dispatch(fetchUserStats());
    }
    setIsDeleteDialogOpen(false);
    setDeleteUserId(null);
  };

  const handleCancelDelete = () => {
    setIsDeleteDialogOpen(false);
    setDeleteUserId(null);
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
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  if (!isAdmin) {
    return (
      <Card bg={cardBg} p="20px" borderRadius="20px">
        <Text color={textColor} fontSize="lg" fontWeight="700">
          Bạn không có quyền truy cập danh sách người dùng
        </Text>
      </Card>
    );
  }

  if (status === "loading") {
    return (
      <Card bg={cardBg} p="40px" borderRadius="20px">
        <Flex justify="center" align="center" direction="column" gap="10px">
          <Spinner size="xl" color={brandColor} thickness="4px" />
          <Text color={textColorSecondary}>Đang tải danh sách người dùng...</Text>
        </Flex>
      </Card>
    );
  }

  return (
    <Box>
      <Card bg={cardBg} p="20px" borderRadius="20px">
        <Flex mb="20px" justify="space-between" align="center">
          <Text color={textColor} fontSize="xl" fontWeight="700">
            Danh sách người dùng
          </Text>
          {pagination && (
            <Text color={textColorSecondary} fontSize="sm">
              Tổng: {pagination.totalItems} người dùng
            </Text>
          )}
        </Flex>

        {/* Advanced Search Box */}
        <AdvancedSearchBox
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onSearch={handleAdvancedSearch}
          onFiltersChange={handleFiltersChange}
          isLoading={status === "loading"}
          placeholder="Tìm kiếm theo tên, email, số điện thoại..."
        />

        {users && users.length > 0 ? (
          <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} gap="20px">
            {users.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                onView={handleViewUser}
                onEdit={handleEditClick}
                onDelete={handleDeleteClick}
                onVerify={(u) => (isAdminStrict ? handleAdminVerify(u) : handleVerifyOnsite(u))}
                isAdminStrict={isAdminStrict}
                deleteStatus={deleteStatus}
                deleteUserId={deleteUserId}
                ui={{ textColor, textColorSecondary, cardBg, borderColor, hoverBg, brandColor }}
                helpers={{ getVerificationBadge, formatDate }}
              />
            ))}
          </SimpleGrid>
        ) : (
          <Flex justify="center" align="center" p="40px">
            <Text color={textColorSecondary} fontSize="md">
              Không có người dùng nào
            </Text>
          </Flex>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <Flex mt="20px" justify="space-between" align="center" wrap="wrap" gap="10px">
            <Text color={textColorSecondary} fontSize="sm">
              Trang {pagination.currentPage} / {pagination.totalPages} • Tổng {pagination.totalItems} người dùng
            </Text>
            
            <Flex gap="5px" align="center">
              <Button
                size="sm"
                variant="outline"
                onClick={() => dispatch(fetchUserList({ page: 1, search: searchTerm, ...filters }))}
                isDisabled={pagination.currentPage === 1}
              >
                Đầu
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => dispatch(fetchUserList({ page: pagination.currentPage - 1, search: searchTerm, ...filters }))}
                isDisabled={pagination.currentPage === 1}
              >
                Trước
              </Button>
              
              {/* Page numbers */}
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum;
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (pagination.currentPage <= 3) {
                  pageNum = i + 1;
                } else if (pagination.currentPage >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = pagination.currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    size="sm"
                    variant={pageNum === pagination.currentPage ? "solid" : "outline"}
                    colorScheme={pageNum === pagination.currentPage ? "blue" : "gray"}
                    onClick={() => dispatch(fetchUserList({ page: pageNum, search: searchTerm, ...filters }))}
                    minW="40px"
                  >
                    {pageNum}
                  </Button>
                );
              })}
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => dispatch(fetchUserList({ page: pagination.currentPage + 1, search: searchTerm, ...filters }))}
                isDisabled={pagination.currentPage === pagination.totalPages}
              >
                Sau
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => dispatch(fetchUserList({ page: pagination.totalPages, search: searchTerm, ...filters }))}
                isDisabled={pagination.currentPage === pagination.totalPages}
              >
                Cuối
              </Button>
            </Flex>
          </Flex>
        )}
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isDeleteDialogOpen}
        leastDestructiveRef={cancelRef}
        onClose={handleCancelDelete}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Xác nhận xóa người dùng
            </AlertDialogHeader>
            <AlertDialogCloseButton />

            <AlertDialogBody>
              Bạn có chắc chắn muốn xóa người dùng này không? Hành động này không thể hoàn tác.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={handleCancelDelete}>
                Hủy
              </Button>
              <Button colorScheme="red" onClick={handleConfirmDelete} ml={3}>
                Xóa
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      <UserDetailsModal
        mb="20px"
        mt="20px"
        isOpen={isViewOpen}
        onClose={onViewClose}
        loading={loadingUserDetails}
        userDetails={userDetails}
        userDocuments={userDocuments}
        verificationLogs={verificationLogs}
        ui={{ textColor, textColorSecondary, borderColor, brandColor }}
        helpers={{ getVerificationBadge, getRiskBadge, formatDate }}
      />

      {/* Verify Onsite Modal */}
      <Modal isOpen={isVerifyOpen} onClose={onVerifyClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Xác thực tại điểm thuê</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing="15px" align="stretch">
              <Box p="10px" bg={useColorModeValue("gray.50", "navy.700")} borderRadius="8px">
                <Text fontSize="sm" color={textColorSecondary} mb="5px">
                  Người dùng
                </Text>
                <Text fontWeight="600" color={textColor}>
                  {selectedUser?.fullName} ({selectedUser?.email})
                </Text>
              </Box>

              <FormControl isRequired>
                <FormLabel>Trạm</FormLabel>
                <Select
                  placeholder={loadingStations ? "Đang tải danh sách trạm..." : "Chọn trạm"}
                  isDisabled={loadingStations}
                  value={verifyFormData.stationId}
                  onChange={(e) => setVerifyFormData({ ...verifyFormData, stationId: e.target.value })}
                >
                  {stations.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} — {st.address}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Ghi chú</FormLabel>
                <Textarea
                  placeholder="Ghi chú về việc xác thực..."
                  value={verifyFormData.note}
                  onChange={(e) => setVerifyFormData({ ...verifyFormData, note: e.target.value })}
                  rows={3}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onVerifyClose}>
              Hủy
            </Button>
            <Button colorScheme="green" onClick={handleVerifySubmit} isLoading={verifying}>
              Xác thực
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
