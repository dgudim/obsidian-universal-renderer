module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  rules: {
    "@typescript-eslint/no-unused-vars": [
      "warn",
      {args: "all", argsIgnorePattern: "^_"},
    ],

    "@typescript-eslint/no-this-alias": [
      "warn",
      {
        "allowedNames": ["self"],
        "allowDestructuring": true
      },
    ],
    "quotes": [
      "warn",
      "single"
    ],
    "semi": [
      "error",
      "always"
    ]
  },
  overrides: [
    {
      "files": ["*.json"],
      "rules": {
        "quotes": ["warn", "double"],
        "indent": ["error", 2],
        "semi": ["error", "never"]
      }
    }
  ]
};
