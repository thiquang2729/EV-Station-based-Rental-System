import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  Flex,
  Heading,
  Icon,
  Text,
  VStack,
  HStack,
  Badge,
  useColorModeValue,
  Container,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  Textarea,
  Spinner,
} from "@chakra-ui/react";
import { MdWarning, MdAdd } from "react-icons/md";
import { logoutUser } from "../features/auth/authSlice";
import { hasAdminAccess } from "../utils/auth";
import { getComplaintsByRenterId, createComplaint } from "../services/complaintService";

// Import components
import Header from "../components/Header";
import Footer from "../components/Footer";

const Reports = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const toast = useToast();
  const complaintModal = useDisclosure();
  
  const { user, accessToken } = useSelector((state) => state.auth);

  // Complaint state
  const [complaints, setComplaints] = useState([]);
  const [loadingComplaints, setLoadingComplaints] = useState(false);
  const [complaintDetails, setComplaintDetails] = useState("");
  const [creatingComplaint, setCreatingComplaint] = useState(false);

  const bgColor = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const textColor = useColorModeValue("gray.800", "white");
  const textSecondary = useColorModeValue("gray.600", "gray.400");
  const brandColor = useColorModeValue("brand.500", "brand.400");
  const docCardBg = useColorModeValue("gray.50", "gray.700");

  useEffect(() => {
    // Nếu không có user, chuyển về login
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    // Nếu là admin, chuyển về admin dashboard
    if (hasAdminAccess(user)) {
      navigate("/admin", { replace: true });
      return;
    }

    // Load complaints
    loadComplaints();
  }, [user, navigate]);

  const loadComplaints = async () => {
    if (!user || !accessToken) return;
    
    try {
      setLoadingComplaints(true);
      const response = await getComplaintsByRenterId({
        renterId: user.id,
        accessToken,
      });
      setComplaints(response.data || []);
    } catch (error) {
      console.error("Load complaints error:", error);
    } finally {
      setLoadingComplaints(false);
    }
  };

  const handleNavigateToAboutUser = () => {
    navigate("/about-user");
  };

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate("/login", { replace: true });
  };

  const handleCreateComplaint = async (event) => {
    event.preventDefault();
    if (!complaintDetails.trim()) {
      toast({
        status: "warning",
        title: "Vui lòng nhập chi tiết khiếu nại",
      });
      return;
    }

    try {
      setCreatingComplaint(true);
      await createComplaint({
        renterId: user.id,
        details: complaintDetails.trim(),
        accessToken,
      });

      toast({
        status: "success",
        title: "Gửi khiếu nại thành công",
        description: "Khiếu nại của bạn đã được gửi đến bộ phận hỗ trợ.",
      });

      complaintModal.onClose();
      setComplaintDetails("");
      loadComplaints();
    } catch (error) {
      toast({
        status: "error",
        title: "Lỗi",
        description: error.response?.data?.message || "Không thể gửi khiếu nại",
      });
    } finally {
      setCreatingComplaint(false);
    }
  };

  const getComplaintStatusBadge = (status) => {
    const statusConfig = {
      OPEN: { label: "Đang mở", colorScheme: "orange" },
      RESOLVED: { label: "Đã giải quyết", colorScheme: "green" },
      CLOSED: { label: "Đã đóng", colorScheme: "gray" },
    };

    const config = statusConfig[status] || statusConfig.OPEN;
    return (
      <Badge colorScheme={config.colorScheme} fontSize="sm">
        {config.label}
      </Badge>
    );
  };

  if (!user) {
    return null;
  }

  return (
    <Box minH="100vh" bg={bgColor}>
      {/* Header */}
      <Header user={user} onLogout={handleLogout} onNavigateToAboutUser={handleNavigateToAboutUser} />
      
      {/* Reports Section */}
      <Container maxW="container.md" py="40px">
        <VStack spacing="30px" align="stretch">
          {/* Page Header */}
          <Card bg={cardBg} p="30px" borderRadius="20px" boxShadow="lg">
            <VStack spacing="20px" align="stretch">
              <Flex align="center" gap="20px">
                <Icon as={MdWarning} w="40px" h="40px" color="orange.500" />
                <Box>
                  <Heading size="lg" color={textColor}>
                    Báo cáo & Khiếu nại
                  </Heading>
                  <Text color={textSecondary} fontSize="md">
                    Quản lý các báo cáo và khiếu nại của bạn
                  </Text>
                </Box>
              </Flex>
            </VStack>
          </Card>

          {/* Create New Complaint Card */}
          <Card bg={cardBg} p="30px" borderRadius="20px" boxShadow="lg">
            <VStack spacing="20px" align="stretch">
              <Flex justify="space-between" align="center">
                <Heading size="md" color={textColor}>
                  Gửi khiếu nại mới
                </Heading>
                <Button
                  colorScheme="orange"
                  leftIcon={<Icon as={MdAdd} />}
                  onClick={complaintModal.onOpen}
                >
                  Tạo khiếu nại
                </Button>
              </Flex>
              
              <Text color={textSecondary} fontSize="sm">
                Nếu bạn gặp vấn đề với dịch vụ hoặc có góp ý, hãy gửi khiếu nại để chúng tôi có thể hỗ trợ bạn tốt nhất.
              </Text>
            </VStack>
          </Card>

          {/* Complaints List Card */}
          <Card bg={cardBg} p="30px" borderRadius="20px" boxShadow="lg">
            <VStack spacing="20px" align="stretch">
              <Flex justify="space-between" align="center">
                <Heading size="md" color={textColor}>
                  Lịch sử khiếu nại
                </Heading>
                <Button
                  size="sm"
                  colorScheme="orange"
                  leftIcon={<Icon as={MdAdd} />}
                  onClick={complaintModal.onOpen}
                >
                  Gửi khiếu nại
                </Button>
              </Flex>

              {loadingComplaints ? (
                <Flex justify="center" py="40px">
                  <Spinner size="lg" color={brandColor} />
                </Flex>
              ) : complaints.length > 0 ? (
                <VStack spacing="15px" align="stretch">
                  {complaints.map((complaint) => (
                    <Card
                      key={complaint.id}
                      bg={docCardBg}
                      p="20px"
                      borderRadius="15px"
                    >
                      <VStack align="stretch" spacing="10px">
                        <Flex justify="space-between" align="center">
                          {getComplaintStatusBadge(complaint.status)}
                          <Text color={textSecondary} fontSize="xs">
                            {new Date(complaint.createdAt).toLocaleString("vi-VN")}
                          </Text>
                        </Flex>
                        <Text color={textColor} fontSize="sm" whiteSpace="pre-wrap">
                          {complaint.details}
                        </Text>
                        {complaint.reporterName && (
                          <Text color={textSecondary} fontSize="xs">
                            Báo cáo bởi: {complaint.reporterName}
                          </Text>
                        )}
                      </VStack>
                    </Card>
                  ))}
                </VStack>
              ) : (
                <Flex
                  direction="column"
                  align="center"
                  justify="center"
                  py="40px"
                  gap="10px"
                >
                  <Icon as={MdWarning} w="60px" h="60px" color={textSecondary} />
                  <Text color={textSecondary} fontSize="md">
                    Chưa có khiếu nại nào
                  </Text>
                  <Text color={textSecondary} fontSize="sm">
                    Nhấn "Tạo khiếu nại" để gửi báo cáo đầu tiên
                  </Text>
                </Flex>
              )}
            </VStack>
          </Card>
        </VStack>
      </Container>

      {/* Create Complaint Modal */}
      <Modal isOpen={complaintModal.isOpen} onClose={complaintModal.onClose} size="lg" isCentered>
        <ModalOverlay />
        <ModalContent as="form" onSubmit={handleCreateComplaint}>
          <ModalHeader>Gửi khiếu nại</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing="20px" align="stretch">
              <Box p="15px" bg={useColorModeValue("orange.50", "orange.900")} borderRadius="8px">
                <HStack spacing="10px">
                  <Icon as={MdWarning} color="orange.500" w="20px" h="20px" />
                  <Text fontSize="sm" color={textColor}>
                    Khiếu nại của bạn sẽ được gửi đến bộ phận hỗ trợ và được xử lý sớm nhất có thể.
                  </Text>
                </HStack>
              </Box>

              <FormControl isRequired>
                <FormLabel>Chi tiết khiếu nại</FormLabel>
                <Textarea
                  placeholder="Mô tả chi tiết về vấn đề, sự cố hoặc khiếu nại của bạn..."
                  value={complaintDetails}
                  onChange={(e) => setComplaintDetails(e.target.value)}
                  rows={8}
                />
                <Text fontSize="xs" color={textSecondary} mt="5px">
                  Hãy cung cấp thông tin chi tiết để chúng tôi có thể hỗ trợ bạn tốt hơn.
                </Text>
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={complaintModal.onClose}>
              Hủy
            </Button>
            <Button
              colorScheme="orange"
              type="submit"
              isLoading={creatingComplaint}
              loadingText="Đang gửi..."
            >
              Gửi khiếu nại
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Footer */}
      <Footer />
    </Box>
  );
};

export default Reports;
