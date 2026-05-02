import * as yup from "yup";
import { parsePhoneNumberFromString } from "libphonenumber-js";

const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*\-_.,?]).{8,}$/;

const emailField = yup
  .string()
  .email("Please enter a valid email")
  .matches(
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    "Email must be a valid format (e.g., name@example.com)"
  )
  .required("Required");

const passwordField = yup
  .string()
  .matches(
    passwordRegex,
    "Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character"
  )
  .required("Required");

const nameField = yup
  .string()
  .test("not-empty", "Name must not be empty", (value) => !!value?.trim())
  .matches(/^[a-zA-Z\s]+$/, "Name must only contain letters")
  .required("Required");

const phoneField = yup
  .string()
  .required("Required")
  .test("phone", "Enter a valid phone number", function (value) {
    const { country } = this.parent;
    const countryCode =
      country === "Nigeria" ? "NG" : country === "USA" ? "US" : null;
    if (!value) return false;
    const phone = parsePhoneNumberFromString(value, countryCode);
    return phone ? phone.isValid() : false;
  });


export const signUpSchema = yup.object().shape({
  name: nameField,
  email: emailField,
  phone: phoneField,
  country: yup.string().required("Please select a country"),
  state: yup.string().required("Please select a state"),
  password: passwordField,
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password"), null], "Passwords must match")
    .required("Please confirm your password"),
});

export const signInSchema = yup.object().shape({
  email: emailField,
  password: yup.string().required("Required"),
});

export const resetPasswordSchema = yup.object().shape({
  email: emailField,
});

export const uploadSchema = yup.object().shape({
  title: yup
    .string()
    .test("not-empty", "Title must not be empty", (value) => !!value?.trim())
    .required("Required"),
  instructions: yup
    .string()
    .test(
      "not-empty",
      "Instructions must not be empty",
      (value) => !!value?.trim()
    )
    .required("Required"),
  photo: yup
    .mixed()
    .required("Required")
    .test(
      "fileSize",
      "File must be under 2MB",
      (value) => !!value && value.size <= 2000000
    )
    .test(
      "fileType",
      "Only JPEG, PNG, and WebP are supported",
      (value) =>
        !!value &&
        ["image/jpeg", "image/png", "image/jpg", "image/webp"].includes(
          value.type
        )
    ),
});
export const profileSchema = yup.object().shape({
  name: nameField,
  email: emailField,
  phone: phoneField,
  country: yup.string().required("Please select a country"),
  state: yup.string().required("Please select a state"),
});