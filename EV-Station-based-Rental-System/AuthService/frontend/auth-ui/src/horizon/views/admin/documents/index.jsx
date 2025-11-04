import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  Flex,
  Icon,
  Image,
  Text,
  useColorModeValue,
  useToast,
  SimpleGrid,
  Badge,
  Spinner,
  HStack,
  VStack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
} from "@chakra-ui/react";
import { MdCheckCircle, MdCancel, MdPending, MdImage, MdPerson } from "react-icons/md";
import { useSelector, useDispatch } from "react-redux";
import { getPendingDocuments, updateDocumentStatus } from "@/services/documentService";
import { hasAdminAccess } from "@/utils/auth";
import { fetchUserStats } from "@/features/users/userStatsSlice";

export default function DocumentManagement() {
  const dispatch = useDispatch();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const textColor = useColorModeValue("secondaryGray.900", "white");
  const textColorSecondary = useColorModeValue("secondaryGray.600", "white");
  const cardBg = useColorModeValue("white", "navy.800");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.100");
  const brandColor = useColorModeValue("brand.500", "brand.400");

  const { accessToken, user: currentUser } = useSelector((state) => state.auth);
  const isAdmin = hasAdminAccess(currentUser);

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(null);
  const [selectedDoc, setSelectedDoc] = useState(null);

  useEffect(() => {
    if (isAdmin) {
      loadDocuments();
    }
  }, [isAdmin]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await getPendingDocuments({ accessToken });
      setDocuments(response.data || []);
    } catch (error) {
      toast({
        status: "error",
        title: "Lỗi",
        description: error.response?.data?.message || "Không thể tải danh sách giấy tờ",
        duration: 4000,
        isClosable: true,
        position: "bottom-right",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDocument = (doc) => {
    setSelectedDoc(doc);
    onOpen();
  };

  const handleUpdateStatus = async (documentId, status) => {
    try {
      setProcessing(documentId);
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

      // Reload documents and refresh user stats
      loadDocuments();
      dispatch(fetchUserStats());
      onClose();
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
      setProcessing(null);
    }
  };

  const getDocumentTypeLabel = (type) => {
    const typeLabels = {
      DRIVER_LICENSE: "Bằng lái xe",
      NATIONAL_ID: "CMND/CCCD",
    };
    return typeLabels[type] || type;
  };

  const getStatusBadge = (status) => {
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

  if (!isAdmin) {
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
            Quản lý giấy tờ chờ duyệt
          </Text>
          <Button onClick={loadDocuments} isLoading={loading} size="sm">
            Làm mới
          </Button>
        </Flex>

        {loading ? (
          <Flex justify="center" align="center" minH="400px">
            <Spinner size="xl" color={brandColor} thickness="4px" />
          </Flex>
        ) : documents.length > 0 ? (
          <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} gap="20px">
            {documents.map((doc) => (
              <Card
                key={doc.id}
                bg={cardBg}
                border="1px solid"
                borderColor={borderColor}
                p="20px"
                borderRadius="15px"
                cursor="pointer"
                onClick={() => handleViewDocument(doc)}
                transition="all 0.2s"
                _hover={{
                  transform: "translateY(-4px)",
                  boxShadow: "lg",
                }}
              >
                <VStack align="stretch" spacing="15px">
                  {/* User Info */}
                  <Flex align="center" gap="10px">
                    <Icon as={MdPerson} w="20px" h="20px" color={brandColor} />
                    <VStack align="start" spacing="0">
                      <Text color={textColor} fontSize="sm" fontWeight="600">
                        {doc.userName || "N/A"}
                      </Text>
                      <Text color={textColorSecondary} fontSize="xs">
                        {doc.userEmail}
                      </Text>
                    </VStack>
                  </Flex>

                  {/* Document Type */}
                  <Flex justify="space-between" align="center">
                    <Text color={textColor} fontSize="md" fontWeight="600">
                      {getDocumentTypeLabel(doc.documentType)}
                    </Text>
                    {getStatusBadge(doc.status)}
                  </Flex>

                  {/* Image Preview */}
                  {doc.fileUrl && doc.fileUrl.match(/\.(jpg|jpeg|png|webp)$/i) && (
                    <Image
                      src={doc.fileUrl}
                      alt={getDocumentTypeLabel(doc.documentType)}
                      borderRadius="10px"
                      maxH="200px"
                      objectFit="cover"
                      w="100%"
                    />
                  )}

                  {/* Upload Date */}
                  <Text color={textColorSecondary} fontSize="xs">
                    Upload: {new Date(doc.uploadedAt).toLocaleString("vi-VN")}
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
            minH="400px"
            gap="10px"
          >
            <Icon as={MdImage} w="80px" h="80px" color={textColorSecondary} />
            <Text color={textColor} fontSize="lg" fontWeight="600">
              Không có giấy tờ chờ duyệt
            </Text>
            <Text color={textColorSecondary} fontSize="sm">
              Tất cả giấy tờ đã được xử lý
            </Text>
          </Flex>
        )}
      </Card>

      {/* Document Detail Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl" isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Chi tiết giấy tờ</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedDoc && (
              <VStack spacing="20px" align="stretch">
                {/* User Info */}
                <Box>
                  <Text color={textColorSecondary} fontSize="sm" mb="5px">
                    Người dùng
                  </Text>
                  <Text color={textColor} fontSize="md" fontWeight="600">
                    {selectedDoc.userName || "N/A"}
                  </Text>
                  <Text color={textColorSecondary} fontSize="sm">
                    {selectedDoc.userEmail}
                  </Text>
                </Box>

                {/* Document Type */}
                <Box>
                  <Text color={textColorSecondary} fontSize="sm" mb="5px">
                    Loại giấy tờ
                  </Text>
                  <Text color={textColor} fontSize="md" fontWeight="600">
                    {getDocumentTypeLabel(selectedDoc.documentType)}
                  </Text>
                </Box>

                {/* Status */}
                <Box>
                  <Text color={textColorSecondary} fontSize="sm" mb="5px">
                    Trạng thái
                  </Text>
                  {getStatusBadge(selectedDoc.status)}
                </Box>

                {/* Image */}
                {selectedDoc.fileUrl && (
                  <Box>
                    <Text color={textColorSecondary} fontSize="sm" mb="10px">
                      Ảnh giấy tờ
                    </Text>
                    <Image
                      src={selectedDoc.fileUrl}
                      alt={getDocumentTypeLabel(selectedDoc.documentType)}
                      borderRadius="10px"
                      maxH="500px"
                      objectFit="contain"
                      w="100%"
                    />
                  </Box>
                )}

                {/* Upload Date */}
                <Box>
                  <Text color={textColorSecondary} fontSize="sm" mb="5px">
                    Thời gian upload
                  </Text>
                  <Text color={textColor} fontSize="md">
                    {new Date(selectedDoc.uploadedAt).toLocaleString("vi-VN")}
                  </Text>
                </Box>
              </VStack>
            )}
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Đóng
            </Button>
            {selectedDoc && selectedDoc.status === "PENDING" && (
              <>
                <Button
                  colorScheme="red"
                  mr={3}
                  onClick={() => handleUpdateStatus(selectedDoc.id, "REJECTED")}
                  isLoading={processing === selectedDoc.id}
                  leftIcon={<Icon as={MdCancel} />}
                >
                  Từ chối
                </Button>
                <Button
                  colorScheme="green"
                  onClick={() => handleUpdateStatus(selectedDoc.id, "VERIFIED")}
                  isLoading={processing === selectedDoc.id}
                  leftIcon={<Icon as={MdCheckCircle} />}
                >
                  Phê duyệt
                </Button>
              </>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}

