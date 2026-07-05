import { useState } from "react";
import { signIn } from "next-auth/react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import axios from "axios";
import { motion } from "framer-motion";
import { FaGoogle } from "react-icons/fa";
import { useColorMode } from "@/context/ColorModeContext";
import { isStrongPassword, PASSWORD_REQUIREMENTS_MESSAGE } from "@/lib/validation";

interface RegisterProps {
  changeVariant: (variant: "login" | "register") => void;
  colorMode: string;
}

const Register: React.FC<RegisterProps> = ({ changeVariant, colorMode }) => {
  const { colorMode: chakraColorMode } = useColorMode();
  const actualColorMode = colorMode || chakraColorMode;
  const [data, setData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleSignIn = async () => {
    setError("");
    setIsGoogleLoading(true);
    try {
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch (error) {
      setError("An error occurred. Please try again.");
      console.error("Google sign-in error:", error);
      setIsGoogleLoading(false);
    }
  };

  const handleChanges = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
    setError(""); // Clear error on input change
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!data.firstName || !data.lastName || !data.email || !data.password) {
      setError("All fields are required");
      return;
    }

    if (!isStrongPassword(data.password)) {
      setError(PASSWORD_REQUIREMENTS_MESSAGE);
      return;
    }

    setIsLoading(true);
    try {
      await axios.post("/api/register", {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        password: data.password,
      });
      
      // Auto-login after registration
      await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: true,
        callbackUrl: "/dashboard",
      });
    } catch (error: any) {
      setError(
        error.response?.data?.error || "Registration failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`p-4 sm:p-6 md:p-12 mt-4 sm:mt-6 md:mt-8 border rounded-xl shadow-2xl backdrop-blur-sm w-full max-w-md mx-auto ${
        actualColorMode === "light"
          ? "bg-white/95 border-gray-200 text-gray-900"
          : "bg-zinc-900/95 border-zinc-700 text-white"
      }`}
      onSubmit={handleSubmit}
    >
      <header className="text-center mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl capitalize font-bold mb-2">
          Create an account
        </h1>
        <h2
          className={`text-xs sm:text-sm ${
            actualColorMode === "light" ? "text-gray-600" : "text-gray-400"
          }`}
        >
          Start journaling your trades today
        </h2>
      </header>

      {error && (
        <div
          className={`mb-4 p-3 rounded-lg text-sm font-medium ${
            actualColorMode === "light"
              ? "bg-red-50 text-red-700 border border-red-200"
              : "bg-red-900/30 text-red-400 border border-red-800"
          }`}
        >
          {error}
        </div>
      )}

      <div className="mb-6">
        <Button
          className="w-full"
          type="button"
          disabled={isGoogleLoading || isLoading}
          variant="secondary"
          leftIcon={<FaGoogle />}
          onClick={handleGoogleSignIn}
        >
          {isGoogleLoading ? "Redirecting..." : "Continue with Google"}
        </Button>
        <div className="flex items-center gap-3 mt-6">
          <div
            className={`flex-1 h-px ${
              actualColorMode === "light" ? "bg-zinc-200" : "bg-zinc-700"
            }`}
          />
          <span
            className={`text-xs uppercase ${
              actualColorMode === "light" ? "text-gray-400" : "text-gray-500"
            }`}
          >
            or
          </span>
          <div
            className={`flex-1 h-px ${
              actualColorMode === "light" ? "bg-zinc-200" : "bg-zinc-700"
            }`}
          />
        </div>
      </div>

      <div className="space-y-4">
        <Input
          type="text"
          name="firstName"
          label={<>First Name<span className="text-red-500 ml-1">*</span></>}
          onChange={handleChanges}
          value={data.firstName}
          required
        />
        <Input
          type="text"
          name="lastName"
          label={<>Last Name<span className="text-red-500 ml-1">*</span></>}
          onChange={handleChanges}
          value={data.lastName}
          required
        />
        <Input
          type="email"
          name="email"
          label={<>Email<span className="text-red-500 ml-1">*</span></>}
          onChange={handleChanges}
          value={data.email}
          required
        />
        <Input
          type="password"
          name="password"
          label={<>Password<span className="text-red-500 ml-1">*</span></>}
          onChange={handleChanges}
          value={data.password}
          required
          placeholder="At least 10 characters, with a letter and a number"
        />
      </div>

      <div className="mt-6">
        <Button
          className="w-full"
          type="submit"
          disabled={isLoading}
          variant="primary"
        >
          {isLoading ? "Creating Account..." : "Sign Up"}
        </Button>
      </div>

      <footer className="w-full flex justify-center mt-6">
        <button
          type="button"
          className={`text-sm font-medium transition-colors min-h-[44px] flex items-center justify-center px-4 py-2 rounded-lg -m-2 ${
            actualColorMode === "light"
              ? "text-zinc-600 hover:text-zinc-700 active:text-zinc-800"
              : "text-zinc-400 hover:text-zinc-300 active:text-zinc-200"
          }`}
          onClick={() => changeVariant("login")}
        >
          I already have an account
        </button>
      </footer>
    </motion.form>
  );
};

export default Register;
