import React, { useEffect, useState, useRef } from "react";
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
  SimpleGrid,
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
  Textarea,
  Image,
  Spinner,
} from "@chakra-ui/react";
import { MdLogout, MdUploadFile, MdPerson, MdVerifiedUser, MdSecurity, MdImage, MdCheckCircle, MdCancel, MdPending, MdEdit, MdPhone, MdEmail, MdDescription } from "react-icons/md";
import { logoutUser, updateUserProfile } from "../features/auth/authSlice";
import { hasAdminAccess } from "../utils/auth";
import { uploadDocument, getDocumentsByUserId } from "../services/documentService";
import userService from "../services/userService";

// Import components
import Header from "../components/Header";
import Footer from "../components/Footer";

const AboutUser = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const toast = useToast();
  const uploadModal = useDisclosure();
  const editProfileModal = useDisclosure();
  const fileInputRef = useRef(null);
  
  const { user, accessToken } = useSelector((state) => state.auth);

  const [documentType, setDocumentType] = useState("DRIVER_LICENSE");
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  // Edit profile state
  const [editForm, setEditForm] = useState({
    fullName: "",
    phoneNumber: "",
  });
  const [updatingProfile, setUpdatingProfile] = useState(false);

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
      navigate("/admin", { replace: true });
      return;
    }

    // Load documents only
    loadDocuments();
  }, [user, navigate]);

  // Debug: Log user data to see what's available
  useEffect(() => {
    if (user) {
      console.log("Current user data:", user);
      console.log("User phoneNumber:", user.phoneNumber);
      console.log("User fullName:", user.fullName);
    }
  }, [user]);

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

  const handleNavigateToAboutUser = () => {
    navigate("/about-user");
  };

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate("/login", { replace: true });
  };

  const handleUploadDocuments = () => {
    uploadModal.onOpen();
  };

  const handleEditProfile = () => {
    setEditForm({
      fullName: user.fullName || "",
      phoneNumber: user.phoneNumber || "",
    });
    editProfileModal.onOpen();
  };

  const handleUpdateProfile = async () => {
    try {
      setUpdatingProfile(true);
      
      const response = await userService.updateProfile({
        fullName: editForm.fullName,
        phoneNumber: editForm.phoneNumber,
        accessToken,
      });
      
      // Update Redux store with new user data
      dispatch(updateUserProfile({
        fullName: editForm.fullName,
        phoneNumber: editForm.phoneNumber,
      }));
      
      toast({
        status: "success",
        title: "Cập nhật thành công",
        description: "Thông tin cá nhân đã được cập nhật.",
        duration: 3000,
        isClosable: true,
        position: "bottom-right",
      });

      editProfileModal.onClose();
    } catch (error) {
      toast({
        status: "error",
        title: "Lỗi",
        description: error.response?.data?.message || "Không thể cập nhật thông tin cá nhân",
        duration: 3000,
        isClosable: true,
        position: "bottom-right",
      });
    } finally {
      setUpdatingProfile(false);
    }
  };

  // Helper functions for risk status
  const getRiskStatusColor = (riskStatus) => {
    switch (riskStatus) {
      case "NONE":
        return "green.500";
      case "LOW":
        return "yellow.500";
      case "MEDIUM":
        return "orange.500";
      case "HIGH":
        return "red.500";
      case "WARNED":
        return "red.600";
      default:
        return "gray.500";
    }
  };

  const getRiskStatusTextColor = (riskStatus) => {
    switch (riskStatus) {
      case "NONE":
        return "green.500";
      case "LOW":
        return "yellow.600";
      case "MEDIUM":
        return "orange.600";
      case "HIGH":
        return "red.500";
      case "WARNED":
        return "red.600";
      default:
        return "gray.600";
    }
  };

  const getRiskStatusText = (riskStatus) => {
    switch (riskStatus) {
      case "NONE":
        return "AN TOÀN";
      case "LOW":
        return "THẤP";
      case "MEDIUM":
        return "TRUNG BÌNH";
      case "HIGH":
        return "CAO";
      case "WARNED":
        return "CẢNH BÁO";
      default:
        return "KHÔNG XÁC ĐỊNH";
    }
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
      uploadModal.onClose();

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
    uploadModal.onClose();
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
    <Box minH="100vh" bg={bgColor}>
      {/* Header */}
      <Header user={user} onLogout={handleLogout} onNavigateToAboutUser={handleNavigateToAboutUser} />
      
      {/* User Dashboard Section */}
      <Container maxW="container.md" py="40px">
        <VStack spacing="30px" align="stretch">
          {/* User Info Card */}
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
                      Chào mừng bạn đến với EV Rent
                    </Text>
                  </VStack>
                </Flex>
                <Button
                  leftIcon={<Icon as={MdEdit} w="16px" h="16px" />}
                  colorScheme="brand"
                  variant="outline"
                  size="sm"
                  onClick={handleEditProfile}
                >
                  Chỉnh sửa thông tin
                </Button>
              </Flex>

              <Divider />

              {/* User Info Section */}
              <VStack spacing="20px" align="stretch">
                <Heading size="md" color={textColor}>
                  Thông tin tài khoản
                </Heading>

                {/* Info Cards Grid */}
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing="20px">
                  {/* Full Name Card */}
                  <Card bg={useColorModeValue("gray.50", "gray.700")} p="20px" borderRadius="15px">
                    <VStack spacing="10px" align="center">
                      <Flex
                        align="center"
                        justify="center"
                        w="50px"
                        h="50px"
                        borderRadius="full"
                        bg="green.500"
                        color="white"
                      >
                        <Icon as={MdPerson} w="25px" h="25px" />
                      </Flex>
                      <VStack spacing="5px" align="center">
                        <Text color={textSecondary} fontSize="sm" fontWeight="500">
                          Họ và tên
                        </Text>
                        <Text color={textColor} fontSize="lg" fontWeight="600" textAlign="center">
                          {user.fullName || "Chưa cập nhật"}
                        </Text>
                      </VStack>
                    </VStack>
                  </Card>

                  {/* Phone Number Card */}
                  <Card bg={useColorModeValue("gray.50", "gray.700")} p="20px" borderRadius="15px">
                    <VStack spacing="10px" align="center">
                      <Flex
                        align="center"
                        justify="center"
                        w="50px"
                        h="50px"
                        borderRadius="full"
                        bg="green.500"
                        color="white"
                      >
                        <Icon as={MdPhone} w="25px" h="25px" />
                      </Flex>
                      <VStack spacing="5px" align="center">
                        <Text color={textSecondary} fontSize="sm" fontWeight="500">
                          Số điện thoại
                        </Text>
                        <Text color={textColor} fontSize="lg" fontWeight="600" textAlign="center">
                          {user.phoneNumber || "Chưa cập nhật"}
                        </Text>
                      </VStack>
                    </VStack>
                  </Card>

                  {/* Email Card */}
                  <Card bg={useColorModeValue("gray.50", "gray.700")} p="20px" borderRadius="15px">
                    <VStack spacing="10px" align="center">
                      <Flex
                        align="center"
                        justify="center"
                        w="50px"
                        h="50px"
                        borderRadius="full"
                        bg="green.500"
                        color="white"
                      >
                        <Icon as={MdEmail} w="25px" h="25px" />
                      </Flex>
                      <VStack spacing="5px" align="center">
                        <Text color={textSecondary} fontSize="sm" fontWeight="500">
                          Email
                        </Text>
                        <Text color={textColor} fontSize="lg" fontWeight="600" textAlign="center">
                          {user.email}
                        </Text>
                      </VStack>
                    </VStack>
                  </Card>

                  {/* Risk Status Card */}
                  <Card bg={useColorModeValue("gray.50", "gray.700")} p="20px" borderRadius="15px">
                    <VStack spacing="10px" align="center">
                      <Flex
                        align="center"
                        justify="center"
                        w="50px"
                        h="50px"
                        borderRadius="full"
                        bg={getRiskStatusColor(user.riskStatus)}
                        color="white"
                      >
                        <Icon as={MdSecurity} w="25px" h="25px" />
                      </Flex>
                      <VStack spacing="5px" align="center">
                        <Text color={textSecondary} fontSize="sm" fontWeight="500">
                          Trạng thái rủi ro
                        </Text>
                        <Text color={getRiskStatusTextColor(user.riskStatus)} fontSize="lg" fontWeight="600" textAlign="center">
                          {getRiskStatusText(user.riskStatus)}
                        </Text>
                      </VStack>
                    </VStack>
                  </Card>
                </SimpleGrid>

                {/* Verification Status Card */}
                <Card bg={useColorModeValue("gray.50", "gray.700")} p="20px" borderRadius="15px">
                  <Flex align="center" gap="15px">
                    <Flex
                      align="center"
                      justify="center"
                      w="50px"
                      h="50px"
                      borderRadius="full"
                      bg="green.500"
                      color="white"
                    >
                      <Icon as={MdVerifiedUser} w="25px" h="25px" />
                    </Flex>
                    <VStack spacing="5px" align="start">
                      <Text color={textSecondary} fontSize="sm" fontWeight="500">
                        Trạng thái xác thực
                      </Text>
                      <Text color="green.500" fontSize="lg" fontWeight="600">
                        VERIFIED
                      </Text>
                    </VStack>
                  </Flex>
                </Card>
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
      <Modal isOpen={uploadModal.isOpen} onClose={handleModalClose} size="lg" isCentered>
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

      {/* Edit Profile Modal */}
      <Modal isOpen={editProfileModal.isOpen} onClose={editProfileModal.onClose} size="lg" isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Chỉnh sửa thông tin cá nhân</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing="20px">
              <FormControl isRequired>
                <FormLabel>Họ và tên</FormLabel>
                <Input
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  placeholder="Nhập họ và tên"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Email (không thể thay đổi)</FormLabel>
                <Input
                  value={user.email}
                  isDisabled
                  bg={useColorModeValue("gray.100", "gray.700")}
                  color={textSecondary}
                />
                <Text fontSize="xs" color={textSecondary} mt="5px">
                  Email không thể thay đổi sau khi đăng ký
                </Text>
              </FormControl>

              <FormControl>
                <FormLabel>Số điện thoại</FormLabel>
                <Input
                  value={editForm.phoneNumber}
                  onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                  placeholder="Nhập số điện thoại"
                  type="tel"
                />
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={editProfileModal.onClose}>
              Hủy
            </Button>
            <Button
              colorScheme="brand"
              onClick={handleUpdateProfile}
              isLoading={updatingProfile}
              loadingText="Đang cập nhật..."
            >
              Lưu thay đổi
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Footer */}
      <Footer />
    </Box>
  );
};

export default AboutUser;