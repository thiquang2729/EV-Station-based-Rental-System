/*!
  _   _  ___  ____  ___ ________  _   _   _   _ ___
 | | | |/ _ \|  _ \|_ _|__  / _ \| \ | | | | | |_ _|
 | |_| | | | | |_) || |  / / | | |  \| | | | | || |
 |  _  | |_| |  _ < | | / /| |_| | |\  | | |_| || |
 |_| |_|\___/|_| \_\___/____\___/|_| \_|  \___/|___|

=========================================================
* Horizon UI - v1.1.0
=========================================================

* Product Page: https://www.horizon-ui.com/
* Copyright 2023 Horizon UI (https://www.horizon-ui.com/)

* Designed and Coded by Simmmple

=========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

*/

import React, { useEffect, useMemo } from "react";
import {
  Box,
  Flex,
  Icon,
  SimpleGrid,
  Text,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import {
  MdPendingActions,
  MdPeople,
  MdTrendingUp,
  MdVerified,
  MdBlock,
} from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";

import MiniStatistics from "components/card/MiniStatistics";
import IconBox from "components/icons/IconBox";
import UserRegistrationChart from "views/admin/default/components/UserRegistrationChart";
// import WeeklyRevenue from "views/admin/default/components/WeeklyRevenue";
// import CheckTable from "views/admin/default/components/CheckTable";
// import ComplexTable from "views/admin/default/components/ComplexTable";
// import DailyTraffic from "views/admin/default/components/DailyTraffic";
// import PieCard from "views/admin/default/components/PieCard";
// import Tasks from "views/admin/default/components/Tasks";
import MiniCalendar from "components/calendar/MiniCalendar";
import UserListTable from "views/admin/default/components/UserListTable";
import {
  columnsDataCheck,
  columnsDataComplex,
} from "views/admin/default/variables/columnsData";
import tableDataCheck from "views/admin/default/variables/tableDataCheck.json";
import tableDataComplex from "views/admin/default/variables/tableDataComplex.json";
import { fetchUserStats } from "@/features/users/userStatsSlice";
import { hasAdminAccess } from "@/utils/auth";

export default function UserReports() {
  const dispatch = useDispatch();
  const toast = useToast();

  const brandColor = useColorModeValue("brand.500", "white");
  const boxBg = useColorModeValue("secondaryGray.300", "whiteAlpha.100");

  const { data: stats, status, error } = useSelector((state) => state.userStats);
  const { accessToken, user } = useSelector((state) => state.auth);
  const isAdmin = hasAdminAccess(user);

  useEffect(() => {
    if (!isAdmin) {
      if (user && !toast.isActive("user-stats-admin-only")) {
        toast({
          id: "user-stats-admin-only",
          status: "info",
          title: "Quyền truy cập hạn chế",
          description: "Bạn cần quyền quản trị để xem thống kê người dùng.",
          duration: 4000,
          isClosable: true,
          position: "bottom-right",
        });
      }
      return;
    }

    if (accessToken && status === "idle") {
      dispatch(fetchUserStats());
    }
  }, [dispatch, accessToken, status, isAdmin, toast, user]);

  useEffect(() => {
    if (isAdmin && status === "failed" && error) {
      toast({
        status: "error",
        title: "Không thể tải thống kê người dùng",
        description: error,
        duration: 4000,
        isClosable: true,
        position: "bottom-right",
      });
    }
  }, [status, error, toast, isAdmin]);

  const isLoading = isAdmin && (status === "loading" || status === "idle");

  const safeStats = stats?.data || stats || {
    totalUsers: 0,
    verifiedUsers: 0,
    unverifiedUsers: 0,
    statusBreakdown: [],
  };

  const statusMap = useMemo(() => {
    const breakdown = safeStats.statusBreakdown || [];
    return breakdown.reduce((acc, item) => {
      const key = (item.verificationStatus || "").toUpperCase();
      acc[key] = Number(item.count) || 0;
      return acc;
    }, {});
  }, [safeStats]);

  const pendingUsers =
    statusMap.PENDING ?? safeStats.unverifiedUsers ?? 0;
  const rejectedUsers =
    statusMap.REJECTED ?? 0;

  const formatNumber = (value) =>
    new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(value ?? 0);

  const totalUsers = safeStats.totalUsers ?? 0;
  const verifiedUsers = safeStats.verifiedUsers ?? 0;
  const verifiedRatio =
    totalUsers > 0 ? Number(((verifiedUsers / totalUsers) * 100).toFixed(1)) : 0;

  const resolveValue = (value) => {
    if (!isAdmin) {
      return "—";
    }
    return isLoading ? "..." : formatNumber(value);
  };

  const resolveRatio = () => {
    if (!isAdmin) {
      return "—";
    }
    return isLoading ? "..." : `${verifiedRatio}%`;
  };

  const cards = [
    {
      key: "total-users",
      name: "Tổng người dùng",
      value: resolveValue(totalUsers),
      icon: MdPeople,
      iconColor: brandColor,
      iconBg: boxBg,
    },
    {
      key: "verified-users",
      name: "Đã xác thực",
      value: resolveValue(verifiedUsers),
      icon: MdVerified,
      iconColor: "green.500",
      iconBg: useColorModeValue("green.100", "green.900"),
    },
    {
      key: "pending-users",
      name: "Chờ xác thực",
      value: resolveValue(pendingUsers),
      icon: MdPendingActions,
      iconColor: "orange.500",
      iconBg: useColorModeValue("orange.100", "orange.900"),
    },
    {
      key: "rejected-users",
      name: "Từ chối xác thực",
      value: resolveValue(rejectedUsers),
      icon: MdBlock,
      iconColor: "red.500",
      iconBg: useColorModeValue("red.100", "red.900"),
    },
    {
      key: "verified-ratio",
      name: "Tỉ lệ xác thực",
      value: resolveRatio(),
      icon: MdTrendingUp,
      iconColor: "purple.500",
      iconBg: useColorModeValue("purple.100", "purple.900"),
      endContent:
        isAdmin && !isLoading && totalUsers > 0 ? (
          <Text fontSize="xs" color="secondaryGray.600" fontWeight="500">
            {formatNumber(verifiedUsers)} / {formatNumber(totalUsers)}
          </Text>
        ) : null,
    },
  ];

  return (
    <Box pt={{ base: "130px", md: "80px", xl: "80px" }}>
      <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} gap="20px" mb="20px">
        {cards.map((card) => (
          <MiniStatistics
            key={card.key}
            startContent={
              <IconBox
                w="56px"
                h="56px"
                bg={card.iconBg}
                icon={<Icon w="32px" h="32px" as={card.icon} color={card.iconColor} />}
              />
            }
            name={card.name}
            value={card.value}
            endContent={card.endContent}
          />
        ))}
      </SimpleGrid>

      {/* <SimpleGrid columns={{ base: 1, md: 2, xl: 2 }} gap="20px" mb="20px"> */}
        <UserRegistrationChart />
        {/* <WeeklyRevenue /> */}
      {/* </SimpleGrid> */}
      <SimpleGrid columns={{ base: 1, md: 1, xl: 2 }} gap="20px" mb="20px">
        {/* <CheckTable columnsData={columnsDataCheck} tableData={tableDataCheck} /> */}
        <SimpleGrid columns={{ base: 1, md: 2, xl: 2 }} gap="20px">
          {/* <DailyTraffic />
          <PieCard /> */}
        </SimpleGrid>
      </SimpleGrid>
      {/* <SimpleGrid columns={{ base: 1, md: 1, xl: 2 }} gap="20px" mb="20px"> */}
        {/* <ComplexTable columnsData={columnsDataComplex} tableData={tableDataComplex} /> */}
        {/* <SimpleGrid columns={{ base: 1, md: 2, xl: 2 }} gap="20px"> */}
          {/* <Tasks /> */}
          <MiniCalendar mb="20px" h="100%" minW="100%" selectRange={false} />
        {/* </SimpleGrid> */}
      {/* </SimpleGrid> */}
      
      {/* User List Section */}
      <Box mb="20px">
        <UserListTable />
      </Box>
    </Box>
  );
}
