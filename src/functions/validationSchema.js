import * as yup from 'yup';
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$/;

export const signUpSchema = yup.object().shape({
  name: yup
    .string()
    .test("stringLength", "name must not be empty", (value) => {
      return value && value.trim().length > 0;
    })
    .matches(/^[a-zA-Z\s]+$/, "Name must only contain letters")
    .required("Required"),
  email: yup
    .string()
    .email("Please enter a valid email")
    .matches(
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      "Email must be a valid format (e.g., name@example.com)"
    )
    .required("Required"),
  password: yup
    .string()
    .min(8)
    .matches(passwordRegex, { message: "Please create a stronger password" })
    .required("Required"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password"), null], "Passwords must match")
    .required("Required"),
});

export const signInSchema = yup.object().shape({
    email: yup.string().email("Please enter a valid email").matches(
         /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        'Email must be a valid format (e.g., name@example.com)'
      ).required("Required"),
    password: yup.string().required("Required")
})

export const resetPasswordSchema = yup.object().shape({
    email: yup.string().email("Invalid email").matches(
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        'Email must be a valid format (e.g., name@example.com)'
      ) .required("Required")
})

export const uploadSchema = yup.object().shape({
    title: yup.string().test('stringLength', 'title must not be empty', 
        (value) => {
            return value && value.trim().length > 0;
        }).required("Required"),
    instructions: yup.string().test('stringLength', 'instructions must not be empty', 
        (value) => {
            return value && value.trim().length > 0;
        }).required("Required"),
    photo: yup.mixed().required("Required").test("fileSize", "File too large", 
        (value) => {
        return value && value.size <= 2000000;
    }).test("fileType", "Unsupported File Format", 
        (value) => {
        return value && ["image/jpeg", "image/png", "image/jpg", "image/webp"].includes(value.type);
    })
})