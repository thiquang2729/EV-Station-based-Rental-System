import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Listing from './pages/Listing';
import VehicleList from './pages/VehicleList';
import CarDetails from './pages/CarDetails';
import Blog from './pages/Blog';
import Contact from './pages/Contact';
import MyBookings from './pages/MyBookings';
import Home from './pages/Home';
import Admin from './pages/Admin'; // nếu có

const App = () => {
  return (
    <main>


      <Header />
      {/* <img src={assets.menu} alt="menu test" width={40} /> */}
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/listing" element={<Listing />} />
        <Route path="/listing/:id" element={<CarDetails />} />
        <Route path="/vehicles" element={<VehicleList />} />
        <Route path="/vehicles/:id" element={<CarDetails />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/my-bookings" element={<MyBookings />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
      <Footer />


    </main>
  );
};

export default App;

