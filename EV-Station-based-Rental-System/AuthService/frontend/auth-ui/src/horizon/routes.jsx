import React from 'react';

import { Icon } from '@chakra-ui/react';
import {
  MdBarChart,
  MdPerson,
  MdHome,
  MdLock,
  MdEdit,
  MdDescription,
  MdWarning,
} from 'react-icons/md';

// Admin Imports
import MainDashboard from 'views/admin/default';
import EditUser from 'views/admin/marketplace';
import DocumentManagement from 'views/admin/documents';
import ComplaintManagement from 'views/admin/complaints';
import Profile from 'views/admin/profile';
import DataTables from 'views/admin/dataTables';
import RiskyUsersPage from 'views/admin/riskyUsers';
import { MdReportProblem } from 'react-icons/md';
import RTL from 'views/admin/rtl';

// Auth Imports
import LoginPage from '@/pages/LoginPage';

const routes = [
  {
    name: 'Main Dashboard',
    layout: '/admin',
    path: '/default',
    icon: <Icon as={MdHome} width="20px" height="20px" color="inherit" />,
    component: <MainDashboard />,
  },
  {
    name: 'Quản lý giấy tờ',
    layout: '/admin',
    path: '/documents',
    icon: (
      <Icon
        as={MdDescription}
        width="20px"
        height="20px"
        color="inherit"
      />
    ),
    component: <DocumentManagement />,
    adminOnly: true,
  },
  {
    name: 'Quản lý khiếu nại',
    layout: '/admin',
    path: '/complaints',
    icon: (
      <Icon
        as={MdWarning}
        width="20px"
        height="20px"
        color="inherit"
      />
    ),
    component: <ComplaintManagement />,
  },
  {
    name: 'Chỉnh sửa người dùng',
    layout: '/admin',
    path: '/edit-user',
    icon: (
      <Icon
        as={MdEdit}
        width="20px"
        height="20px"
        color="inherit"
      />
    ),
    component: <EditUser />,
    secondary: true,
  },
  // {
  //   name: 'Data Tables',
  //   layout: '/admin',
  //   icon: <Icon as={MdBarChart} width="20px" height="20px" color="inherit" />,
  //   path: '/data-tables',
  //   component: <DataTables />,
  // },
  {
    name: 'Khách hàng rủi ro',
    layout: '/admin',
    icon: <Icon as={MdWarning} width="20px" height="20px" color="inherit" />,
    path: '/risky-users',
    component: <RiskyUsersPage />,
  },
  // {
  //   name: 'Profile',
  //   layout: '/admin',
  //   path: '/profile',
  //   icon: <Icon as={MdPerson} width="20px" height="20px" color="inherit" />,
  //   component: <Profile />,
  // },
  // {
  //   name: 'Sign In',
  //   layout: '/auth',
  //   path: '/sign-in',
  //   icon: <Icon as={MdLock} width="20px" height="20px" color="inherit" />,
  //   component: <LoginPage />,
  // },
  // {
  //   name: 'RTL Admin',
  //   layout: '/rtl',
  //   path: '/rtl-default',
  //   icon: <Icon as={MdHome} width="20px" height="20px" color="inherit" />,
  //   component: <RTL />,
  // },
];

export default routes;
