import { checkSchema } from "express-validator";

export default checkSchema({
  email: {
    errorMessage: "Email is required!",
    notEmpty: true,
    trim: true,
    isEmail: {
      errorMessage: "Email should be a valid email!",
    },
  },
  firstName: {
    errorMessage: "FirstName is required!",
    notEmpty: true,
    trim: true,
  },
  lastName: {
    errorMessage: "LastName is required!",
    notEmpty: true,
    trim: true,
  },
  password: {
    errorMessage: "Password is required",
    notEmpty: true,
    trim: true,
  },
});

// export default [body("email").notEmpty().withMessage("Email is required!")];
