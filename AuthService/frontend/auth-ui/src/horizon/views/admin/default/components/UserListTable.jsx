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
} from "@chakra-ui/react";
import { MdEdit, MdDelete, MdEmail, MdPerson, MdVerified } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import { fetchUserList, deleteUserById, resetDeleteState } from "@/features/users/userListSlice";
import { hasAdminAccess } from "@/utils/auth";

export default function UserListTable() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const toast = useToast();
  const [deleteUserId, setDeleteUserId] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const cancelRef = React.useRef();

  const textColor = useColorModeValue("secondaryGray.900", "white");
  const textColorSecondary = useColorModeValue("secondaryGray.600", "white");
  const cardBg = useColorModeValue("white", "navy.800");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.100");
  const brandColor = useColorModeValue("brand.500", "brand.400");
  const hoverBg = useColorModeValue("gray.50", "whiteAlpha.50");

  const { data: users, status, error, deleteStatus, deleteError, pagination } = useSelector(
    (state) => state.userList
  );
  const { user } = useSelector((state) => state.auth);
  const isAdmin = hasAdminAccess(user);

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

  const handleConfirmDelete = () => {
    if (deleteUserId) {
      dispatch(deleteUserById(deleteUserId));
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
                  <Flex gap="10px" pt="10px">
                    <Button
                      flex="1"
                      size="sm"
                      leftIcon={<Icon as={MdEdit} w="16px" h="16px" />}
                      colorScheme="blue"
                      variant="outline"
                      onClick={() => handleEditClick(user.id)}
                    >
                      Chỉnh sửa
                    </Button>
                    <Button
                      flex="1"
                      size="sm"
                      leftIcon={<Icon as={MdDelete} w="16px" h="16px" />}
                      colorScheme="red"
                      variant="outline"
                      onClick={() => handleDeleteClick(user.id)}
                      isLoading={deleteStatus === "loading" && deleteUserId === user.id}
                    >
                      Xóa
                    </Button>
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

        {/* Pagination info */}
        {pagination && pagination.totalPages > 1 && (
          <Flex mt="20px" justify="center" align="center" gap="10px">
            <Text color={textColorSecondary} fontSize="sm">
              Trang {pagination.currentPage} / {pagination.totalPages}
            </Text>
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
    </Box>
  );
}

