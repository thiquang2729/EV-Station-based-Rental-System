import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  Flex,
  FormControl,
  FormLabel,
  Input,
  Select,
  Text,
  useColorModeValue,
  useToast,
  SimpleGrid,
  Image,
  Spinner,
  Badge,
  Heading,
  VStack,
  HStack,
  Icon,
} from "@chakra-ui/react";
import { MdArrowBack, MdSave, MdImage, MdCheckCircle, MdCancel, MdPending } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import userService from "@/services/userService";
import { getDocumentsByUserId, updateDocumentStatus } from "@/services/documentService";
import { hasAdminAccess } from "@/utils/auth";

export default function EditUser() {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const dispatch = useDispatch();

  const textColor = useColorModeValue("secondaryGray.900", "white");
  const textColorSecondary = useColorModeValue("secondaryGray.600", "white");
  const cardBg = useColorModeValue("white", "navy.800");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.100");
  const brandColor = useColorModeValue("brand.500", "brand.400");
  const docCardBg = useColorModeValue("gray.50", "navy.700");
  const emptyBg = useColorModeValue("gray.50", "whiteAlpha.50");
  const imageFallbackBg = useColorModeValue("gray.100", "gray.600");

  const { accessToken, user: currentUser } = useSelector((state) => state.auth);
  const isAdmin = hasAdminAccess(currentUser);

  // Get userId from location state or URL params
  const userId = location.state?.userId || new URLSearchParams(location.search).get("id");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userData, setUserData] = useState(null);
  const [formData, setFormData] = useState({
    phoneNumber: "",
    role: "",
    verificationStatus: "",
    riskStatus: "",
  });
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [processingDocId, setProcessingDocId] = useState(null);

  // Load user data
  useEffect(() => {
    if (!userId) {
      toast({
        status: "error",
        title: "Lỗi",
        description: "Không tìm thấy ID người dùng",
        duration: 3000,
        isClosable: true,
        position: "bottom-right",
      });
      navigate("/admin/default");
      return;
    }

    if (!isAdmin) {
      toast({
        status: "error",
        title: "Không có quyền",
        description: "Bạn không có quyền chỉnh sửa người dùng",
        duration: 3000,
        isClosable: true,
        position: "bottom-right",
      });
      navigate("/admin/default");
      return;
    }

    loadUserData();
  }, [userId, isAdmin]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const response = await userService.getUserById({ userId, accessToken });
      const user = response.data || response;
      
      setUserData(user);
      setFormData({
        phoneNumber: user.phoneNumber || "",
        role: user.role || "RENTER",
        verificationStatus: user.verificationStatus || "PENDING",
        riskStatus: user.riskStatus || "NONE",
      });

      // Load documents
      loadDocuments();
    } catch (error) {
      toast({
        status: "error",
        title: "Lỗi",
        description: error.response?.data?.message || "Không thể tải thông tin người dùng",
        duration: 4000,
        isClosable: true,
        position: "bottom-right",
      });
      navigate("/admin/default");
    } finally {
      setLoading(false);
    }
  };

  const loadDocuments = async () => {
    try {
      setLoadingDocs(true);
      const response = await getDocumentsByUserId({ userId, accessToken });
      setDocuments(response.data || []);
    } catch (error) {
      console.error("Load documents error:", error);
      setDocuments([]);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleDocumentStatusUpdate = async (documentId, status) => {
    try {
      setProcessingDocId(documentId);
      await updateDocumentStatus({
        documentId,
        status,
        accessToken,
      });

      toast({
        status: "success",
        title: "Thành công",
        description: `Đã ${status === "VERIFIED" ? "phê duyệt" : "từ chối"} giấy tờ`,
        duration: 3000,
        isClosable: true,
        position: "bottom-right",
      });

      // Reload documents
      loadDocuments();
    } catch (error) {
      toast({
        status: "error",
        title: "Lỗi",
        description: error.response?.data?.message || "Không thể cập nhật trạng thái",
        duration: 4000,
        isClosable: true,
        position: "bottom-right",
      });
    } finally {
      setProcessingDocId(null);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      await userService.updateUser({
        userId,
        userData: formData,
        accessToken,
      });

      toast({
        status: "success",
        title: "Thành công",
        description: "Cập nhật thông tin người dùng thành công",
        duration: 3000,
        isClosable: true,
        position: "bottom-right",
      });

      // Reload user data
      await loadUserData();
    } catch (error) {
      toast({
        status: "error",
        title: "Lỗi",
        description: error.response?.data?.message || "Không thể cập nhật người dùng",
        duration: 4000,
        isClosable: true,
        position: "bottom-right",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigate("/admin/default");
  };

  const getVerificationBadge = (status) => {
    const statusConfig = {
      VERIFIED: { label: "Đã xác thực", colorScheme: "green" },
      PENDING: { label: "Chờ xác thực", colorScheme: "orange" },
      REJECTED: { label: "Từ chối", colorScheme: "red" },
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    return <Badge colorScheme={config.colorScheme} fontSize="sm">{config.label}</Badge>;
  };

  const getRiskBadge = (status) => {
    const statusConfig = {
      NONE: { label: "Không", colorScheme: "gray" },
      WARNED: { label: "Cảnh báo", colorScheme: "yellow" },
      BANNED: { label: "Cấm", colorScheme: "red" },
    };

    const config = statusConfig[status] || statusConfig.NONE;
    return <Badge colorScheme={config.colorScheme} fontSize="sm">{config.label}</Badge>;
  };

  if (loading) {
    return (
      <Box pt={{ base: "130px", md: "80px", xl: "80px" }}>
        <Card bg={cardBg} p="40px" borderRadius="20px">
          <Flex justify="center" align="center" direction="column" gap="10px">
            <Spinner size="xl" color={brandColor} thickness="4px" />
            <Text color={textColorSecondary}>Đang tải thông tin người dùng...</Text>
          </Flex>
        </Card>
      </Box>
    );
  }

  if (!userData) {
    return null;
  }

  return (
    <Box pt={{ base: "130px", md: "80px", xl: "80px" }}>
      {/* Back Button */}
      <Button
        leftIcon={<Icon as={MdArrowBack} />}
        onClick={handleBack}
        variant="outline"
        mb="20px"
        colorScheme="blue"
      >
        Quay lại Dashboard
      </Button>

      <SimpleGrid columns={{ base: 1, lg: 2 }} gap="20px">
        {/* User Info Card */}
        <Card bg={cardBg} p="30px" borderRadius="20px">
          <VStack align="stretch" spacing="20px">
            <Heading size="md" color={textColor}>
              Thông tin người dùng
            </Heading>

            <Box>
              <Text color={textColorSecondary} fontSize="sm" mb="5px">
                ID
              </Text>
              <Text color={textColor} fontSize="md" fontWeight="600">
                {userData.id}
              </Text>
            </Box>

            <Box>
              <Text color={textColorSecondary} fontSize="sm" mb="5px">
                Họ và tên
              </Text>
              <Text color={textColor} fontSize="md" fontWeight="600">
                {userData.fullName || "N/A"}
              </Text>
            </Box>

            <Box>
              <Text color={textColorSecondary} fontSize="sm" mb="5px">
                Email
              </Text>
              <Text color={textColor} fontSize="md" fontWeight="600">
                {userData.email}
              </Text>
            </Box>

            <Box>
              <Text color={textColorSecondary} fontSize="sm" mb="5px">
                Trạng thái xác thực hiện tại
              </Text>
              {getVerificationBadge(userData.verificationStatus)}
            </Box>

            <Box>
              <Text color={textColorSecondary} fontSize="sm" mb="5px">
                Mức độ rủi ro hiện tại
              </Text>
              {getRiskBadge(userData.riskStatus)}
            </Box>

            <Box>
              <Text color={textColorSecondary} fontSize="sm" mb="5px">
                Vai trò hiện tại
              </Text>
              <Badge colorScheme="purple" fontSize="sm">
                {userData.role}
              </Badge>
            </Box>
          </VStack>
        </Card>

        {/* Edit Form Card */}
        <Card bg={cardBg} p="30px" borderRadius="20px">
          <form onSubmit={handleSubmit}>
            <VStack align="stretch" spacing="20px">
              <Heading size="md" color={textColor}>
                Chỉnh sửa thông tin
              </Heading>

              <FormControl>
                <FormLabel color={textColor}>Số điện thoại</FormLabel>
                <Input
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="Nhập số điện thoại"
                  color={textColor}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel color={textColor}>Vai trò</FormLabel>
                <Select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  color={textColor}
                >
                  <option value="RENTER">RENTER (Người thuê)</option>
                  <option value="STAFF">STAFF (Nhân viên)</option>
                  <option value="ADMIN">ADMIN (Quản trị viên)</option>
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel color={textColor}>Trạng thái xác thực</FormLabel>
                <Select
                  name="verificationStatus"
                  value={formData.verificationStatus}
                  onChange={handleInputChange}
                  color={textColor}
                >
                  <option value="PENDING">Chờ xác thực</option>
                  <option value="VERIFIED">Đã xác thực</option>
                  <option value="REJECTED">Từ chối</option>
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel color={textColor}>Trạng thái rủi ro</FormLabel>
                <Select
                  name="riskStatus"
                  value={formData.riskStatus}
                  onChange={handleInputChange}
                  color={textColor}
                >
                  <option value="NONE">Không có</option>
                  <option value="WARNED">Cảnh báo</option>
                  <option value="BANNED">Cấm</option>
                </Select>
              </FormControl>

              <Button
                type="submit"
                colorScheme="brand"
                leftIcon={<Icon as={MdSave} />}
                isLoading={saving}
                loadingText="Đang lưu..."
                size="lg"
                mt="10px"
              >
                Lưu thay đổi
              </Button>
            </VStack>
          </form>
        </Card>
      </SimpleGrid>

      {/* Identity Document Card */}
      <Card bg={cardBg} p="30px" borderRadius="20px" mt="20px">
        <VStack align="stretch" spacing="20px">
          <Heading size="md" color={textColor}>
            Giấy tờ tùy thân
          </Heading>

          {loadingDocs ? (
            <Flex justify="center" py="40px">
              <Spinner size="lg" color={brandColor} />
            </Flex>
          ) : documents.length > 0 ? (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="20px">
              {documents.map((doc) => (
                <Card
                  key={doc.id}
                  bg={docCardBg}
                  p="20px"
                  borderRadius="15px"
                  border="1px solid"
                  borderColor={borderColor}
                >
                  <VStack align="stretch" spacing="15px">
                    {/* Document Type and Status */}
                    <Flex justify="space-between" align="center">
                      <Text color={textColor} fontSize="md" fontWeight="600">
                        {doc.documentType === "DRIVER_LICENSE" ? "Bằng lái xe" : "CMND/CCCD"}
                      </Text>
                      <HStack spacing="5px">
                        {doc.status === "VERIFIED" && <Icon as={MdCheckCircle} color="green.500" />}
                        {doc.status === "PENDING" && <Icon as={MdPending} color="orange.500" />}
                        {doc.status === "REJECTED" && <Icon as={MdCancel} color="red.500" />}
                        <Badge
                          colorScheme={
                            doc.status === "VERIFIED"
                              ? "green"
                              : doc.status === "REJECTED"
                              ? "red"
                              : "orange"
                          }
                          fontSize="sm"
                        >
                          {doc.status === "VERIFIED"
                            ? "Đã duyệt"
                            : doc.status === "REJECTED"
                            ? "Từ chối"
                            : "Chờ duyệt"}
                        </Badge>
                      </HStack>
                    </Flex>

                    {/* Image */}
                    {doc.fileUrl && (
                      <Box
                        as="a"
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Image
                          src={doc.fileUrl}
                          alt={doc.documentType}
                          borderRadius="10px"
                          w="100%"
                          h="200px"
                          objectFit="cover"
                          cursor="pointer"
                          _hover={{ opacity: 0.8 }}
                          fallback={
                            <Flex
                              w="100%"
                              h="200px"
                              bg={imageFallbackBg}
                              borderRadius="10px"
                              align="center"
                              justify="center"
                              direction="column"
                              gap="10px"
                            >
                              <Icon as={MdImage} w="40px" h="40px" color={textColorSecondary} />
                              <Text color={textColorSecondary} fontSize="xs">
                                Không thể tải ảnh
                              </Text>
                            </Flex>
                          }
                        />
                      </Box>
                    )}

                    {/* Upload Date */}
                    <Text color={textColorSecondary} fontSize="xs">
                      Upload: {new Date(doc.uploadedAt).toLocaleString("vi-VN")}
            </Text>

                    {/* Action Buttons - Only for pending documents */}
                    {doc.status === "PENDING" && (
                      <Flex gap="10px">
                        <Button
                          flex="1"
                          size="sm"
                          colorScheme="red"
                          variant="outline"
                          leftIcon={<Icon as={MdCancel} />}
                          onClick={() => handleDocumentStatusUpdate(doc.id, "REJECTED")}
                          isLoading={processingDocId === doc.id}
                        >
                          Từ chối
                        </Button>
                        <Button
                          flex="1"
                          size="sm"
                          colorScheme="green"
                          leftIcon={<Icon as={MdCheckCircle} />}
                          onClick={() => handleDocumentStatusUpdate(doc.id, "VERIFIED")}
                          isLoading={processingDocId === doc.id}
                        >
                          Phê duyệt
                        </Button>
                      </Flex>
                    )}
                  </VStack>
                </Card>
              ))}
            </SimpleGrid>
          ) : (
            <Flex
              direction="column"
              align="center"
              justify="center"
              border="2px dashed"
              borderColor={borderColor}
              borderRadius="15px"
              p="40px"
              bg={emptyBg}
            >
              <Icon as={MdImage} w="60px" h="60px" color={textColorSecondary} mb="10px" />
              <Text color={textColor} fontSize="lg" fontWeight="600" mb="5px">
                Chưa có giấy tờ
              </Text>
              <Text color={textColorSecondary} fontSize="sm" textAlign="center">
                Người dùng này chưa upload giấy tờ tùy thân
              </Text>
            </Flex>
          )}
        </VStack>
          </Card>
    </Box>
  );
}
