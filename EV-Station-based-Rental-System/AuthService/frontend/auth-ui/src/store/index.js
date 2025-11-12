import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import userStatsReducer from "../features/users/userStatsSlice";
import userListReducer from "../features/users/userListSlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    userStats: userStatsReducer,
    userList: userListReducer,
  },
});

export default store;
