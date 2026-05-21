// eslint-disable-next-line @typescript-eslint/no-var-requires
const swaggerJSDoc: any = require("swagger-jsdoc");

export const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Nupat Cloud",
      version: "1.0.0",
      description: "Backend API documentation",
    },
    servers: [
      {
        url: "http://localhost:5000",
      },
    ],
  },
  apis: ["./src/modules/*.ts"], // where your routes live
});
