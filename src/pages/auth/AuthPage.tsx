import { useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import AuthLayout from "@/components/auth/AuthLayout";
import LoginForm from "@/components/auth/LoginForm";
import RegisterForm from "@/components/auth/RegisterForm";

const formVariants = {
  initial: { opacity: 0, x: 32, filter: "blur(4px)" },
  animate: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  exit: {
    opacity: 0,
    x: -32,
    filter: "blur(4px)",
    transition: { duration: 0.25, ease: [0.55, 0, 1, 0.45] },
  },
};

export default function AuthPage() {
  const { pathname } = useLocation();
  const isLogin = pathname === "/login";

  return (
    <AuthLayout>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={isLogin ? "login" : "register"}
          variants={formVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          style={{ willChange: "transform, opacity, filter" }}
        >
          {isLogin ? <LoginForm /> : <RegisterForm />}
        </motion.div>
      </AnimatePresence>
    </AuthLayout>
  );
}
