import express from "express";
import {
  getCurrentUser,
  login,
  logout,
  register,
} from "../controllers/authController.js";
import requireAuth from "../middleware/requireAuth.js";

const authRouter = express.Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/logout", logout);
authRouter.get("/me", requireAuth, getCurrentUser);

export default authRouter;