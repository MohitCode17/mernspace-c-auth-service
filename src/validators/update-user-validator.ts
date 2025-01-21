import { checkSchema } from "express-validator";
import { UpdateUserRequest } from "../types";

export default checkSchema({
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
  role: {
    errorMessage: "Role is required!",
    notEmpty: true,
    trim: true,
  },
  email: {
    isEmail: {
      errorMessage: "Invalid email!",
    },
    notEmpty: true,
    errorMessage: "Email is required!",
    trim: true,
  },
  tenantId: {
    errorMessage: "Tenant id is required!",
    trim: true,
    custom: {
      // Value is tenantId
      // eslint-disable-next-line @typescript-eslint/require-await
      options: async (value: string, { req }) => {
        const role = (req as UpdateUserRequest).body.role;
        if (role === "admin") {
          return true;
        } else {
          return !!value;
        }
      },
    },
  },
});
