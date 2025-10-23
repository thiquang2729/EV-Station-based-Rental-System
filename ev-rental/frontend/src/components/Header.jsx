import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import assets from "../assets/data";
import Navbar from "./Navbar";

const Header = () => {
    const [menuOpened, setMenuOpened] = useState(false);
    const [active, setActive] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const location = useLocation();

    const isHomePage = location.pathname.endsWith("/");

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 40) setActive(true);
            else setActive(false);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <header
            className={`${active ? "bg-white shadow-sm py-2" : "py-3"} ${!isHomePage && "bg-white"
                } fixed top-0 w-full left-0 right-0 z-50 transition-all duration-200`}
        >
            <div className="max-padd-container">
                {/* CONTAINER */}
                <div className="flexBetween">
                    {/* Logo */}
                    <div className="flex flex-1">
                        <Link to={"/"}>
                            <img src={assets.logoImg} alt="logoImg" width={88} className="h-7" />
                            <span className="text-textColor uppercase text-xs font-extrabold tracking-[6px] relative bottom-1">
                                Rentroo
                            </span>
                        </Link>
                    </div>

                    {/* Navbar */}
                    <Navbar
                        setMenuOpened={setMenuOpened}
                        containerStyles={`${menuOpened ? "flex" : "hidden"} lg:flex items-center gap-x-8`}
                    />

                    {/* Buttons & Searchbar & Profile */}
                    <div className="flex sm:flex-1 items-center sm:justify-end gap-x-4 sm:gap-x-8">
                        {/* Searchbar */}
                        <div className="relative hidden xl:flex items-center">
                            <div
                                className={`transition-all duration-300 ease-in-out ring-1 ring-slate-900/10 bg-white rounded-full overflow-hidden ${showSearch ? "w-[266px] opacity-100 px-4 py-2" : "w-11 opacity-0 px-0 py-0"
                                    }`}
                            >
                                <input
                                    type="text"
                                    placeholder="Type here..."
                                    className="w-full text-sm outline-none pr-10 placeholder:text-gray-400"
                                />
                            </div>

                            {/* Toggle Button */}
                            <div
                                onClick={() => setShowSearch((prev) => !prev)}
                                className="absolute right-0 ring-1 ring-slate-900/10 bg-white p-[8px] rounded-full cursor-pointer z-10"
                            >
                                <img src={assets.search} alt="" />
                            </div>
                        </div>

                        {/* Menu Toggle */}
                        {menuOpened ? (
                            <img
                                src={assets.close}
                                alt="close"
                                onClick={() => setMenuOpened(false)}
                                className="lg:hidden cursor-pointer text-xl"
                            />
                        ) : (
                            <img
                                src={assets.menu}
                                alt="menu"
                                onClick={() => setMenuOpened(true)}
                                className="lg:hidden cursor-pointer text-xl"
                            />
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
