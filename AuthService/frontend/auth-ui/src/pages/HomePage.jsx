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
  SimpleGrid,
  Spinner,
} from "@chakra-ui/react";
import { MdLogout, MdUploadFile, MdPerson, MdVerifiedUser, MdSecurity, MdImage, MdCheckCircle, MdCancel, MdPending, MdWarning, MdAdd } from "react-icons/md";
import { logoutUser } from "../features/auth/authSlice";
import { hasAdminAccess } from "../utils/auth";
import { uploadDocument, getDocumentsByUserId } from "../services/documentService";
import { getComplaintsByRenterId, createComplaint } from "../services/complaintService";

// Import new components
import Header from "../components/Header";
import HeroSection from "../components/HeroSection";
import AboutUsSection from "../components/AboutUsSection";
import ProcessSection from "../components/ProcessSection";
import FleetSection from "../components/FleetSection";
import TestimonialsSection from "../components/TestimonialsSection";
import CTASection from "../components/CTASection";
import Footer from "../components/Footer";

const HomePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const toast = useToast();
  const uploadModal = useDisclosure();
  const complaintModal = useDisclosure();
  const fileInputRef = useRef(null);
  
  const { user, accessToken } = useSelector((state) => state.auth);

  const [documentType, setDocumentType] = useState("DRIVER_LICENSE");
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

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

    // Load documents and complaints
    loadDocuments();
    loadComplaints();
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

  const handleUploadDocuments = () => {
    uploadModal.onOpen();
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
      
      {/* Hero Section */}
      <HeroSection />
      
      {/* Process Section */}
      <ProcessSection />
      
      {/* Fleet Section */}
      <FleetSection />
      
      {/* About Us Section */}
      <AboutUsSection />
      
      {/* Testimonials Section */}
      <TestimonialsSection />
      
      {/* CTA Section */}
      <CTASection />

      {/* Footer */}
      <Footer />
    </Box>
  );
};

export default HomePage;