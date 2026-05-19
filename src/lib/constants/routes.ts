export const ROUTES = {
  HOME: "/",
  AUTH: {
    SIGN_IN: "/sign-in",
    SIGNIN: "/sign-in",
    SIGN_UP: "/sign-up",
    SIGNUP: "/sign-up",
    VERIFY_EMAIL: "/verify-email",
    FORGOT_PASSWORD: "/forgot-password",
    RESET_PASSWORD: "/reset-password",
    TWO_FACTOR: "/sign-in/2fa",
  },
  APP: {
    ROOT: "/app",
    HOME: "/app",
    ACCOUNT: "/app/account",
    SETTINGS: "/app/settings",
  },
} as const;
