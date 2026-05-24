import dotenv from "dotenv";

// swagger-ui-express has no bundled TypeScript types in this project.
// Use a require with an any-typed binding to avoid the implicit any error.
const swaggerUi: any = require("swagger-ui-express");
import { swaggerSpec } from "./docs/swagger";
dotenv.config();

import app from "./app";

const PORT = process.env.PORT || "5000";

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
