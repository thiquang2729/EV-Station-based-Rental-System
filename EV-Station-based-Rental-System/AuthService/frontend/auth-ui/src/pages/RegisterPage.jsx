import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link as RouterLink } from "react-router-dom";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Icon,
  Input,
  InputGroup,
  InputRightElement,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import { MdOutlineRemoveRedEye } from "react-icons/md";
import { RiEyeCloseLine } from "react-icons/ri";
import DefaultAuth from "layouts/auth/Default";
import { HSeparator } from "components/separator/Separator";
import { registerUser, resetStatus } from "../features/auth/authSlice";
import illustration from "assets/img/auth/auth.png";

const TEXT = {
  title: "Tạo tài khoản quản trị",
  subtitle: "Đăng ký để quản lý hệ thống thuê xe tại các trạm sạc.",
  fullNameRequired: "Vui lòng nhập họ tên.",
  emailRequired: "Vui lòng nhập email.",
  passwordRequired: "Vui lòng nhập mật khẩu.",
  confirmMismatch: "Mật khẩu xác nhận không khớp.",
  processing: "Đang xử lý...",
  submit: "Đăng ký",
  phoneOptional: "Số điện thoại (không bắt buộc)",
  alreadyHaveAccount: "Đã có tài khoản?",
  loginNow: "Đăng nhập",
  successTitle: "Đăng ký thành công",
};

const RegisterPage = () => {
  const dispatch = useDispatch();
  const { status, error, successMessage } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
  });
  const [formError, setFormError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    dispatch(resetStatus());
    return () => {
      dispatch(resetStatus());
    };
  }, [dispatch]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    if (!formData.fullName) {
      return TEXT.fullNameRequired;
    }
    if (!formData.email) {
      return TEXT.emailRequired;
    }
    if (!formData.password) {
      return TEXT.passwordRequired;
    }
    if (formData.password !== formData.confirmPassword) {
      return TEXT.confirmMismatch;
    }
    return null;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setFormError(validationError);
      return;
    }
    setFormError(null);
    dispatch(
      registerUser({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        phoneNumber: formData.phoneNumber || undefined,
      })
    );
  };

  const renderAlert = () => {
    const message = formError || error || successMessage;
    if (!message) {
      return null;
    }

    const statusType = formError || error ? "error" : "success";
    return (
      <Alert status={statusType} borderRadius="16px" variant="left-accent">
        <AlertIcon />
        <Box>
          <AlertTitle fontWeight="600">
            {statusType === "error" ? "Thông báo lỗi" : TEXT.successTitle}
          </AlertTitle>
          <AlertDescription>
            {message}{" "}
            {statusType === "success" && (
              <Button
                as={RouterLink}
                to="/login"
                variant="link"
                color="brand.500"
                fontWeight="600"
                ml="1"
              >
                {TEXT.loginNow}
              </Button>
            )}
          </AlertDescription>
        </Box>
      </Alert>
    );
  };

  return (
    <DefaultAuth illustrationBackground={illustration}>
      <Flex
        maxW={{ base: "100%", md: "560px" }}
        w="100%"
        me="auto"
        mt={{ base: "40px", md: "10vh" }}
        direction="column"
        gap={8}
      >
        <Stack spacing={2}>
          <Heading color="navy.700" fontSize="36px">
            {TEXT.title}
          </Heading>
          <Text color="secondaryGray.600" fontSize="md">
            {TEXT.subtitle}
          </Text>
        </Stack>

        <Stack spacing={6} as="form" onSubmit={handleSubmit}>
          {renderAlert()}

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
            <FormControl>
              <FormLabel fontSize="sm" fontWeight="500" color="navy.700" ms="4px">
                Họ tên
              </FormLabel>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                variant="auth"
                placeholder="Nguyễn Văn A"
                value={formData.fullName}
                onChange={handleChange}
                disabled={status === "loading"}
              />
            </FormControl>

            <FormControl>
              <FormLabel fontSize="sm" fontWeight="500" color="navy.700" ms="4px">
                Email
              </FormLabel>
              <Input
                id="email"
                name="email"
                type="email"
                variant="auth"
                placeholder="nhapemail@example.com"
                value={formData.email}
                onChange={handleChange}
                disabled={status === "loading"}
                autoComplete="email"
              />
            </FormControl>
          </SimpleGrid>

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
            <FormControl>
              <FormLabel fontSize="sm" fontWeight="500" color="navy.700" ms="4px">
                {TEXT.phoneOptional}
              </FormLabel>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                variant="auth"
                placeholder="0123456789"
                value={formData.phoneNumber}
                onChange={handleChange}
                disabled={status === "loading"}
              />
            </FormControl>

            <Box />
          </SimpleGrid>

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
            <FormControl>
              <FormLabel fontSize="sm" fontWeight="500" color="navy.700" ms="4px">
                Mật khẩu
              </FormLabel>
              <InputGroup size="md">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  variant="auth"
                  placeholder="Tối thiểu 8 ký tự"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={status === "loading"}
                  autoComplete="new-password"
                />
                <InputRightElement h="full" mt="4px">
                  <Icon
                    as={showPassword ? RiEyeCloseLine : MdOutlineRemoveRedEye}
                    color="secondaryGray.600"
                    cursor="pointer"
                    onClick={() => setShowPassword((prev) => !prev)}
                  />
                </InputRightElement>
              </InputGroup>
            </FormControl>

            <FormControl>
              <FormLabel fontSize="sm" fontWeight="500" color="navy.700" ms="4px">
                Xác nhận mật khẩu
              </FormLabel>
              <InputGroup size="md">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  variant="auth"
                  placeholder="Nhập lại mật khẩu"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={status === "loading"}
                  autoComplete="new-password"
                />
                <InputRightElement h="full" mt="4px">
                  <Icon
                    as={showConfirmPassword ? RiEyeCloseLine : MdOutlineRemoveRedEye}
                    color="secondaryGray.600"
                    cursor="pointer"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                  />
                </InputRightElement>
              </InputGroup>
            </FormControl>
          </SimpleGrid>

          <Button
            type="submit"
            variant="brand"
            size="lg"
            fontWeight="600"
            isLoading={status === "loading"}
          >
            {status === "loading" ? TEXT.processing : TEXT.submit}
          </Button>

          <Flex align="center" gap={4}>
            <HSeparator />
            <Text color="secondaryGray.500" fontSize="sm">
              {TEXT.alreadyHaveAccount}
            </Text>
            <HSeparator />
          </Flex>

          <Button
            as={RouterLink}
            to="/login"
            variant="outline"
            borderRadius="16px"
            height="50px"
            fontWeight="600"
          >
            {TEXT.loginNow}
          </Button>
        </Stack>
      </Flex>
    </DefaultAuth>
  );
};

export default RegisterPage;
