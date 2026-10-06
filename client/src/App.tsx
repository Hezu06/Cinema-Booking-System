import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { AuthModal } from './components/auth/AuthModal';
import { ScrollToTop } from './components/layout/ScrollToTop';

import { HomePage } from './pages/HomePage';
import { MovieDetailPage } from './pages/MovieDetailPage';
import { TimeSelectionPage } from './pages/TimeSelectionPage';
import { SeatSelectionPage } from './pages/SeatSelectionPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { TicketSuccessPage } from './pages/TicketSuccessPage';
import { ProfilePage } from './pages/ProfilePage';
import { MyBookingsPage } from './pages/MyBookingsPage';
import { PaymentResultPage } from './pages/PaymentResultPage';

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <div className="min-h-screen flex flex-col bg-[#08080C] text-[#F1F1F4] selection:bg-[#FCFC65] selection:text-[#08080C] font-sans">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Home Page & Cinemas Section */}
              <Route path="/" element={<HomePage />} />
              <Route path="/cinemas" element={<HomePage />} />

              {/* Movie Details Page */}
              <Route path="/movies/:id" element={<MovieDetailPage />} />

              {/* Time Selection Page */}
              <Route path="/movies/:id/showtimes" element={<TimeSelectionPage />} />

              {/* Booking Flow: Step 1 Seat Selection */}
              <Route path="/booking/:showtimeId" element={<SeatSelectionPage />} />

              {/* Redirect legacy snack route directly to payment */}
              <Route path="/booking/:showtimeId/snacks" element={<Navigate to="../payment" replace />} />

              {/* Booking Flow: Step 2 Payment */}
              <Route path="/booking/:showtimeId/payment" element={<CheckoutPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />

              {/* Booking Flow: Step 3 Ticket Success */}
              <Route path="/ticket/:bookingId" element={<TicketSuccessPage />} />
              <Route path="/payment/result" element={<PaymentResultPage />} />

              {/* User Profile & My Tickets */}
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/my-bookings" element={<MyBookingsPage />} />
            </Routes>
          </main>
          <Footer />
          <AuthModal />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
