import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
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
  Stack,
  Text,
} from "@chakra-ui/react";
import { MdOutlineRemoveRedEye } from "react-icons/md";
import { RiEyeCloseLine } from "react-icons/ri";
import DefaultAuth from "layouts/auth/Default";
import { HSeparator } from "components/separator/Separator";
import { loginUser, resetStatus } from "../features/auth/authSlice";
import illustration from "../assets/img/auth/auth.png";
import { hasAdminAccess } from "../utils/auth";

const TEXT = {
  title: "Thuê Xe Điện - EV Rental",
  subtitle: "Nhập thông tin đăng nhập",
  emailRequired: "Vui lòng nhập email.",
  passwordRequired: "Vui lòng nhập mật khẩu.",
  processing: "Đang xử lý...",
  submit: "Đăng nhập",
  noAccount: "Chưa có tài khoản?",
  registerNow: "Đăng ký ngay",
  accountLabel: "Tài khoản:",
  verificationLabel: "Trạng thái xác thực:",
  unauthorized: "Tài khoản của bạn không có quyền truy cập trang quản trị.",
};

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { status, error, successMessage, user } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [formError, setFormError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    dispatch(resetStatus());
    return () => {
      dispatch(resetStatus());
    };
  }, [dispatch]);

  useEffect(() => {
    if (!user) {
      setFormError(null);
      return;
    }

    if (hasAdminAccess(user)) {
      const redirectTarget =
        location.state?.from && location.state.reason !== "unauthorized"
          ? location.state.from
          : "/admin";
      navigate(redirectTarget, { replace: true });
      return;
    }

    // Redirect non-admin users to home page
    navigate("/home", { replace: true });
  }, [user, navigate, location.state]);

  useEffect(() => {
    if (location.state?.reason === "unauthorized") {
      setFormError(TEXT.unauthorized);
    }
  }, [location.state]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    if (!formData.email) {
      return TEXT.emailRequired;
    }
    if (!formData.password) {
      return TEXT.passwordRequired;
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
    dispatch(loginUser(formData));
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
            {statusType === "error" ? "Thông báo lỗi" : "Thành công"}
          </AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Box>
      </Alert>
    );
  };

  return (
    <DefaultAuth illustrationBackground={illustration}>
      <Flex
        maxW={{ base: "100%", md: "480px" }}
        w="100%"
        me="auto"
        mt={{ base: "40px", md: "12vh" }}
        px={{ base: "0px", md: "0px" }}
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

          {user && (
            <Box borderRadius="16px" bg="whiteAlpha.800" p="6" boxShadow="sm">
              <Text fontWeight="600" color="navy.700" mb="2">
                {TEXT.accountLabel} {user.fullName || user.email}
              </Text>
              <Text color="secondaryGray.600">Email: {user.email}</Text>
              <Text color="secondaryGray.600">
                {TEXT.verificationLabel} {user.verificationStatus}
              </Text>
            </Box>
          )}

          <Stack spacing={5}>
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
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={status === "loading"}
                  autoComplete="current-password"
                />
                <InputRightElement h="full" mt="4px">
                  <Icon
                    color="secondaryGray.600"
                    as={showPassword ? RiEyeCloseLine : MdOutlineRemoveRedEye}
                    cursor="pointer"
                    onClick={() => setShowPassword((prev) => !prev)}
                  />
                </InputRightElement>
              </InputGroup>
            </FormControl>
          </Stack>

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
              {TEXT.noAccount}
            </Text>
            <HSeparator />
          </Flex>

          <Button
            as={RouterLink}
            to="/register"
            variant="outline"
            borderRadius="16px"
            height="50px"
            fontWeight="600"
          >
            {TEXT.registerNow}
          </Button>
        </Stack>
      </Flex>
    </DefaultAuth>
  );
};

export default LoginPage;
