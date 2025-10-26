import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  login as loginService,
  logout as logoutService,
  register as registerService,
  refreshSession as refreshService,
} from "../../services/authService";

const STORAGE_KEY = "auth_state";

const loadPersistedState = () => {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    return serialized ? JSON.parse(serialized) : null;
  } catch (error) {
    console.warn("Failed to parse auth state from storage", error);
    return null;
  }
};

const persistState = (state) => {
  try {
    const serialized = JSON.stringify({
      user: state.user,
      accessToken: state.accessToken,
      refreshToken: state.refreshToken,
    });
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch (error) {
    console.warn("Failed to persist auth state", error);
  }
};

const clearPersistedState = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn("Failed to clear auth state", error);
  }
};

const persisted = typeof window !== "undefined" ? loadPersistedState() : null;

const initialState = {
  user: persisted?.user || null,
  accessToken: persisted?.accessToken || null,
  refreshToken: persisted?.refreshToken || null,
  status: "idle",
  error: null,
  successMessage: null,
};

export const registerUser = createAsyncThunk("auth/register", async (payload, { rejectWithValue }) => {
  try {
    const response = await registerService(payload);
    return response;
  } catch (error) {
    const message = error.response?.data?.message || "Đăng ký thất bại.";
    const details = error.response?.data?.error?.details || null;
    return rejectWithValue({ message, details });
  }
});

export const loginUser = createAsyncThunk("auth/login", async (payload, { rejectWithValue }) => {
  try {
    const response = await loginService(payload);
    return response;
  } catch (error) {
    const message = error.response?.data?.message || "Đăng nhập thất bại.";
    return rejectWithValue(message);
  }
});

export const logoutUser = createAsyncThunk("auth/logout", async (_, { getState, rejectWithValue }) => {
  try {
    const state = getState();
    const accessToken = state.auth?.accessToken;
    await logoutService(accessToken);
    return true;
  } catch (error) {
    const message = error.response?.data?.message || "Không thể đăng xuất.";
    return rejectWithValue(message);
  }
});

export const refreshAuthSession = createAsyncThunk("auth/refresh", async (_, { rejectWithValue }) => {
  try {
    const response = await refreshService();
    return response;
  } catch (error) {
    const message = error.response?.data?.message || "Phiên đăng nhập đã hết hạn.";
    return rejectWithValue(message);
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    resetStatus(state) {
      state.status = "idle";
      state.error = null;
      state.successMessage = null;
    },
    updateUserProfile(state, action) {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        persistState(state);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
        state.successMessage = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.successMessage = action.payload.message || "Đăng ký thành công.";
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.status = "failed";
        state.error =
          action.payload?.details?.[0]?.message || action.payload?.message || "Đăng ký thất bại.";
      })
      .addCase(loginUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
        state.successMessage = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload.data?.user || null;
        state.accessToken = action.payload.data?.accessToken || null;
        state.refreshToken = action.payload.data?.refreshToken || null;
        state.successMessage = action.payload.message || "Đăng nhập thành công.";
        persistState(state);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Đăng nhập thất bại.";
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.status = "idle";
        state.successMessage = "Đăng xuất thành công.";
        clearPersistedState();
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.error = action.payload || "Không thể đăng xuất.";
      })
      .addCase(refreshAuthSession.fulfilled, (state, action) => {
        state.accessToken = action.payload.data?.accessToken || null;
        state.refreshToken = action.payload.data?.refreshToken || null;
        state.error = null;
        persistState(state);
      })
      .addCase(refreshAuthSession.rejected, (state, action) => {
        state.error = action.payload || "Phiên đăng nhập đã hết hạn.";
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        clearPersistedState();
      });
  },
});

export const { resetStatus, updateUserProfile } = authSlice.actions;

export default authSlice.reducer;
