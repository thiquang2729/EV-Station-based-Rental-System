import { useEffect, useState, useRef } from "react";
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
  Input,
  Image,
  SimpleGrid,
  Spinner,
} from "@chakra-ui/react";
import { MdLogout, MdUploadFile, MdPerson, MdVerifiedUser, MdSecurity, MdImage, MdCheckCircle, MdCancel, MdPending } from "react-icons/md";
import { logoutUser } from "../features/auth/authSlice";
import { hasAdminAccess } from "../utils/auth";
import { uploadDocument, getDocumentsByUserId } from "../services/documentService";

const HomePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const fileInputRef = useRef(null);
  
  const { user, accessToken } = useSelector((state) => state.auth);

  const [documentType, setDocumentType] = useState("DRIVER_LICENSE");
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  const bgColor = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const textColor = useColorModeValue("gray.800", "white");
  const textSecondary = useColorModeValue("gray.600", "gray.400");
  const brandColor = useColorModeValue("brand.500", "brand.400");
  const docCardBg = useColorModeValue("gray.50", "gray.700");
  const infoBg = useColorModeValue("orange.50", "orange.900");

  useEffect(() => {
    // Nếu không có user, chuyển về login
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    // Nếu là admin, chuyển về admin dashboard
    if (hasAdminAccess(user)) {
      navigate("/admin/default", { replace: true });
      return;
    }

    // Load documents
    loadDocuments();
  }, [user, navigate]);

  const loadDocuments = async () => {
    if (!user || !accessToken) return;
    
    try {
      setLoadingDocs(true);
      const response = await getDocumentsByUserId({
        userId: user.id,
        accessToken,
      });
      setDocuments(response.data || []);
    } catch (error) {
      console.error("Load documents error:", error);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate("/login", { replace: true });
  };

  const handleUploadDocuments = () => {
    onOpen();
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];
      if (!allowedTypes.includes(file.type)) {
        toast({
          status: "error",
          title: "Lỗi",
          description: "Chỉ chấp nhận file JPEG, PNG, WEBP hoặc PDF",
          duration: 4000,
          isClosable: true,
          position: "bottom-right",
        });
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          status: "error",
          title: "Lỗi",
          description: "Kích thước file không được vượt quá 5MB",
          duration: 4000,
          isClosable: true,
          position: "bottom-right",
        });
        return;
      }

      setSelectedFile(file);
      
      // Create preview for images
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile) {
      toast({
        status: "warning",
        title: "Chưa chọn file",
        description: "Vui lòng chọn file để tải lên",
        duration: 3000,
        isClosable: true,
        position: "bottom-right",
      });
      return;
    }

    try {
      setUploading(true);
      await uploadDocument({
        file: selectedFile,
        documentType,
        accessToken,
      });

      toast({
        status: "success",
        title: "Thành công",
        description: "Tải giấy tờ lên thành công. Vui lòng chờ xác thực.",
        duration: 4000,
        isClosable: true,
        position: "bottom-right",
      });

      // Reset form
      setSelectedFile(null);
      setPreviewUrl(null);
      setDocumentType("DRIVER_LICENSE");
      onClose();

      // Reload documents
      loadDocuments();
    } catch (error) {
      toast({
        status: "error",
        title: "Lỗi",
        description: error.response?.data?.message || "Không thể tải file lên",
        duration: 4000,
        isClosable: true,
        position: "bottom-right",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleModalClose = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setDocumentType("DRIVER_LICENSE");
    onClose();
  };

  const getVerificationBadge = (status) => {
    const statusConfig = {
      VERIFIED: { label: "Đã xác thực", colorScheme: "green" },
      PENDING: { label: "Chờ xác thực", colorScheme: "orange" },
      REJECTED: { label: "Từ chối", colorScheme: "red" },
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    return (
      <Badge colorScheme={config.colorScheme} fontSize="md" px="3" py="1" borderRadius="md">
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
      <Badge colorScheme={config.colorScheme} fontSize="md" px="3" py="1" borderRadius="md">
        {config.label}
      </Badge>
    );
  };

  const getRiskBadge = (status) => {
    const statusConfig = {
      NONE: { label: "Không", colorScheme: "green" },
      WARNED: { label: "Cảnh báo", colorScheme: "yellow" },
      BANNED: { label: "Cấm", colorScheme: "red" },
    };

    const config = statusConfig[status] || statusConfig.NONE;
    return (
      <Badge colorScheme={config.colorScheme} fontSize="sm" px="2" py="1" borderRadius="md">
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

  if (!user) {
    return null;
  }

  return (
    <Box minH="100vh" bg={bgColor} py="40px">
      <Container maxW="container.md">
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
                      Xin chào, {user.fullName || "Người dùng"}!
                    </Heading>
                    <Text color={textSecondary} fontSize="md">
                      Chào mừng bạn đến với hệ thống
                    </Text>
                  </VStack>
                </Flex>
              </Flex>

              <Divider />

              {/* User Info Section */}
              <VStack spacing="20px" align="stretch">
                <Heading size="md" color={textColor}>
                  Thông tin tài khoản
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

                  {/* Phone Number */}
                  {user.phoneNumber && (
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
                          Số điện thoại
                        </Text>
                        <Text color={textColor} fontSize="md" fontWeight="600">
                          {user.phoneNumber}
                        </Text>
                      </Box>
                    </Flex>
                  )}

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
                      <Icon as={MdSecurity} w="20px" h="20px" color="purple.500" />
                    </Flex>
                    <Box flex="1">
                      <Text color={textSecondary} fontSize="sm" fontWeight="500">
                        Vai trò
                      </Text>
                      <Box mt="5px">{getRoleBadge(user.role)}</Box>
                    </Box>
                  </Flex>

                  {/* Verification Status */}
                  <Flex align="center" gap="15px">
                    <Flex
                      align="center"
                      justify="center"
                      w="40px"
                      h="40px"
                      borderRadius="10px"
                      bg={useColorModeValue("green.50", "green.900")}
                    >
                      <Icon as={MdVerifiedUser} w="20px" h="20px" color="green.500" />
                    </Flex>
                    <Box flex="1">
                      <Text color={textSecondary} fontSize="sm" fontWeight="500">
                        Trạng thái xác thực
                      </Text>
                      <Box mt="5px">{getVerificationBadge(user.verificationStatus)}</Box>
                    </Box>
                  </Flex>

                  {/* Risk Status */}
                  {user.riskStatus && user.riskStatus !== "NONE" && (
                    <Flex align="center" gap="15px">
                      <Flex
                        align="center"
                        justify="center"
                        w="40px"
                        h="40px"
                        borderRadius="10px"
                        bg={useColorModeValue("red.50", "red.900")}
                      >
                        <Icon as={MdSecurity} w="20px" h="20px" color="red.500" />
                      </Flex>
                      <Box flex="1">
                        <Text color={textSecondary} fontSize="sm" fontWeight="500">
                          Trạng thái rủi ro
                        </Text>
                        <Box mt="5px">{getRiskBadge(user.riskStatus)}</Box>
                      </Box>
                    </Flex>
                  )}
                </VStack>
              </VStack>
            </VStack>
          </Card>

          {/* Actions Card */}
          <Card bg={cardBg} p="30px" borderRadius="20px" boxShadow="lg">
            <VStack spacing="20px" align="stretch">
              <Heading size="md" color={textColor}>
                Hành động
              </Heading>

              <VStack spacing="15px">
                {/* Upload Documents Button */}
                <Button
                  leftIcon={<Icon as={MdUploadFile} w="20px" h="20px" />}
                  colorScheme="brand"
                  size="lg"
                  width="100%"
                  height="60px"
                  onClick={handleUploadDocuments}
                  fontSize="md"
                  fontWeight="600"
                >
                  Upload giấy tờ tùy thân
                </Button>

                {/* Logout Button */}
                <Button
                  leftIcon={<Icon as={MdLogout} w="20px" h="20px" />}
                  colorScheme="red"
                  variant="outline"
                  size="lg"
                  width="100%"
                  height="60px"
                  onClick={handleLogout}
                  fontSize="md"
                  fontWeight="600"
                >
                  Đăng xuất
                </Button>
              </VStack>
            </VStack>
          </Card>

          {/* Info Card - Only show if verification pending */}
          {user.verificationStatus === "PENDING" && (
            <Card bg={infoBg} p="25px" borderRadius="20px">
              <HStack spacing="15px">
                <Icon as={MdVerifiedUser} w="30px" h="30px" color="orange.500" />
                <Box>
                  <Text color={textColor} fontWeight="600" fontSize="md" mb="5px">
                    Tài khoản của bạn đang chờ xác thực
                  </Text>
                  <Text color={textSecondary} fontSize="sm">
                    Vui lòng upload giấy tờ tùy thân để hoàn tất quá trình xác thực.
                  </Text>
                </Box>
              </HStack>
            </Card>
          )}

          {/* Documents List Card */}
          <Card bg={cardBg} p="30px" borderRadius="20px" boxShadow="lg">
            <VStack spacing="20px" align="stretch">
              <Heading size="md" color={textColor}>
                Giấy tờ đã upload
              </Heading>

              {loadingDocs ? (
                <Flex justify="center" py="40px">
                  <Spinner size="lg" color={brandColor} />
                </Flex>
              ) : documents.length > 0 ? (
                <SimpleGrid columns={{ base: 1, md: 2 }} gap="15px">
                  {documents.map((doc) => (
                    <Card
                      key={doc.id}
                      bg={docCardBg}
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
                        
                        {doc.fileUrl && doc.fileUrl.match(/\.(jpg|jpeg|png|webp)$/i) && (
                          <Box
                            as="a"
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            cursor="pointer"
                            _hover={{ opacity: 0.8 }}
                          >
                            <Image
                              src={doc.fileUrl}
                              alt={getDocumentTypeLabel(doc.documentType)}
                              borderRadius="10px"
                              maxH="200px"
                              objectFit="cover"
                              w="100%"
                            />
                          </Box>
                        )}
                        
                        <Text color={textSecondary} fontSize="xs">
                          Upload: {new Date(doc.uploadedAt).toLocaleDateString("vi-VN")}
                        </Text>
                      </VStack>
                    </Card>
                  ))}
                </SimpleGrid>
              ) : (
                <Flex
                  direction="column"
                  align="center"
                  justify="center"
                  py="40px"
                  gap="10px"
                >
                  <Icon as={MdImage} w="60px" h="60px" color={textSecondary} />
                  <Text color={textSecondary} fontSize="md">
                    Chưa có giấy tờ nào được upload
                  </Text>
                </Flex>
              )}
            </VStack>
          </Card>
        </VStack>
      </Container>

      {/* Upload Modal */}
      <Modal isOpen={isOpen} onClose={handleModalClose} size="lg" isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Upload giấy tờ tùy thân</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing="20px">
              <FormControl isRequired>
                <FormLabel>Loại giấy tờ</FormLabel>
                <Select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                >
                  <option value="DRIVER_LICENSE">Bằng lái xe</option>
                  <option value="NATIONAL_ID">CMND/CCCD</option>
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Chọn file</FormLabel>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                  onChange={handleFileSelect}
                  display="none"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  width="100%"
                  leftIcon={<Icon as={MdUploadFile} />}
                  variant="outline"
                >
                  {selectedFile ? selectedFile.name : "Chọn file..."}
                </Button>
                <Text fontSize="xs" color={textSecondary} mt="5px">
                  Chấp nhận: JPEG, PNG, WEBP, PDF (tối đa 5MB)
                </Text>
              </FormControl>

              {previewUrl && (
                <Box w="100%">
                  <Text fontSize="sm" fontWeight="600" mb="10px">
                    Xem trước:
                  </Text>
                  <Image
                    src={previewUrl}
                    alt="Preview"
                    borderRadius="10px"
                    maxH="300px"
                    objectFit="contain"
                    w="100%"
                  />
                </Box>
              )}
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={handleModalClose}>
              Hủy
            </Button>
            <Button
              colorScheme="brand"
              onClick={handleUploadSubmit}
              isLoading={uploading}
              loadingText="Đang tải lên..."
            >
              Tải lên
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default HomePage;

