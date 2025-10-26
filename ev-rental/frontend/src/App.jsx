import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';
import Listing from './pages/Listing';
import VehicleList from './pages/VehicleList';
import CarDetails from './pages/CarDetails';
import Blog from './pages/Blog';
import Contact from './pages/Contact';
import MyBookings from './pages/MyBookings';
import Home from './pages/Home';
import Admin from './pages/Admin'; // nếu có

const App = () => {
  const location = useLocation();
  return (
    <main>


      <Header />
      {/* <img src={assets.menu} alt="menu test" width={40} /> */}
      <ErrorBoundary>
      <Routes location={location}>
        <Route path="/" element={<Home />} />

        <Route path="/listing" element={<Listing />} />
        <Route path="/listing/:id" element={<CarDetails key={`listing-${location.key}`} />} />
        <Route path="/vehicles" element={<VehicleList />} />
        <Route path="/vehicles/:id" element={<CarDetails key={`vehicles-${location.key}`} />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/my-bookings" element={<MyBookings />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
      </ErrorBoundary>
      <Footer />


    </main>
  );
};

export default App;

