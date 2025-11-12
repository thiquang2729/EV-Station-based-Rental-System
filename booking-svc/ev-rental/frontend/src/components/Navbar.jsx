// import React from "react";
// import { NavLink } from "react-router-dom";

// const Navbar = ({ setMenuOpened, containerStyles }) => {
//     // Danh sách các đường dẫn
//     const navLinks = [
//         { path: "/", title: "Home" },
//         { path: "/listing", title: "Listing" },
//         { path: "/blog", title: "Blog" },
//         { path: "/contact", title: "Contact" },
//     ];

//     return (
//         <nav className={containerStyles}>
//             {navLinks.map((link) => (
//                 <NavLink
//                     key={link.title}
//                     to={link.path}
//                     onClick={() => {
//                         setMenuOpened(false);
//                         scrollTo(0, 0);
//                     }}
//                     className={({ isActive }) =>
//                         `${isActive ? "active-link" : ""} px-3 py-2 rounded-full uppercase text-sm font-bold`
//                     }
//                 >
//                     {link.title}
//                 </NavLink>
//             ))}
//         </nav>
//     );
// };

// export default Navbar;
import React from 'react';
import { NavLink } from 'react-router-dom';

const Navbar = ({ setMenuOpened, containerStyles = '' }) => {
  const navLinks = [
    { path: '/', title: 'Home' },
    { path: '/listing', title: 'Listing' },
    { path: '/blog', title: 'Blog' },
    { path: '/contact', title: 'Contact' },
  ];
  return (
    <nav className={containerStyles}>
      {navLinks.map((l) => (
        <NavLink
          key={l.title}
          to={l.path}
          onClick={() => setMenuOpened && setMenuOpened(false)}
          className={({ isActive }) => `${isActive ? 'active-link' : ''} px-3 py-2 rounded-full uppercase text-sm font-bold`}
        >
          {l.title}
        </NavLink>
      ))}
    </nav>
  );
};

export default Navbar;
