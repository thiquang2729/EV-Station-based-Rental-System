import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import userService from "../../services/userService";
import { refreshAuthSession } from "../auth/authSlice";

export const fetchUserStats = createAsyncThunk(
  "userStats/fetch",
  async (_, { getState, dispatch, rejectWithValue }) => {
    const state = getState();
    const accessToken = state.auth?.accessToken;

    const requestStats = async (token) => {
      const response = await userService.getUserStats(token);
      return response;
    };

    try {
      return await requestStats(accessToken);
    } catch (error) {
      const status = error.response?.status;
      const code = error.response?.data?.code || error.response?.data?.error?.code;

      if ((status === 401 || status === 403) && code === "INVALID_TOKEN") {
        try {
          await dispatch(refreshAuthSession()).unwrap();
          const refreshedState = getState();
          const refreshedToken = refreshedState.auth?.accessToken;
          return await requestStats(refreshedToken);
        } catch (refreshError) {
          return rejectWithValue("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.");
        }
      }

      if (status === 403 && code === "FORBIDDEN") {
        return rejectWithValue("Bạn không có quyền xem thống kê người dùng.");
      }

      const message =
        error.response?.data?.message ||
        error.message ||
        "Không thể lấy thống kê người dùng.";
      return rejectWithValue(message);
    }
  }
);

const initialState = {
  data: null,
  status: "idle",
  error: null,
};

const userStatsSlice = createSlice({
  name: "userStats",
  initialState,
  reducers: {
    resetUserStatsState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserStats.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchUserStats.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.data = action.payload;
        state.error = null;
      })
      .addCase(fetchUserStats.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Không thể lấy thống kê người dùng.";
      });
  },
});

export const { resetUserStatsState } = userStatsSlice.actions;

export default userStatsSlice.reducer;
