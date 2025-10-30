
# EV Rental - Frontend Application

## 1. Project Overview

This is the frontend application for the EV-Rental Service. It provides a user interface for three distinct user roles: **Admin**, **Staff**, and **Renter**. The application is built with React and Tailwind CSS and is designed to interact with a set of backend microservices for payments and analytics.

This document serves as a guide for backend developers on how to connect this UI to the live API endpoints.

---

## 2. Features

- **Role-Based Access Control (RBAC)**: The UI dynamically adapts based on the logged-in user's role.
  - **Admin**: Full access to the Analytics Dashboard and Station POS.
  - **Staff**: Access to the Station POS for their assigned station.
  - **Renter**: Access to the online vehicle booking and payment flow.
- **Authentication Flow**: A simulated login screen and user profile display in the navigation bar, managed via a global `AuthContext`.
- **Analytics Dashboard**: (Admin-only) A comprehensive view with charts for revenue, vehicle utilization, and a detailed daily report for all stations.
- **Station POS (Point of Sale)**: (Admin & Staff) A functional interface for staff to create new transactions (Cash, Card, VNPAY) at a physical station. It also displays a list of today's transactions.
- **Online Booking & Payment**: (Renter-only) A multi-step flow for renters to confirm a booking and choose a payment method.
- **VNPAY Integration (Mock)**: Simulates a redirect to the VNPAY payment gateway and includes a confirmation step to proceed to a success page.
- **Payment Success Page**: A confirmation screen displaying a full summary of the booking after a successful online payment.

---

## 3. Technology Stack

- **React**: A JavaScript library for building user interfaces.
- **Tailwind CSS**: A utility-first CSS framework for rapid UI development.
- **Recharts**: A composable charting library for data visualization.
- **TypeScript**: All data structures are strongly typed for clarity and safety.

---

## 4. Project Structure

The project is organized into logical directories to separate concerns.

```
/
├── api/
│   └── paymentApi.ts       # MOCK: API call simulations. **CONNECT BACKEND HERE.**
├── components/
│   ├── ui/                 # Reusable UI elements (Button, Card, Input).
│   ├── Booking.tsx         # Renter's booking confirmation & payment page.
│   ├── Dashboard.tsx       # Admin's analytics dashboard.
│   ├── Login.tsx           # Login page for role simulation.
│   ├── Navbar.tsx          # Top navigation bar, aware of user role.
│   ├── PaymentSuccess.tsx  # Renter's payment success confirmation page.
│   ├── POS.tsx             # Staff/Admin's Point-of-Sale interface.
│   ├── RevenueChart.tsx    # Chart component for revenue data.
│   └── ...                 # Other UI components.
├── contexts/
│   └── AuthContext.tsx     # Global state management for authentication. **CONNECT BACKEND HERE.**
├── types.ts                # Global TypeScript interfaces and enums for data models.
├── App.tsx                 # Main application component, handles routing.
├── index.html              # The main HTML file.
├── index.tsx               # The entry point of the React application.
└── README.md               # This documentation file.
```

---

## 5. How to Connect to the Backend

This UI is fully functional but uses mock data and simulated API calls. To connect it to the live backend, you will primarily need to modify the files in the `api/` and `contexts/` directories.

### Step 1: Implement Real Authentication

The current authentication is simulated. You need to connect it to your `auth-svc`.

**File to Modify**: `src/contexts/AuthContext.tsx`

1.  **Update the `login` function**:
    -   Replace the current mock logic with a `fetch` or `axios` call to your backend's login endpoint (e.g., `POST /api/v1/auth/login`).
    -   The function should send user credentials (e.g., email/password, which you'll need to add to the `Login.tsx` form).
    -   On a successful response, the backend should return a JWT and user information (`id`, `name`, `role`).
    -   Store the JWT securely (e.g., in `localStorage` or a cookie).
    -   Update the `currentUser` state with the user information received from the backend.
2.  **Update the `logout` function**:
    -   Clear the stored JWT.
    -   Set the `currentUser` state to `null`.
3.  **Implement a "Check Auth" function**:
    -   Use a `useEffect` hook within the `AuthProvider` to check for an existing JWT on application load. If a valid token exists, make an API call to a `/me` or `/verify` endpoint to get the user's data and automatically log them in.

### Step 2: Implement Payment API Calls

The VNPAY and Pay at Station logic is simulated. Connect it to your `payment-svc`.

**File to Modify**: `src/api/paymentApi.ts`

1.  **Update the `createPaymentIntent` function**:
    -   Remove the `setTimeout` simulation.
    -   Implement a `fetch` or `axios` call to your backend endpoint: `POST /api/v1/payments/intents`.
    -   Include the JWT from the `AuthContext` in the `Authorization: Bearer <token>` header.
    -   The request body should send the booking details and payment method, conforming to the backend's expected DTO.
    -   **For VNPAY**: The backend should respond with `{ success: true, redirectUrl: '...' }`. The function should return this URL to the `Booking.tsx` component.
    -   **For Pay at Station**: The backend should respond with `{ success: true }`.
    -   Implement proper error handling to catch API failures and reject the promise with an informative error message.

### Step 3: Fetch Live Data for Dashboard & POS

The dashboard charts and POS transaction list currently use static mock data. You need to fetch this data from your `analytics-svc` and `payment-svc`.

1.  **Create New API Functions**:
    -   In the `api/` directory, you can create new files like `analyticsApi.ts` or `posApi.ts`.
    -   Add functions to fetch data for:
        -   Revenue: `GET /api/v1/analytics/revenue`
        -   Utilization: `GET /api/v1/analytics/utilization`
        -   Station Reports: `GET /api/v1/reports/stations`
        -   POS Transactions: `GET /api/v1/payments?stationId=...`
2.  **Modify Components to Fetch Data**:
    -   **Target Files**: `RevenueChart.tsx`, `UtilizationChart.tsx`, `StationReport.tsx`, `POS.tsx`.
    -   In each component, use the `useEffect` hook to call the new API functions when the component mounts.
    -   Use a `useState` hook to store the fetched data (e.g., `const [revenueData, setRevenueData] = useState([])`).
    -   Add loading and error states to provide feedback to the user while data is being fetched.

### Step 4: Review Data Models

**File to Reference**: `src/types.ts`

This file contains all the TypeScript interfaces (`Payment`, `Booking`, `User`, etc.) that the frontend expects. Ensure that your backend API responses conform to these data structures. If the backend uses different field names, you can either update these interfaces or transform the data in the API functions before passing it to the components.

---

By following these steps, you can successfully connect this standalone React frontend to your live backend microservices. The application is structured to make this integration process as clear and straightforward as possible.
