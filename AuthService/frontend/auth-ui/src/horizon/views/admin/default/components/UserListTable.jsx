import React, { useEffect, useState } from "react";
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
  MdNote
} from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import { fetchUserList, deleteUserById, resetDeleteState } from "@/features/users/userListSlice";
import { fetchUserStats } from "@/features/users/userStatsSlice";
import { hasAdminAccess, isAdminOnly } from "@/utils/auth";
import { getUserById } from "@/services/userService";
import { getDocumentsByUserId } from "@/services/documentService";

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

  useEffect(() => {
    if (isAdmin && status === "idle") {
      dispatch(fetchUserList(1));
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
      const userResponse = await getUserById({ userId: user.id, accessToken });
      setUserDetails(userResponse.data || userResponse);

      // Load user documents
      const docsResponse = await getDocumentsByUserId({ userId: user.id, accessToken });
      setUserDocuments(docsResponse.data || []);

      // Load verification logs
      const logsResponse = await fetch(`http://localhost:8000/api/v1/users/${user.id}/verification-logs`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (logsResponse.ok) {
        const logsData = await logsResponse.json();
        setVerificationLogs(logsData.data || []);
      }
    } catch (error) {
      console.error("Error loading user details:", error);
      toast({
        status: "error",
        title: "Lỗi",
        description: "Không thể tải thông tin người dùng",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoadingUserDetails(false);
    }
  };

  const handleAdminVerify = async (user) => {
    try {
      const response = await fetch(`http://localhost:8000/api/v1/users/${user.id}`, {
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
        dispatch(fetchUserList(1));
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
  };

  const handleVerifySubmit = async () => {
    if (!verifyFormData.stationId.trim()) {
      toast({
        status: "warning",
        title: "Vui lòng nhập ID trạm",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setVerifying(true);
      const response = await fetch(`http://localhost:8000/api/v1/users/${selectedUser.id}/verify-onsite`, {
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
        dispatch(fetchUserList(1));
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

        {users && users.length > 0 ? (
          <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} gap="20px">
            {users.map((user) => (
              <Card
                key={user.id}
                bg={cardBg}
                border="1px solid"
                borderColor={borderColor}
                p="20px"
                borderRadius="15px"
                transition="all 0.2s"
                _hover={{
                  bg: hoverBg,
                  transform: "translateY(-2px)",
                  boxShadow: "lg",
                }}
              >
                <Flex direction="column" gap="15px">
                  {/* Header với ID và trạng thái */}
                  <Flex justify="space-between" align="center">
                    <Flex align="center" gap="8px">
                      <Icon as={MdPerson} w="20px" h="20px" color={brandColor} />
                      <Text color={textColorSecondary} fontSize="sm" fontWeight="500">
                        ID: {user.id}
                      </Text>
                    </Flex>
                    {getVerificationBadge(user.verificationStatus)}
                  </Flex>

                  {/* Thông tin user */}
                  <Box>
                    <Text color={textColor} fontSize="lg" fontWeight="700" mb="5px">
                      {user.fullName || "N/A"}
                    </Text>
                    <Flex align="center" gap="5px">
                      <Icon as={MdEmail} w="16px" h="16px" color={textColorSecondary} />
                      <Text color={textColorSecondary} fontSize="sm">
                        {user.email}
                      </Text>
                    </Flex>
                  </Box>

                  {/* Thông tin bổ sung */}
                  <Flex direction="column" gap="5px" pt="10px" borderTop="1px solid" borderColor={borderColor}>
                    <Flex justify="space-between">
                      <Text color={textColorSecondary} fontSize="xs">
                        Số điện thoại:
                      </Text>
                      <Text color={textColor} fontSize="xs" fontWeight="600">
                        {user.phoneNumber || "N/A"}
                      </Text>
                    </Flex>
                    <Flex justify="space-between">
                      <Text color={textColorSecondary} fontSize="xs">
                        Ngày tạo:
                      </Text>
                      <Text color={textColor} fontSize="xs" fontWeight="600">
                        {formatDate(user.createdAt)}
                      </Text>
                    </Flex>
                  </Flex>

                  {/* Action buttons */}
                  <Flex gap="8px" pt="10px" wrap="wrap">
                    <Button
                      size="sm"
                      leftIcon={<Icon as={MdVisibility} w="16px" h="16px" />}
                      colorScheme="teal"
                      variant="outline"
                      onClick={() => handleViewUser(user)}
                      flex="1"
                      minW="80px"
                    >
                      Xem
                    </Button>
                    <Button
                      size="sm"
                      leftIcon={<Icon as={MdCheckCircle} w="16px" h="16px" />}
                      colorScheme="green"
                      variant="outline"
                      onClick={() => isAdminStrict ? handleAdminVerify(user) : handleVerifyOnsite(user)}
                      isDisabled={user.verificationStatus === "VERIFIED"}
                      flex="1"
                      minW="80px"
                    >
                      {isAdminStrict ? "Xác thực" : "Xác thực tại điểm"}
                    </Button>
                    {isAdminStrict && (
                      <>
                        <Button
                          size="sm"
                          leftIcon={<Icon as={MdEdit} w="16px" h="16px" />}
                          colorScheme="blue"
                          variant="outline"
                          onClick={() => handleEditClick(user.id)}
                          flex="1"
                          minW="80px"
                        >
                          Sửa
                        </Button>
                        <Button
                          size="sm"
                          leftIcon={<Icon as={MdDelete} w="16px" h="16px" />}
                          colorScheme="red"
                          variant="outline"
                          onClick={() => handleDeleteClick(user.id)}
                          isLoading={deleteStatus === "loading" && deleteUserId === user.id}
                          flex="1"
                          minW="80px"
                        >
                          Xóa
                        </Button>
                      </>
                    )}
                  </Flex>
                </Flex>
              </Card>
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
                onClick={() => dispatch(fetchUserList(1))}
                isDisabled={pagination.currentPage === 1}
              >
                Đầu
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => dispatch(fetchUserList(pagination.currentPage - 1))}
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
                    onClick={() => dispatch(fetchUserList(pageNum))}
                    minW="40px"
                  >
                    {pageNum}
                  </Button>
                );
              })}
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => dispatch(fetchUserList(pagination.currentPage + 1))}
                isDisabled={pagination.currentPage === pagination.totalPages}
              >
                Sau
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => dispatch(fetchUserList(pagination.totalPages))}
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

      {/* View User Info Modal */}
      <Modal isOpen={isViewOpen} onClose={onViewClose} size="4xl" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Thông tin người dùng</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {loadingUserDetails ? (
              <Flex justify="center" align="center" minH="200px">
                <Spinner size="xl" color={brandColor} thickness="4px" />
              </Flex>
            ) : userDetails ? (
              <VStack spacing="20px" align="stretch">
                {/* User Basic Info */}
                <Box p="20px" bg={useColorModeValue("gray.50", "navy.700")} borderRadius="12px">
                  <Text fontSize="lg" fontWeight="700" color={textColor} mb="15px">
                    Thông tin cơ bản
                  </Text>
                  <SimpleGrid columns={{ base: 1, md: 2 }} gap="15px">
                    <Box>
                      <Text fontSize="sm" color={textColorSecondary} mb="5px">
                        Họ và tên
                      </Text>
                      <Text fontWeight="600" color={textColor}>
                        {userDetails.fullName || "N/A"}
                      </Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color={textColorSecondary} mb="5px">
                        Email
                      </Text>
                      <Text fontWeight="600" color={textColor}>
                        {userDetails.email}
                      </Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color={textColorSecondary} mb="5px">
                        Số điện thoại
                      </Text>
                      <Text fontWeight="600" color={textColor}>
                        {userDetails.phoneNumber || "N/A"}
                      </Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color={textColorSecondary} mb="5px">
                        Vai trò
                      </Text>
                      <Badge colorScheme="blue">{userDetails.role || "RENTER"}</Badge>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color={textColorSecondary} mb="5px">
                        Trạng thái xác thực
                      </Text>
                      {getVerificationBadge(userDetails.verificationStatus)}
                    </Box>
                    <Box>
                      <Text fontSize="sm" color={textColorSecondary} mb="5px">
                        Ngày đăng ký
                      </Text>
                      <Text fontWeight="600" color={textColor}>
                        {formatDate(userDetails.createdAt)}
                      </Text>
                    </Box>
                  </SimpleGrid>
                </Box>

                {/* Documents */}
                <Box>
                  <Text fontSize="lg" fontWeight="700" color={textColor} mb="15px">
                    Giấy tờ đã upload
                  </Text>
                  {userDocuments.length > 0 ? (
                    <SimpleGrid columns={{ base: 1, md: 2 }} gap="15px">
                      {userDocuments.map((doc) => (
                        <Card key={doc.id} p="15px" border="1px solid" borderColor={borderColor}>
                          <VStack align="stretch" spacing="10px">
                            <Flex justify="space-between" align="center">
                              <Text fontWeight="600" color={textColor}>
                                {doc.documentType === "DRIVER_LICENSE" ? "Bằng lái xe" : "CCCD"}
                              </Text>
                              {getVerificationBadge(doc.status)}
                            </Flex>
                            {doc.fileUrl && (
                              <Box>
                                <Image
                                  src={doc.fileUrl}
                                  alt="Document"
                                  maxH="200px"
                                  objectFit="contain"
                                  borderRadius="8px"
                                />
                              </Box>
                            )}
                            <Text fontSize="sm" color={textColorSecondary}>
                              Upload: {formatDate(doc.uploadedAt)}
                            </Text>
                          </VStack>
                        </Card>
                      ))}
                    </SimpleGrid>
                  ) : (
                    <Text color={textColorSecondary}>Chưa có giấy tờ nào</Text>
                  )}
                </Box>

                {/* Verification Logs */}
                <Box>
                  <Text fontSize="lg" fontWeight="700" color={textColor} mb="15px">
                    Lịch sử xác thực tại điểm
                  </Text>
                  {verificationLogs.length > 0 ? (
                    <VStack spacing="10px" align="stretch">
                      {verificationLogs.map((log) => (
                        <Card key={log.id} p="15px" border="1px solid" borderColor={borderColor}>
                          <VStack align="stretch" spacing="8px">
                            <Flex justify="space-between" align="center">
                              <HStack>
                                <Icon as={MdLocationOn} color={brandColor} />
                                <Text fontWeight="600" color={textColor}>
                                  Trạm: {log.stationName || log.stationId || "N/A"}
                                </Text>
                              </HStack>
                              <Text fontSize="sm" color={textColorSecondary}>
                                {formatDate(log.createdAt)}
                              </Text>
                            </Flex>
                            {log.staffName && (
                              <HStack>
                                <Icon as={MdPerson} color={brandColor} />
                                <Text fontSize="sm" color={textColor}>
                                  Xác thực bởi: {log.staffName}
                                </Text>
                                
                              </HStack>
                            )}
                            {log.staffId && (
                              <HStack>
                                <Icon as={MdPerson} color={brandColor} />
                                <Text fontSize="sm" color={textColor}>
                                  Id: {log.staffId}
                                </Text>
                                
                              </HStack>
                            )}
                            {log.note && (
                              <HStack align="start">
                                <Icon as={MdNote} color={brandColor} mt="2px" />
                                <Text fontSize="sm" color={textColor}>
                                  {log.note}
                                </Text>
                              </HStack>
                            )}
                          </VStack>
                        </Card>
                      ))}
                    </VStack>
                  ) : (
                    <Text color={textColorSecondary}>Chưa có lịch sử xác thực nào</Text>
                  )}
                </Box>
              </VStack>
            ) : (
              <Text color={textColorSecondary}>Không thể tải thông tin người dùng</Text>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={onViewClose}>Đóng</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

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
                <FormLabel>ID Trạm</FormLabel>
                <Input
                  placeholder="Nhập ID trạm (VD: STATION_001)"
                  value={verifyFormData.stationId}
                  onChange={(e) => setVerifyFormData({ ...verifyFormData, stationId: e.target.value })}
                />
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
