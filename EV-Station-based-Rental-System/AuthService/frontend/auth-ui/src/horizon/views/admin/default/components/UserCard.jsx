import React from "react";
import { Box, Button, Card, Flex, Icon, Text } from "@chakra-ui/react";
import { MdEdit, MdDelete, MdEmail, MdPerson, MdCheckCircle, MdVisibility } from "react-icons/md";

export default function UserCard({
  user,
  onView,
  onEdit,
  onVerify,
  isAdminStrict,
  deleteStatus,
  deleteUserId,
  ui: { textColor, textColorSecondary, cardBg, borderColor, hoverBg, brandColor },
  helpers: { getVerificationBadge, formatDate },
}) {
  return (
    <Card
      key={user.id}
      bg={cardBg}
      border="1px solid"
      borderColor={borderColor}
      p="20px"
      borderRadius="15px"
      transition="all 0.2s"
      _hover={{ bg: hoverBg, transform: "translateY(-2px)", boxShadow: "lg" }}
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
            <Text color={textColorSecondary} fontSize="xs">Số điện thoại:</Text>
            <Text color={textColor} fontSize="xs" fontWeight="600">{user.phoneNumber || "N/A"}</Text>
          </Flex>
          <Flex justify="space-between">
            <Text color={textColorSecondary} fontSize="xs">Ngày tạo:</Text>
            <Text color={textColor} fontSize="xs" fontWeight="600">{formatDate(user.createdAt)}</Text>
          </Flex>
        </Flex>

        {/* Action buttons */}
        <Flex gap="8px" pt="10px" wrap="wrap">
          <Button
            size="sm"
            leftIcon={<Icon as={MdVisibility} w="16px" h="16px" />}
            colorScheme="teal"
            variant="outline"
            onClick={() => onView(user)}
            flex="1"
            minW="80px"
          >
            Xem
          </Button>
          <Button
            size="sm"
            leftIcon={<Icon as={MdCheckCircle} w="16px" h="16px" />}
            colorScheme="green"
            variant="outline"
            onClick={() => onVerify(user)}
            isDisabled={user.verificationStatus === "VERIFIED"}
            flex="1"
            minW="80px"
          >
            {isAdminStrict ? "Xác thực" : "Xác thực tại điểm"}
          </Button>
          {isAdminStrict && (
            <>
              <Button
                size="sm"
                leftIcon={<Icon as={MdEdit} w="16px" h="16px" />}
                colorScheme="blue"
                variant="outline"
                onClick={() => onEdit(user.id)}
                flex="1"
                minW="80px"
              >
                Sửa
              </Button>
              <Button
                size="sm"
                leftIcon={<Icon as={MdDelete} w="16px" h="16px" />}
                colorScheme="red"
                variant="outline"
                onClick={() => {
                  /* Cha sẽ xử lý mở dialog xóa */
                  onEdit && onEdit(user.id);
                }}
                isLoading={deleteStatus === "loading" && deleteUserId === user.id}
                flex="1"
                minW="80px"
              >
                Xóa
              </Button>
            </>
          )}
        </Flex>
      </Flex>
    </Card>
  );
}


