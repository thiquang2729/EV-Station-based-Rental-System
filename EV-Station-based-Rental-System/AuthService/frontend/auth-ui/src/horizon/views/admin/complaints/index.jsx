import React, { useEffect, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Card,
  Flex,
  FormControl,
  FormLabel,
  Icon,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  SimpleGrid,
  Spinner,
  Table,
  Tbody,
  Td,
  Text,
  Textarea,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  useDisclosure,
  useToast,
  VStack,
  HStack,
  Input,
} from "@chakra-ui/react";
import {
  MdAdd,
  MdCheckCircle,
  MdWarning,
  MdClose,
  MdPerson,
  MdEmail,
} from "react-icons/md";
import { useSelector } from "react-redux";
import {
  getAllComplaints,
  createComplaint,
  updateComplaint,
  deleteComplaint,
  getComplaintsByRenterId,
} from "@/services/complaintService";
import { hasAdminAccess } from "@/utils/auth";

export default function ComplaintManagement() {
  const toast = useToast();
  const createModal = useDisclosure();
  const viewModal = useDisclosure();
  const editModal = useDisclosure();

  const textColor = useColorModeValue("secondaryGray.900", "white");
  const textColorSecondary = useColorModeValue("secondaryGray.600", "white");
  const cardBg = useColorModeValue("white", "navy.800");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.100");
  const brandColor = useColorModeValue("brand.500", "brand.400");
  const headerColor = useColorModeValue("gray.600", "gray.300");

  const { accessToken, user: currentUser } = useSelector((state) => state.auth);
  const isAdmin = hasAdminAccess(currentUser);
  const isStaff = currentUser?.role === "STAFF";
  const canManage = isAdmin || isStaff;

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  // Create form
  const [renterId, setRenterId] = useState("");
  const [details, setDetails] = useState("");
  const [creating, setCreating] = useState(false);

  // Edit form
  const [editDetails, setEditDetails] = useState("");
  const [editStatus, setEditStatus] = useState("OPEN");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (canManage) {
      loadComplaints();
    }
  }, [canManage, currentPage, statusFilter]);

  const loadComplaints = async () => {
    try {
      setLoading(true);
      const response = await getAllComplaints({
        page: currentPage,
        status: statusFilter || null,
        accessToken,
      });
      setComplaints(response.data || []);
      setPagination(response.pagination || null);
    } catch (error) {
      toast({
        status: "error",
        title: "Lỗi",
        description: error.response?.data?.message || "Không thể tải danh sách khiếu nại",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateComplaint = async (event) => {
    event.preventDefault();
    if (!renterId.trim() || !details.trim()) {
      toast({
        status: "warning",
        title: "Vui lòng điền đầy đủ thông tin",
      });
      return;
    }

    try {
      setCreating(true);
      await createComplaint({
        renterId: renterId.trim(),
        details: details.trim(),
        accessToken,
      });

      toast({
        status: "success",
        title: "Tạo khiếu nại thành công",
      });

      createModal.onClose();
      setRenterId("");
      setDetails("");
      loadComplaints();
    } catch (error) {
      toast({
        status: "error",
        title: "Lỗi",
        description: error.response?.data?.message || "Không thể tạo khiếu nại",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateComplaint = async (event) => {
    event.preventDefault();
    if (!selectedComplaint) return;

    try {
      setUpdating(true);
      await updateComplaint({
        complaintId: selectedComplaint.id,
        payload: {
          details: editDetails.trim(),
          status: editStatus,
        },
        accessToken,
      });

      toast({
        status: "success",
        title: "Cập nhật khiếu nại thành công",
      });

      editModal.onClose();
      loadComplaints();
    } catch (error) {
      toast({
        status: "error",
        title: "Lỗi",
        description: error.response?.data?.message || "Không thể cập nhật khiếu nại",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteComplaint = async (complaintId) => {
    if (!confirm("Bạn có chắc muốn xóa khiếu nại này?")) return;

    try {
      await deleteComplaint({ complaintId, accessToken });
      toast({
        status: "success",
        title: "Xóa khiếu nại thành công",
      });
      loadComplaints();
    } catch (error) {
      toast({
        status: "error",
        title: "Lỗi",
        description: error.response?.data?.message || "Không thể xóa khiếu nại",
      });
    }
  };

  const openViewModal = (complaint) => {
    setSelectedComplaint(complaint);
    viewModal.onOpen();
  };

  const openEditModal = (complaint) => {
    setSelectedComplaint(complaint);
    setEditDetails(complaint.details || "");
    setEditStatus(complaint.status || "OPEN");
    editModal.onOpen();
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      OPEN: { label: "Đang mở", colorScheme: "orange", icon: MdWarning },
      RESOLVED: { label: "Đã giải quyết", colorScheme: "green", icon: MdCheckCircle },
      CLOSED: { label: "Đã đóng", colorScheme: "gray", icon: MdClose },
    };

    const config = statusConfig[status] || statusConfig.OPEN;
    return (
      <HStack spacing="5px">
        <Icon as={config.icon} />
        <Badge colorScheme={config.colorScheme} fontSize="sm">
          {config.label}
        </Badge>
      </HStack>
    );
  };

  if (!canManage) {
    return (
      <Box pt={{ base: "130px", md: "80px", xl: "80px" }}>
        <Card bg={cardBg} p="20px" borderRadius="20px">
          <Text color={textColor} fontSize="lg" fontWeight="700">
            Bạn không có quyền truy cập trang này
          </Text>
        </Card>
      </Box>
    );
  }

  return (
    <Box pt={{ base: "130px", md: "80px", xl: "80px" }}>
      <Card bg={cardBg} p="20px" borderRadius="20px">
        <Flex mb="20px" justify="space-between" align="center">
          <Text color={textColor} fontSize="xl" fontWeight="700">
            Quản lý khiếu nại
          </Text>
          <HStack spacing="10px">
            <Select
              size="sm"
              maxW="200px"
              placeholder="Tất cả trạng thái"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="OPEN">Đang mở</option>
              <option value="RESOLVED">Đã giải quyết</option>
              <option value="CLOSED">Đã đóng</option>
            </Select>
            <Button
              leftIcon={<Icon as={MdAdd} />}
              colorScheme="teal"
              size="sm"
              onClick={createModal.onOpen}
            >
              Tạo khiếu nại
            </Button>
          </HStack>
        </Flex>

        {loading ? (
          <Flex justify="center" align="center" minH="400px">
            <Spinner size="xl" color={brandColor} thickness="4px" />
          </Flex>
        ) : complaints.length > 0 ? (
          <Box overflowX="auto">
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th color={headerColor}>Người bị khiếu nại</Th>
                  <Th color={headerColor}>Người báo cáo</Th>
                  <Th color={headerColor}>Chi tiết</Th>
                  <Th color={headerColor}>Trạng thái</Th>
                  <Th color={headerColor}>Ngày tạo</Th>
                  <Th color={headerColor} textAlign="right">
                    Hành động
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {complaints.map((complaint) => (
                  <Tr key={complaint.id} borderColor={borderColor}>
                    <Td>
                      <VStack align="start" spacing="0">
                        <Text fontWeight="600" color={textColor} fontSize="sm">
                          {complaint.renterName || "N/A"}
                        </Text>
                        <Text fontSize="xs" color={textColorSecondary}>
                          {complaint.renterEmail}
                        </Text>
                      </VStack>
                    </Td>
                    <Td>
                      <VStack align="start" spacing="0">
                        <Text fontWeight="600" color={textColor} fontSize="sm">
                          {complaint.reporterName || "N/A"}
                        </Text>
                        <Text fontSize="xs" color={textColorSecondary}>
                          {complaint.reporterEmail}
                        </Text>
                      </VStack>
                    </Td>
                    <Td>
                      <Text fontSize="sm" color={textColor} noOfLines={2}>
                        {complaint.details}
                      </Text>
                    </Td>
                    <Td>{getStatusBadge(complaint.status)}</Td>
                    <Td>
                      <Text fontSize="sm" color={textColor}>
                        {new Date(complaint.createdAt).toLocaleString("vi-VN")}
                      </Text>
                    </Td>
                    <Td textAlign="right">
                      <HStack justify="flex-end" spacing="5px">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openViewModal(complaint)}
                        >
                          Xem
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          colorScheme="blue"
                          onClick={() => openEditModal(complaint)}
                        >
                          Sửa
                        </Button>
                        {isAdmin && (
                          <Button
                            size="sm"
                            colorScheme="red"
                            variant="ghost"
                            onClick={() => handleDeleteComplaint(complaint.id)}
                          >
                            Xóa
                          </Button>
                        )}
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        ) : (
          <Flex direction="column" align="center" justify="center" minH="400px" gap="10px">
            <Icon as={MdWarning} w="80px" h="80px" color={textColorSecondary} />
            <Text color={textColor} fontSize="lg" fontWeight="600">
              Không có khiếu nại
            </Text>
            <Text color={textColorSecondary} fontSize="sm">
              {statusFilter ? "Không có khiếu nại với bộ lọc này" : "Chưa có khiếu nại nào"}
            </Text>
          </Flex>
        )}

        {pagination && pagination.totalPages > 1 && (
          <Flex justify="space-between" align="center" mt="20px">
            <Text color={textColorSecondary} fontSize="sm">
              Trang {pagination.currentPage}/{pagination.totalPages} • Tổng {pagination.totalItems} khiếu nại
            </Text>
            <HStack>
              <Button
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                isDisabled={currentPage <= 1}
              >
                Trang trước
              </Button>
              <Button
                size="sm"
                onClick={() => setCurrentPage((p) => p + 1)}
                isDisabled={currentPage >= pagination.totalPages}
              >
                Trang sau
              </Button>
            </HStack>
          </Flex>
        )}
      </Card>

      {/* Create Complaint Modal */}
      <Modal isOpen={createModal.isOpen} onClose={createModal.onClose} size="lg">
        <ModalOverlay />
        <ModalContent as="form" onSubmit={handleCreateComplaint}>
          <ModalHeader>Tạo khiếu nại mới</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing="15px" align="stretch">
              <FormControl isRequired>
                <FormLabel>ID người dùng bị khiếu nại</FormLabel>
                <Input
                  placeholder="Nhập ID người dùng"
                  value={renterId}
                  onChange={(e) => setRenterId(e.target.value)}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Chi tiết khiếu nại</FormLabel>
                <Textarea
                  placeholder="Mô tả chi tiết về khiếu nại..."
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  rows={6}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={createModal.onClose}>
              Hủy
            </Button>
            <Button colorScheme="teal" type="submit" isLoading={creating}>
              Tạo khiếu nại
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* View Complaint Modal */}
      <Modal isOpen={viewModal.isOpen} onClose={viewModal.onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Chi tiết khiếu nại</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedComplaint && (
              <VStack spacing="20px" align="stretch">
                <Box>
                  <Text fontSize="xs" color={textColorSecondary}>
                    Trạng thái
                  </Text>
                  {getStatusBadge(selectedComplaint.status)}
                </Box>

                <Box>
                  <Text fontSize="xs" color={textColorSecondary} mb="5px">
                    Người bị khiếu nại
                  </Text>
                  <HStack>
                    <Icon as={MdPerson} color={brandColor} />
                    <VStack align="start" spacing="0">
                      <Text fontWeight="600" fontSize="sm">
                        {selectedComplaint.renterName || "N/A"}
                      </Text>
                      <Text fontSize="xs" color={textColorSecondary}>
                        {selectedComplaint.renterEmail}
                      </Text>
                    </VStack>
                  </HStack>
                </Box>

                <Box>
                  <Text fontSize="xs" color={textColorSecondary} mb="5px">
                    Người báo cáo
                  </Text>
                  <HStack>
                    <Icon as={MdEmail} color={brandColor} />
                    <VStack align="start" spacing="0">
                      <Text fontWeight="600" fontSize="sm">
                        {selectedComplaint.reporterName || "N/A"}
                      </Text>
                      <Text fontSize="xs" color={textColorSecondary}>
                        {selectedComplaint.reporterEmail}
                      </Text>
                    </VStack>
                  </HStack>
                </Box>

                <Box>
                  <Text fontSize="xs" color={textColorSecondary} mb="5px">
                    Chi tiết
                  </Text>
                  <Text fontSize="sm" color={textColor} whiteSpace="pre-wrap">
                    {selectedComplaint.details}
                  </Text>
                </Box>

                <Box>
                  <Text fontSize="xs" color={textColorSecondary} mb="5px">
                    Ngày tạo
                  </Text>
                  <Text fontSize="sm" color={textColor}>
                    {new Date(selectedComplaint.createdAt).toLocaleString("vi-VN")}
                  </Text>
                </Box>

                {selectedComplaint.updatedAt && (
                  <Box>
                    <Text fontSize="xs" color={textColorSecondary} mb="5px">
                      Ngày cập nhật
                    </Text>
                    <Text fontSize="sm" color={textColor}>
                      {new Date(selectedComplaint.updatedAt).toLocaleString("vi-VN")}
                    </Text>
                  </Box>
                )}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={viewModal.onClose}>Đóng</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Complaint Modal */}
      <Modal isOpen={editModal.isOpen} onClose={editModal.onClose} size="lg">
        <ModalOverlay />
        <ModalContent as="form" onSubmit={handleUpdateComplaint}>
          <ModalHeader>Cập nhật khiếu nại</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedComplaint && (
              <VStack spacing="15px" align="stretch">
                <Box p="10px" bg={useColorModeValue("gray.50", "navy.700")} borderRadius="8px">
                  <Text fontSize="xs" color={textColorSecondary}>
                    Người bị khiếu nại
                  </Text>
                  <Text fontWeight="600" fontSize="sm">
                    {selectedComplaint.renterName} ({selectedComplaint.renterEmail})
                  </Text>
                </Box>

                <FormControl isRequired>
                  <FormLabel>Chi tiết khiếu nại</FormLabel>
                  <Textarea
                    value={editDetails}
                    onChange={(e) => setEditDetails(e.target.value)}
                    rows={6}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Trạng thái</FormLabel>
                  <Select value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                    <option value="OPEN">Đang mở</option>
                    <option value="RESOLVED">Đã giải quyết</option>
                    <option value="CLOSED">Đã đóng</option>
                  </Select>
                </FormControl>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={editModal.onClose}>
              Hủy
            </Button>
            <Button colorScheme="blue" type="submit" isLoading={updating}>
              Cập nhật
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}