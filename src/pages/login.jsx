import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChefHat, Mail, Lock, ArrowRight, ShieldCheck, Coffee } from "lucide-react";
import Typed from "typed.js";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";

const Login = () => {
  // states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [verificationCode, setVerificationCode] = useState("");
  const [otpId, setOtpId] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [countdown, setCountdown] = useState(0);

  const el = useRef(null);
  const navigate = useNavigate();

  const patterns = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    password: /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&.])[A-Za-z\d@$!%*#?&.]{8,}$/,
  };

  const validationMessages = {
    email: {
      required: "Email is required",
      pattern: "Please enter a valid email address",
    },
    password: {
      required: "Password is required",
      pattern:
        "Password must be at least 8 characters and include letters, numbers, and special characters",
    },
  };

  useEffect(() => {
    const typed = new Typed(el.current, {
      strings: [
        "Welcome to Admin HQ!",
        "Manage Your Dining ",
        "Control Your Trade!",
      ],
      typeSpeed: 50,
      backSpeed: 50,
      loop: true,
    });

    return () => typed.destroy();
  }, []);

  const validateField = (name, value) => {
    if (!value) {
      return validationMessages[name]?.required;
    }
    if (patterns[name] && !patterns[name].test(value)) {
      return validationMessages[name]?.pattern;
    }
    return "";
  };

  const handleInputChange = (e, setter) => {
    const { name, value } = e.target;
    setter(value);
    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name, value),
    }));
  };

  // LOGIN
  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    // Basic validation - simplified for better UX
    if (!email || !password) {
      setErrors({ form: "Please enter both email and password" });
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_REACT_APP_API_BASE_URL}/api/auth/admin/login`,
        { email, password }
      );

      if (response.data.success) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("admin", JSON.stringify(response.data.admin));
        navigate("/");
      }
    } catch (error) {
      setErrors({
        form: error.response?.data?.message || "Invalid credentials. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // GOOGLE VERIFICATION-BASED PASSWORD RESET
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email) {
      setErrors({ email: "Email is required" });
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_REACT_APP_API_BASE_URL}/api/auth/admin/forgot-password`,
        { email }
      );
      
      if (response.data.success) {
        // Show success message and prompt for Google verification
        setErrors({ 
          form: "Please verify your identity with Google to reset your password.",
          type: "success" 
        });
        setStep(2); // Move to Google verification step
      }
    } catch (error) {
      setErrors({
        form: error.response?.data?.message || "Admin not found with this email address.",
        type: "error"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google verification for password reset
  const handleGooglePasswordReset = async (credentialResponse) => {
    try {
      setIsLoading(true);
      // Here you would verify the Google credential matches the email
      // and then allow password reset
      const response = await axios.post(
        `${import.meta.env.VITE_REACT_APP_API_BASE_URL}/api/auth/admin/verify-google-reset`,
        { 
          credential: credentialResponse.credential,
          email: email 
        }
      );
      
      if (response.data.success) {
        setStep(3); // Move to new password step
        setErrors({ 
          form: "Identity verified! Please enter your new password.",
          type: "success" 
        });
      }
    } catch (error) {
      setErrors({
        form: "Google verification failed. Please try again.",
        type: "error"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle new password submission
  const handleNewPasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (!newPassword || !confirmPassword) {
      setErrors({ form: "Please fill in both password fields" });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setErrors({ form: "Passwords do not match" });
      return;
    }
    
    if (newPassword.length < 8) {
      setErrors({ form: "Password must be at least 8 characters long" });
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_REACT_APP_API_BASE_URL}/api/auth/admin/reset-password`,
        { 
          email,
          newPassword,
          confirmPassword 
        }
      );
      
      if (response.data.success) {
        setErrors({ 
          form: "Password reset successful! You can now login with your new password.",
          type: "success" 
        });
        setTimeout(() => {
          handleBackToLogin();
        }, 2000);
      }
    } catch (error) {
      setErrors({
        form: error.response?.data?.message || "Failed to reset password",
        type: "error"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // GOOGLE LOGIN
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_REACT_APP_API_BASE_URL}/api/auth/admin/google`,
        { credential: credentialResponse.credential }
      );

      if (response.data.success) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("admin", JSON.stringify(response.data.admin));
        navigate("/");
      }
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        form: error.response?.data?.message || "Google login failed",
      }));
    }
  };

  const handleGoogleError = () => {
    setErrors((prev) => ({
      ...prev,
      form: "Google login failed. Please try again.",
    }));
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setCountdown(30);
      setErrors({});
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        form: "Failed to resend verification code",
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setStep(1);
    setVerificationCode("");
    setNewPassword("");
    setConfirmPassword("");
    setErrors({});
    setIsForgotPassword(false);
  };

  const ErrorMessage = ({ error }) =>
    error ? <p className="text-red-500 text-sm mt-1 ml-1">{error}</p> : null;

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-gradient-to-br from-orange-50 via-white to-orange-100 animate-gradient">
      <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(249,115,22,0.05)_25%,rgba(249,115,22,0.05)_50%,transparent_50%,transparent_75%,rgba(249,115,22,0.05)_75%)] bg-[length:24px_24px] animate-pattern"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg relative"
      >
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-orange-500/10 overflow-hidden border border-orange-100">
          <div className="p-8 md:p-12">
            <div className="mb-8 text-center">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
                className="w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl mx-auto mb-6 flex items-center justify-center transform rotate-12 shadow-lg shadow-orange-500/30"
              >
                <ChefHat className="w-10 h-10 text-white transform -rotate-12" />
              </motion.div>
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <h2 className="text-4xl font-bold text-gray-800 mb-2">
                  <span
                    ref={el}
                    className="text-orange-600 bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent"
                  ></span>
                </h2>
                <p className="text-gray-600">
                  {isForgotPassword
                    ? "Reset your password"
                    : "Access your restaurant management dashboard"}
                </p>
              </motion.div>
            </div>

            {!isForgotPassword ? (
              <form onSubmit={handleCredentialsSubmit} className="space-y-6">
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                      placeholder="admin@quickbites.com"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                      placeholder="Enter your password"
                      required
                    />
                  </div>
                </div>

                {errors.form && (
                  <div className={`p-3 rounded-lg text-sm ${
                    errors.type === 'success' 
                      ? 'bg-green-50 text-green-700 border border-green-200' 
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {errors.form}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-xl hover:from-orange-600 hover:to-orange-700 font-semibold text-lg shadow-lg transition-all duration-300 disabled:opacity-70"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Signing in...
                    </div>
                  ) : (
                    "Sign In"
                  )}
                </button>

                {/* Google Login */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or continue with</span>
                  </div>
                </div>

                <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
                  <div className="flex justify-center">
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={handleGoogleError}
                      theme="outline"
                      size="large"
                      width="100%"
                      text="signin_with"
                    />
                  </div>
                </GoogleOAuthProvider>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setIsForgotPassword(true)}
                    className="text-orange-600 hover:text-orange-700 font-medium transition-colors"
                  >
                    Forgot your password?
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                {step === 1 && (
                  <form onSubmit={handleForgotPassword} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Admin Email Address
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                          placeholder="Enter your admin email"
                          required
                        />
                      </div>
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                      )}
                    </div>

                    {errors.form && (
                      <div className={`p-3 rounded-lg text-sm ${
                        errors.type === 'success' 
                          ? 'bg-green-50 text-green-700 border border-green-200' 
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {errors.form}
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={handleBackToLogin}
                        className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-all"
                      >
                        Back to Login
                      </button>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-xl hover:from-orange-600 hover:to-orange-700 font-semibold transition-all disabled:opacity-70"
                      >
                        {isLoading ? "Verifying..." : "Continue"}
                      </button>
                    </div>
                  </form>
                )}

                {step === 2 && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ShieldCheck className="w-8 h-8 text-orange-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        Verify Your Identity
                      </h3>
                      <p className="text-gray-600 mb-6">
                        Please verify your identity with Google to reset your password securely.
                      </p>
                    </div>

                    {errors.form && (
                      <div className={`p-3 rounded-lg text-sm ${
                        errors.type === 'success' 
                          ? 'bg-green-50 text-green-700 border border-green-200' 
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {errors.form}
                      </div>
                    )}

                    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
                      <div className="flex justify-center">
                        <GoogleLogin
                          onSuccess={handleGooglePasswordReset}
                          onError={() => setErrors({ form: "Google verification failed", type: "error" })}
                          theme="outline"
                          size="large"
                          text="continue_with"
                        />
                      </div>
                    </GoogleOAuthProvider>

                    <button
                      type="button"
                      onClick={handleBackToLogin}
                      className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-all"
                    >
                      Back to Login
                    </button>
                  </div>
                )}

                {step === 3 && (
                  <form onSubmit={handleNewPasswordSubmit} className="space-y-6">
                    <div className="text-center mb-6">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-8 h-8 text-green-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        Set New Password
                      </h3>
                      <p className="text-gray-600">
                        Create a strong password for your admin account.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        New Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                          placeholder="Enter new password"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                          placeholder="Confirm new password"
                          required
                        />
                      </div>
                    </div>

                    {errors.form && (
                      <div className={`p-3 rounded-lg text-sm ${
                        errors.type === 'success' 
                          ? 'bg-green-50 text-green-700 border border-green-200' 
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {errors.form}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-xl hover:from-orange-600 hover:to-orange-700 font-semibold text-lg transition-all disabled:opacity-70"
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Resetting Password...
                        </div>
                      ) : (
                        "Reset Password"
                      )}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="py-4 bg-gradient-to-r from-orange-50 to-orange-100/50 text-center px-8 border-t border-orange-100"
          >
            <p className="text-sm text-gray-600">
              Need technical support?{" "}
              <a
                href="#"
                className="text-orange-600 font-medium hover:text-orange-700"
              >
                Contact IT Department
              </a>
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
