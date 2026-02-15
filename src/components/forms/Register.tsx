import { useState } from "react";
import { signIn } from "next-auth/react";
import Input from "../common/Input";
import Button from "../common/Button";
import axios from "axios";
import { motion } from "framer-motion";
import { useColorMode } from "@/context/ColorModeContext";

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
  const [error, setError] = useState("");

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

    if (data.password.length < 8) {
      setError("Password must be at least 8 characters");
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
        callbackUrl: "/",
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
      className={`p-8 md:p-12 mt-8 border rounded-xl shadow-2xl backdrop-blur-sm w-full max-w-md ${
        actualColorMode === "light"
          ? "bg-white/95 border-gray-200 text-gray-900"
          : "bg-gray-800/95 border-gray-700 text-white"
      }`}
      onSubmit={handleSubmit}
    >
      <header className="text-center mb-8">
        <h1 className="text-2xl capitalize font-bold mb-2">
          Create an account
        </h1>
        <h2
          className={`text-sm ${
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

      <div className="space-y-4">
        <Input
          type="text"
          name="firstName"
          label="First Name"
          onChange={handleChanges}
          value={data.firstName}
          required
        />
        <Input
          type="text"
          name="lastName"
          label="Last Name"
          onChange={handleChanges}
          value={data.lastName}
          required
        />
        <Input
          type="email"
          name="email"
          label="Email"
          onChange={handleChanges}
          value={data.email}
          required
        />
        <Input
          type="password"
          name="password"
          label="Password"
          onChange={handleChanges}
          value={data.password}
          required
          placeholder="At least 8 characters"
        />
      </div>

      <div className="mt-6">
        <Button
          text={isLoading ? "Creating Account..." : "Sign Up"}
          width="w-full"
          type="submit"
          disabled={isLoading}
          variant="primary"
        />
      </div>

      <footer className="w-full flex justify-center mt-6">
        <button
          type="button"
          className={`text-sm font-medium transition-colors ${
            actualColorMode === "light"
              ? "text-blue-600 hover:text-blue-700"
              : "text-blue-400 hover:text-blue-300"
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
