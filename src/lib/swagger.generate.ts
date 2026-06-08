import swaggerAutogen from "swagger-autogen";

const doc = {
  info: {
    title: "Nupat Cloud API",
    description: "Nupat Cloud API documentation",
  },
  host: "localhost:5000",
  securityDefinitions: {
    bearerAuth: {
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
    },
  },
};

const outputFile = "./swagger-output.json";
const routes = [
  "./src/modules/auth/auth.route.ts",
  "./src/modules/users/user.route.ts",
  "./src/modules/plans/plans.route.ts",
  "./src/modules/hosting/hosting.route.ts",
  "./src/modules/domains/domains.route.ts",
];

swaggerAutogen()(outputFile, routes, doc);