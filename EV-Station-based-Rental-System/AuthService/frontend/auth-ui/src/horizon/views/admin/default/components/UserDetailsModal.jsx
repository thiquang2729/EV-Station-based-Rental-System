import React from "react";
import {
  Box,
  Badge,
  Card,
  Flex,
  HStack,
  Icon,
  Image,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  SimpleGrid,
  Text,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react";
import { MdLocationOn, MdPerson, MdNote } from "react-icons/md";

export default function UserDetailsModal({
  isOpen,
  onClose,
  loading,
  userDetails,
  userDocuments,
  verificationLogs,
  ui: { textColor, textColorSecondary, borderColor, brandColor },
  helpers: { getVerificationBadge, getRiskBadge, formatDate },
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Thông tin người dùng</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          {loading ? (
            <Flex justify="center" align="center" minH="200px">
              <Text>Đang tải...</Text>
            </Flex>
          ) : userDetails ? (
            <VStack spacing="20px" align="stretch">
              <Box p="20px" bg={useColorModeValue("gray.50", "navy.700")} borderRadius="12px">
                <Text fontSize="lg" fontWeight="700" color={textColor} mb="15px">Thông tin cơ bản</Text>
                <SimpleGrid columns={{ base: 1, md: 2 }} gap="15px">
                  <Box>
                    <Text fontSize="sm" color={textColorSecondary} mb="5px">Họ và tên</Text>
                    <Text fontWeight="600" color={textColor}>{userDetails.fullName || "N/A"}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color={textColorSecondary} mb="5px">Email</Text>
                    <Text fontWeight="600" color={textColor}>{userDetails.email}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color={textColorSecondary} mb="5px">Số điện thoại</Text>
                    <Text fontWeight="600" color={textColor}>{userDetails.phoneNumber || "N/A"}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color={textColorSecondary} mb="5px">Vai trò</Text>
                    <Badge colorScheme="blue">{userDetails.role || "RENTER"}</Badge>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color={textColorSecondary} mb="5px">Trạng thái xác thực</Text>
                    {getVerificationBadge(userDetails.verificationStatus)}
                  </Box>
                  <Box>
                    <Text fontSize="sm" color={textColorSecondary} mb="5px">Mức độ rủi ro</Text>
                    {getRiskBadge(userDetails.riskStatus)}
                  </Box>
                  <Box>
                    <Text fontSize="sm" color={textColorSecondary} mb="5px">Ngày đăng ký</Text>
                    <Text fontWeight="600" color={textColor}>{formatDate(userDetails.createdAt)}</Text>
                  </Box>
                </SimpleGrid>
              </Box>

              <Box>
                <Text fontSize="lg" fontWeight="700" color={textColor} mb="15px">Giấy tờ đã upload</Text>
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
                              <Image src={doc.fileUrl} alt="Document" maxH="200px" objectFit="contain" borderRadius="8px" />
                            </Box>
                          )}
                          <Text fontSize="sm" color={textColorSecondary}>Upload: {formatDate(doc.uploadedAt)}</Text>
                        </VStack>
                      </Card>
                    ))}
                  </SimpleGrid>
                ) : (
                  <Text color={textColorSecondary}>Chưa có giấy tờ nào</Text>
                )}
              </Box>

              <Box>
                <Text fontSize="lg" fontWeight="700" color={textColor} mb="15px">Lịch sử xác thực tại điểm</Text>
                {verificationLogs.length > 0 ? (
                  <VStack spacing="10px" align="stretch">
                    {verificationLogs.map((log) => (
                      <Card key={log.id} p="15px" border="1px solid" borderColor={borderColor}>
                        <VStack align="stretch" spacing="8px">
                          <Flex justify="space-between" align="center">
                            <HStack>
                              <Icon as={MdLocationOn} color={brandColor} />
                              <Text fontWeight="600" color={textColor}>Trạm: {log.stationName || log.stationId || "N/A"}</Text>
                            </HStack>
                            <Text fontSize="sm" color={textColorSecondary}>{formatDate(log.createdAt)}</Text>
                          </Flex>
                          {log.staffName && (
                            <HStack>
                              <Icon as={MdPerson} color={brandColor} />
                              <Text fontSize="sm" color={textColor}>Xác thực bởi: {log.staffName}</Text>
                            </HStack>
                          )}
                          {log.note && (
                            <HStack align="start">
                              <Icon as={MdNote} color={brandColor} mt="2px" />
                              <Text fontSize="sm" color={textColor}>{log.note}</Text>
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
          <Button onClick={onClose}>Đóng</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}


