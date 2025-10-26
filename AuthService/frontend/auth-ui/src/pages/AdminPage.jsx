import { useEffect, useState } from "react";
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
  Avatar,
  Divider,
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
  Select,
  Textarea,
  SimpleGrid,
  Spinner,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from "@chakra-ui/react";
import { 
  MdLogout, 
  MdPerson, 
  MdVerifiedUser, 
  MdSecurity, 
  MdCheckCircle, 
  MdCancel, 
  MdPending, 
  MdWarning,
  MdAdminPanelSettings,
  MdPeople,
  MdDocumentScanner,
  MdReport
} from "react-icons/md";
import { logoutUser } from "../features/auth/authSlice";
import { hasAdminAccess } from "../utils/auth";

const AdminPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const toast = useToast();
  
  const { user, accessToken } = useSelector((state) => state.auth);

  // Mock data - trong thực tế sẽ fetch từ API
  const [users, setUsers] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);

  const bgColor = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const textColor = useColorModeValue("gray.800", "white");
  const textSecondary = useColorModeValue("gray.600", "gray.400");
  const brandColor = useColorModeValue("brand.500", "brand.400");

  useEffect(() => {
    // Kiểm tra quyền admin
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    if (!hasAdminAccess(user)) {
      navigate("/", { replace: true });
      return;
    }

    // Load admin data
    loadAdminData();
  }, [user, navigate]);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      // Mock data - trong thực tế sẽ gọi API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setUsers([
        {
          id: 1,
          email: "user1@example.com",
          fullName: "Nguyễn Văn A",
          role: "RENTER",
          verificationStatus: "PENDING",
          riskStatus: "NONE",
          createdAt: "2024-01-15"
        },
        {
          id: 2,
          email: "user2@example.com", 
          fullName: "Trần Thị B",
          role: "RENTER",
          verificationStatus: "VERIFIED",
          riskStatus: "NONE",
          createdAt: "2024-01-10"
        }
      ]);

      setDocuments([
        {
          id: 1,
          userId: 1,
          documentType: "DRIVER_LICENSE",
          status: "PENDING",
          uploadedAt: "2024-01-20",
          fileName: "driver_license.jpg"
        },
        {
          id: 2,
          userId: 2,
          documentType: "NATIONAL_ID", 
          status: "VERIFIED",
          uploadedAt: "2024-01-18",
          fileName: "national_id.pdf"
        }
      ]);

      setComplaints([
        {
          id: 1,
          renterId: 1,
          details: "Xe không khởi động được",
          status: "OPEN",
          createdAt: "2024-01-22",
          reporterName: "Nguyễn Văn A"
        },
        {
          id: 2,
          renterId: 2,
          details: "Trạm sạc bị hỏng",
          status: "RESOLVED",
          createdAt: "2024-01-20",
          reporterName: "Trần Thị B"
        }
      ]);
    } catch (error) {
      console.error("Load admin data error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate("/login", { replace: true });
  };

  const getVerificationBadge = (status) => {
    const statusConfig = {
      VERIFIED: { label: "Đã xác thực", colorScheme: "green" },
      PENDING: { label: "Chờ xác thực", colorScheme: "orange" },
      REJECTED: { label: "Từ chối", colorScheme: "red" },
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    return (
      <Badge colorScheme={config.colorScheme} fontSize="sm">
        {config.label}
      </Badge>
    );
  };

  const getRoleBadge = (role) => {
    const roleConfig = {
      ADMIN: { label: "Quản trị viên", colorScheme: "purple" },
      STAFF: { label: "Nhân viên", colorScheme: "blue" },
      RENTER: { label: "Người thuê", colorScheme: "cyan" },
    };

    const config = roleConfig[role] || roleConfig.RENTER;
    return (
      <Badge colorScheme={config.colorScheme} fontSize="sm">
        {config.label}
      </Badge>
    );
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

  const getDocumentStatusBadge = (status) => {
    const statusConfig = {
      VERIFIED: { label: "Đã duyệt", colorScheme: "green", icon: MdCheckCircle },
      PENDING: { label: "Chờ duyệt", colorScheme: "orange", icon: MdPending },
      REJECTED: { label: "Từ chối", colorScheme: "red", icon: MdCancel },
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    return (
      <HStack spacing="5px">
        <Icon as={config.icon} />
        <Badge colorScheme={config.colorScheme} fontSize="sm">
          {config.label}
        </Badge>
      </HStack>
    );
  };

  const getDocumentTypeLabel = (type) => {
    const typeLabels = {
      DRIVER_LICENSE: "Bằng lái xe",
      NATIONAL_ID: "CMND/CCCD",
    };
    return typeLabels[type] || type;
  };

  if (!user || !hasAdminAccess(user)) {
    return null;
  }

  return (
    <Box minH="100vh" bg={bgColor} py="40px">
      <Container maxW="container.xl">
        <VStack spacing="30px" align="stretch">
          {/* Header Card */}
          <Card bg={cardBg} p="40px" borderRadius="20px" boxShadow="lg">
            <VStack spacing="25px" align="stretch">
              {/* Welcome Section */}
              <Flex align="center" justify="space-between" flexWrap="wrap" gap="20px">
                <Flex align="center" gap="20px">
                  <Avatar
                    size="xl"
                    name={user.fullName || user.email}
                    bg={brandColor}
                    color="white"
                  />
                  <VStack align="start" spacing="5px">
                    <Heading size="lg" color={textColor}>
                      Xin chào, {user.fullName || "Admin"}!
                    </Heading>
                    <Text color={textSecondary} fontSize="md">
                      Bảng điều khiển quản trị hệ thống
                    </Text>
                  </VStack>
                </Flex>
                <Button
                  leftIcon={<Icon as={MdLogout} w="20px" h="20px" />}
                  colorScheme="red"
                  variant="outline"
                  onClick={handleLogout}
                >
                  Đăng xuất
                </Button>
              </Flex>

              <Divider />

              {/* Admin Info Section */}
              <VStack spacing="20px" align="stretch">
                <Heading size="md" color={textColor}>
                  Thông tin quản trị viên
                </Heading>

                <VStack spacing="15px" align="stretch">
                  {/* Email */}
                  <Flex align="center" gap="15px">
                    <Flex
                      align="center"
                      justify="center"
                      w="40px"
                      h="40px"
                      borderRadius="10px"
                      bg={useColorModeValue("brand.50", "brand.900")}
                    >
                      <Icon as={MdPerson} w="20px" h="20px" color={brandColor} />
                    </Flex>
                    <Box flex="1">
                      <Text color={textSecondary} fontSize="sm" fontWeight="500">
                        Email
                      </Text>
                      <Text color={textColor} fontSize="md" fontWeight="600">
                        {user.email}
                      </Text>
                    </Box>
                  </Flex>

                  {/* Role */}
                  <Flex align="center" gap="15px">
                    <Flex
                      align="center"
                      justify="center"
                      w="40px"
                      h="40px"
                      borderRadius="10px"
                      bg={useColorModeValue("purple.50", "purple.900")}
                    >
                      <Icon as={MdAdminPanelSettings} w="20px" h="20px" color="purple.500" />
                    </Flex>
                    <Box flex="1">
                      <Text color={textSecondary} fontSize="sm" fontWeight="500">
                        Vai trò
                      </Text>
                      <Box mt="5px">{getRoleBadge(user.role)}</Box>
                    </Box>
                  </Flex>
                </VStack>
              </VStack>
            </VStack>
          </Card>

          {/* Statistics Cards */}
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap="20px">
            <Card bg={cardBg} p="25px" borderRadius="15px" boxShadow="md">
              <VStack spacing="10px">
                <Icon as={MdPeople} w="40px" h="40px" color="blue.500" />
                <Text color={textSecondary} fontSize="sm">Tổng người dùng</Text>
                <Text color={textColor} fontSize="2xl" fontWeight="bold">
                  {users.length}
                </Text>
              </VStack>
            </Card>

            <Card bg={cardBg} p="25px" borderRadius="15px" boxShadow="md">
              <VStack spacing="10px">
                <Icon as={MdDocumentScanner} w="40px" h="40px" color="orange.500" />
                <Text color={textSecondary} fontSize="sm">Giấy tờ chờ duyệt</Text>
                <Text color={textColor} fontSize="2xl" fontWeight="bold">
                  {documents.filter(doc => doc.status === "PENDING").length}
                </Text>
              </VStack>
            </Card>

            <Card bg={cardBg} p="25px" borderRadius="15px" boxShadow="md">
              <VStack spacing="10px">
                <Icon as={MdReport} w="40px" h="40px" color="red.500" />
                <Text color={textSecondary} fontSize="sm">Khiếu nại mở</Text>
                <Text color={textColor} fontSize="2xl" fontWeight="bold">
                  {complaints.filter(complaint => complaint.status === "OPEN").length}
                </Text>
              </VStack>
            </Card>

            <Card bg={cardBg} p="25px" borderRadius="15px" boxShadow="md">
              <VStack spacing="10px">
                <Icon as={MdVerifiedUser} w="40px" h="40px" color="green.500" />
                <Text color={textSecondary} fontSize="sm">Đã xác thực</Text>
                <Text color={textColor} fontSize="2xl" fontWeight="bold">
                  {users.filter(user => user.verificationStatus === "VERIFIED").length}
                </Text>
              </VStack>
            </Card>
          </SimpleGrid>

          {/* Management Tabs */}
          <Card bg={cardBg} p="30px" borderRadius="20px" boxShadow="lg">
            <Tabs>
              <TabList>
                <Tab>
                  <Icon as={MdPeople} mr="10px" />
                  Quản lý người dùng
                </Tab>
                <Tab>
                  <Icon as={MdDocumentScanner} mr="10px" />
                  Duyệt giấy tờ
                </Tab>
                <Tab>
                  <Icon as={MdReport} mr="10px" />
                  Xử lý khiếu nại
                </Tab>
              </TabList>

              <TabPanels>
                {/* Users Management Tab */}
                <TabPanel>
                  <VStack spacing="20px" align="stretch">
                    <Heading size="md" color={textColor}>
                      Danh sách người dùng
                    </Heading>

                    {loading ? (
                      <Flex justify="center" py="40px">
                        <Spinner size="lg" color={brandColor} />
                      </Flex>
                    ) : (
                      <Box overflowX="auto">
                        <Table variant="simple">
                          <Thead>
                            <Tr>
                              <Th>Email</Th>
                              <Th>Tên</Th>
                              <Th>Vai trò</Th>
                              <Th>Trạng thái</Th>
                              <Th>Ngày tạo</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {users.map((user) => (
                              <Tr key={user.id}>
                                <Td>{user.email}</Td>
                                <Td>{user.fullName}</Td>
                                <Td>{getRoleBadge(user.role)}</Td>
                                <Td>{getVerificationBadge(user.verificationStatus)}</Td>
                                <Td>{new Date(user.createdAt).toLocaleDateString("vi-VN")}</Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      </Box>
                    )}
                  </VStack>
                </TabPanel>

                {/* Documents Management Tab */}
                <TabPanel>
                  <VStack spacing="20px" align="stretch">
                    <Heading size="md" color={textColor}>
                      Duyệt giấy tờ
                    </Heading>

                    {loading ? (
                      <Flex justify="center" py="40px">
                        <Spinner size="lg" color={brandColor} />
                      </Flex>
                    ) : (
                      <SimpleGrid columns={{ base: 1, md: 2 }} gap="15px">
                        {documents.map((doc) => (
                          <Card
                            key={doc.id}
                            bg={useColorModeValue("gray.50", "gray.700")}
                            p="20px"
                            borderRadius="15px"
                          >
                            <VStack align="stretch" spacing="10px">
                              <Flex justify="space-between" align="center">
                                <Text color={textColor} fontWeight="600" fontSize="sm">
                                  {getDocumentTypeLabel(doc.documentType)}
                                </Text>
                                {getDocumentStatusBadge(doc.status)}
                              </Flex>
                              
                              <Text color={textSecondary} fontSize="xs">
                                User ID: {doc.userId}
                              </Text>
                              <Text color={textSecondary} fontSize="xs">
                                Upload: {new Date(doc.uploadedAt).toLocaleDateString("vi-VN")}
                              </Text>
                              <Text color={textSecondary} fontSize="xs">
                                File: {doc.fileName}
                              </Text>

                              {doc.status === "PENDING" && (
                                <HStack spacing="10px" mt="10px">
                                  <Button size="sm" colorScheme="green" flex="1">
                                    Duyệt
                                  </Button>
                                  <Button size="sm" colorScheme="red" flex="1">
                                    Từ chối
                                  </Button>
                                </HStack>
                              )}
                            </VStack>
                          </Card>
                        ))}
                      </SimpleGrid>
                    )}
                  </VStack>
                </TabPanel>

                {/* Complaints Management Tab */}
                <TabPanel>
                  <VStack spacing="20px" align="stretch">
                    <Heading size="md" color={textColor}>
                      Xử lý khiếu nại
                    </Heading>

                    {loading ? (
                      <Flex justify="center" py="40px">
                        <Spinner size="lg" color={brandColor} />
                      </Flex>
                    ) : (
                      <VStack spacing="15px" align="stretch">
                        {complaints.map((complaint) => (
                          <Card
                            key={complaint.id}
                            bg={useColorModeValue("gray.50", "gray.700")}
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
                              <Text color={textSecondary} fontSize="xs">
                                Báo cáo bởi: {complaint.reporterName}
                              </Text>

                              {complaint.status === "OPEN" && (
                                <HStack spacing="10px" mt="10px">
                                  <Button size="sm" colorScheme="green" flex="1">
                                    Giải quyết
                                  </Button>
                                  <Button size="sm" colorScheme="gray" flex="1">
                                    Đóng
                                  </Button>
                                </HStack>
                              )}
                            </VStack>
                          </Card>
                        ))}
                      </VStack>
                    )}
                  </VStack>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </Card>
        </VStack>
      </Container>
    </Box>
  );
};

export default AdminPage;
