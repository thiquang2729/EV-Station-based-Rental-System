import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import userService from "../../services/userService";
import { refreshAuthSession } from "../auth/authSlice";

const DEFAULT_PAGE = 1;

export const fetchUserList = createAsyncThunk(
  "userList/fetch",
  async ({ page = DEFAULT_PAGE, search = null, riskStatus = null, role = null, verificationStatus = null, dateFrom = null, dateTo = null }, { getState, dispatch, rejectWithValue }) => {
    const state = getState();
    const accessToken = state.auth?.accessToken;

    const requestList = async (token) => {
      const response = await userService.fetchUsers({ 
        page, 
        search, 
        riskStatus,
        role,
        verificationStatus,
        dateFrom,
        dateTo,
        accessToken: token 
      });
      return response;
    };

    try {
      return await requestList(accessToken);
    } catch (error) {
      const status = error.response?.status;
      const code = error.response?.data?.code || error.response?.data?.error?.code;

      if ((status === 401 || status === 403) && code === "INVALID_TOKEN") {
        try {
          await dispatch(refreshAuthSession()).unwrap();
          const refreshedState = getState();
          const refreshedToken = refreshedState.auth?.accessToken;
          return await requestList(refreshedToken);
        } catch (refreshError) {
          return rejectWithValue("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.");
        }
      }

      if (status === 403 && code === "FORBIDDEN") {
        return rejectWithValue("Bạn không có quyền xem danh sách người dùng.");
      }

      const message =
        error.response?.data?.message ||
        error.message ||
        "Không thể lấy danh sách người dùng.";
      return rejectWithValue(message);
    }
  }
);

export const deleteUserById = createAsyncThunk(
  "userList/delete",
  async (userId, { getState, dispatch, rejectWithValue }) => {
    const state = getState();
    const accessToken = state.auth?.accessToken;

    const requestDelete = async (token) => {
      const response = await userService.deleteUser({ userId, accessToken: token });
      return { userId, response };
    };

    try {
      return await requestDelete(accessToken);
    } catch (error) {
      const status = error.response?.status;
      const code = error.response?.data?.code || error.response?.data?.error?.code;

      if ((status === 401 || status === 403) && code === "INVALID_TOKEN") {
        try {
          await dispatch(refreshAuthSession()).unwrap();
          const refreshedState = getState();
          const refreshedToken = refreshedState.auth?.accessToken;
          return await requestDelete(refreshedToken);
        } catch (refreshError) {
          return rejectWithValue("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.");
        }
      }

      if (status === 403 && code === "FORBIDDEN") {
        return rejectWithValue("Bạn không có quyền xóa người dùng.");
      }

      if (status === 404 && code === "NOT_FOUND") {
        return rejectWithValue("Người dùng không tồn tại.");
      }

      const message =
        error.response?.data?.message ||
        error.message ||
        "Không thể xóa người dùng.";
      return rejectWithValue(message);
    }
  }
);

const initialState = {
  data: [],
  pagination: null,
  status: "idle",
  error: null,
  deleteStatus: "idle",
  deleteError: null,
};

const userListSlice = createSlice({
  name: "userList",
  initialState,
  reducers: {
    resetUserListState: () => initialState,
    resetDeleteState: (state) => {
      state.deleteStatus = "idle";
      state.deleteError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserList.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchUserList.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.data = action.payload.data || [];
        state.pagination = action.payload.pagination || null;
        state.error = null;
      })
      .addCase(fetchUserList.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Không thể lấy danh sách người dùng.";
      })
      .addCase(deleteUserById.pending, (state) => {
        state.deleteStatus = "loading";
        state.deleteError = null;
      })
      .addCase(deleteUserById.fulfilled, (state, action) => {
        state.deleteStatus = "succeeded";
        state.deleteError = null;
        // Remove the deleted user from the list
        state.data = state.data.filter((user) => user.id !== action.payload.userId);
        // Update pagination count if available
        if (state.pagination && state.pagination.totalItems > 0) {
          state.pagination.totalItems -= 1;
        }
      })
      .addCase(deleteUserById.rejected, (state, action) => {
        state.deleteStatus = "failed";
        state.deleteError = action.payload || "Không thể xóa người dùng.";
      });
  },
});

export const { resetUserListState, resetDeleteState } = userListSlice.actions;

export default userListSlice.reducer;
