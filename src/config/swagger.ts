import swaggerJSDoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Fast Travel API",
      version: "1.0.0",
      description: "API documentation for Fast Travel server",
    },
    servers: [
      {
        url: process.env.DEV_URL || "http://localhost:5000",
        description: "Development server",
      },
      {
        url: process.env.PROD_URL || "https://your-production-url.example.com",
        description: "Production server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./src/routes/**/*.ts", "./src/index.ts"], // point to your route files
};

export const swaggerSpec = swaggerJSDoc(options);
