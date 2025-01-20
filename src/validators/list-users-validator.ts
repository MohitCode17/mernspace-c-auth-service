import { checkSchema } from "express-validator";

export default checkSchema(
  {
    q: {
      trim: true,
      customSanitizer: {
        options: (value: unknown) => {
          return value ? value : "";
        },
      },
    },
    role: {
      customSanitizer: {
        options: (value: unknown) => {
          return value ? value : "";
        },
      },
    },
    currentPage: {
      customSanitizer: {
        options: (value) => {
          // Value: "2", undefined, "fldjfd" -> NaN
          const parsedValue = Number(value);
          return Number.isNaN(parsedValue) ? 1 : parsedValue;
        },
      },
    },
    perPage: {
      customSanitizer: {
        options: (value) => {
          // Value: "2", undefined, "fldjfd" -> NaN
          const parsedValue = Number(value);
          return Number.isNaN(parsedValue) ? 6 : parsedValue;
        },
      },
    },
  },
  ["query"],
);
