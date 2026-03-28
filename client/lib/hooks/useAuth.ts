"use client";

import { authApi, LoginData, RegisterData, UpdateMeData } from "@/lib/api/auth";
import { useAppDispatch } from "@/lib/hooks/useRedux";
import { analytics } from "@/lib/analytics";
import { logout as logoutAction, setUser } from "@/lib/store/authSlice";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

// Get current user hook
export function useUser() {
  const dispatch = useAppDispatch();

  return useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      try {
        const response = await authApi.getMe();
        dispatch(setUser(response.user));
        return response.user;
      } catch (error) {
        dispatch(setUser(null));
        throw error;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Login hook
export function useLogin() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: (data: LoginData) => authApi.login(data),
    onSuccess: async () => {
      // Refresh user data after login
      const userData = await authApi.getMe();
      dispatch(setUser(userData.user));
      queryClient.setQueryData(["user"], userData.user);
      analytics.loginSuccess();

      // Check if onboarding is completed
      if (!userData.user.is_onboarding_completed) {
        router.push("/onboarding");
      } else {
        router.push("/dashboard");
      }
    },
  });
}

// Register hook
export function useRegister() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: (data: RegisterData) => authApi.register(data),
    onSuccess: async () => {
      // Refresh user data after register
      const userData = await authApi.getMe();
      dispatch(setUser(userData.user));
      queryClient.setQueryData(["user"], userData.user);
      analytics.signupCompleted();

      // New users always go to onboarding
      router.push("/onboarding");
    },
  });
}

// Logout hook
export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      dispatch(logoutAction());
      queryClient.clear();
      router.push("/");
    },
  });
}

// Update Me hook
export function useUpdateMe() {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: (data: UpdateMeData) => authApi.updateMe(data),
    onSuccess: (response) => {
      dispatch(setUser(response.user));
      queryClient.setQueryData(["user"], response.user);
    },
  });
}

// Forgot password hook
export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) => authApi.forgotPassword(email),
  });
}

// Reset password hook
export function useResetPassword() {
  const router = useRouter();

  return useMutation({
    mutationFn: ({ token, password }: { token: string; password: string }) =>
      authApi.resetPassword(token, password),
    onSuccess: () => {
      router.push("/login");
    },
  });
}

// Verify email hook
export function useVerifyEmail() {
  return useMutation({
    mutationFn: (token: string) => authApi.verifyEmail(token),
  });
}

// Resend verification hook
export function useResendVerification() {
  return useMutation({
    mutationFn: (email: string) => authApi.resendVerification(email),
  });
}

// Delete account hook
export function useDeleteAccount() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: (password: string) => authApi.deleteAccount(password),
    onSuccess: () => {
      dispatch(logoutAction());
      queryClient.clear();
      router.push("/");
    },
  });
}
