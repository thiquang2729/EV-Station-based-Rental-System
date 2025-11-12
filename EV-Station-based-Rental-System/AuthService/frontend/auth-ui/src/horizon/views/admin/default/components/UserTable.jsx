import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
  Flex,
  Icon,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  useDisclosure,
} from "@chakra-ui/react";
import {
  MdEmail,
  MdOutlineDelete,
  MdOutlineEdit,
  MdVerified,
} from "react-icons/md";
import Card from "components/card/Card";
import { useState } from "react";

const getStatusBadge = (status, textColor) => {
  const normalized = (status || "").toUpperCase();

  if (normalized === "VERIFIED") {
    return (
      <Flex align="center" gap="2">
        <Icon as={MdVerified} color="green.500" />
        <Text fontSize="sm" fontWeight="600" color={textColor}>
          Đã xác thực
        </Text>
      </Flex>
    );
  }

  if (normalized === "PENDING") {
    return (
      <Flex align="center" gap="2">
        <Icon as={MdVerified} color="orange.500" />
        <Text fontSize="sm" fontWeight="600" color={textColor}>
          Chờ xác thực
        </Text>
      </Flex>
    );
  }

  if (normalized === "REJECTED") {
    return (
      <Flex align="center" gap="2">
        <Icon as={MdVerified} color="red.500" />
        <Text fontSize="sm" fontWeight="600" color={textColor}>
          Từ chối
        </Text>
      </Flex>
    );
  }

  return (
    <Flex align="center" gap="2">
      <Icon as={MdVerified} color="gray.500" />
      <Text fontSize="sm" fontWeight="600" color={textColor}>
        {status || "Không xác định"}
      </Text>
    </Flex>
  );
};

const UserTable = ({
  title,
  users,
  loading,
  error,
  pagination,
  onEdit,
  onDelete,
}) => {
  const textColor = useColorModeValue("secondaryGray.900", "white");
  const headerColor = useColorModeValue("gray.600", "gray.300");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.100");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedUser, setSelectedUser] = useState(null);

  const handleDeleteClick = (user) => {
    setSelectedUser(user);
    onOpen();
  };

  const confirmDelete = () => {
    if (typeof onDelete === "function" && selectedUser) {
      onDelete(selectedUser);
    }
    onClose();
  };

  const renderContent = () => {
    if (loading) {
      return (
        <Flex align="center" justify="center" py="40px">
          <Spinner size="lg" />
        </Flex>
      );
    }

    if (error) {
      return (
        <Alert status="error" borderRadius="12px" mt="4">
          <AlertIcon />
          <Box>
            <AlertTitle>Lỗi tải danh sách người dùng</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Box>
        </Alert>
      );
    }

    if (!users || users.length === 0) {
      return (
        <Flex align="center" justify="center" py="32px">
          <Text color={headerColor}>Chưa có người dùng nào.</Text>
        </Flex>
      );
    }

    return (
      <Table variant="simple" mt="12px">
        <Thead>
          <Tr>
            <Th color={headerColor}>Họ tên</Th>
            <Th color={headerColor}>Email</Th>
            <Th color={headerColor}>Trạng thái xác thực</Th>
            <Th color={headerColor}>Rủi ro</Th>
            <Th color={headerColor} textAlign="right">
              Hành động
            </Th>
          </Tr>
        </Thead>
        <Tbody>
          {users.map((user) => (
            <Tr key={user.id} borderColor={borderColor}>
              <Td>
                <Text fontWeight="600" color={textColor}>
                  {user.fullName || "Không xác định"}
                </Text>
              </Td>
              <Td>
                <Flex align="center" gap="2">
                  <Icon as={MdEmail} color="blue.400" />
                  <Text color={textColor}>{user.email}</Text>
                </Flex>
              </Td>
              <Td>{getStatusBadge(user.verificationStatus, textColor)}</Td>
              <Td>
                <Text color={textColor} fontSize="sm" fontWeight="500">
                  {user.riskStatus || "NONE"}
                </Text>
              </Td>
              <Td textAlign="right">
                <Flex justify="flex-end" gap="2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEdit?.(user)}
                    leftIcon={<Icon as={MdOutlineEdit} />}
                  >
                    Chỉnh sửa
                  </Button>
                  <Button
                    size="sm"
                    colorScheme="red"
                    onClick={() => handleDeleteClick(user)}
                    leftIcon={<Icon as={MdOutlineDelete} />}
                  >
                    Xóa
                  </Button>
                </Flex>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    );
  };

  return (
    <Card w="100%" px="0px" overflowX={{ base: "auto", lg: "hidden" }}>
      <Flex px="24px" pt="18px" pb="12px" justify="space-between" align="center">
        <Box>
          <Text color={textColor} fontSize="24px" fontWeight="700" lineHeight="100%">
            {title}
          </Text>
          {pagination ? (
            <Text color={headerColor} fontSize="sm" mt="2">
              Trang {pagination.currentPage}/{pagination.totalPages} • Tổng {pagination.totalItems} người dùng
            </Text>
          ) : null}
        </Box>
      </Flex>
      <Box px="24px" pb="24px">
        {renderContent()}
      </Box>

      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Xác nhận xóa</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>
              Bạn có chắc muốn xóa người dùng{" "}
              <Text as="span" fontWeight="600">
                {selectedUser?.fullName || selectedUser?.email}
              </Text>
              ? Hành động này không thể hoàn tác.
            </Text>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Hủy
            </Button>
            <Button colorScheme="red" onClick={confirmDelete}>
              Xóa
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Card>
  );
};

export default UserTable;
