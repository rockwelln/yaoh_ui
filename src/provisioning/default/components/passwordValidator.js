export const passwordValidator = (password, rules) => {
  const errors = [
    {
      error: rules.minLength ? password.length < rules.minLength : true,
      message: `Password length should be ${rules.minLength} or more`,
    },
    {
      error: Array.isArray(password.match(/\d/g))
        ? password.match(/\d/g).length < rules.minDigits
        : true,
      message: `Password should contain ${rules.minDigits} digits`,
    },
    {
      error: Array.isArray(password.match(/[A-Z]/g))
        ? password.match(/[A-Z]/g).length < rules.minUpperCaseLetters
        : true,
      message: `Password should contain ${rules.minUpperCaseLetters} upper case letters`,
    },
    {
      error: Array.isArray(password.match(/[a-z]/g))
        ? password.match(/[a-z]/g).length < rules.minLowerCaseLetters
        : true,
      message: `Password should contain ${rules.minLowerCaseLetters} lower case letters`,
    },
    {
      error: Array.isArray(password.match(/\W/g))
        ? password.match(/\W/g).length < rules.minNonAlphanumericCharacters
        : true,
      message: `Password should contain ${rules.minNonAlphanumericCharacters} non alphanumeric characters`,
    },
  ];

  const e = errors.find((err) => err.error);
  return e ? e.message : "";
};
