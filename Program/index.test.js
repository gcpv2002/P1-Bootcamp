import request from "supertest";
import { app, compute } from "./index.js";

// Test suite for compute function
describe("Compute Function Tests", () => {
  test("should add two numbers", () => {
    expect(compute(10, 5, "+")).toBe(15);
  });

  test("should subtract two numbers", () => {
    expect(compute(10, 5, "-")).toBe(5);
  });

  test("should multiply two numbers", () => {
    expect(compute(10, 5, "*")).toBe(50);
  });

  test("should divide two numbers", () => {
    expect(compute(10, 5, "/")).toBe(2);
  });

  test("should handle division by zero", () => {
    expect(compute(10, 0, "/")).toBe("Error (divide by 0)");
  });

  test("should calculate modulo", () => {
    expect(compute(10, 3, "%")).toBe(1);
  });

  test("should calculate power", () => {
    expect(compute(2, 3, "^")).toBe(8);
  });

  test("should throw error for unsupported operator", () => {
    expect(() => compute(10, 5, "&")).toThrow("Unsupported operator");
  });
});

// Test suite for API endpoints
describe("Calculator API Tests", () => {
  describe("POST /api/calculate", () => {
    test("should add two numbers correctly", async () => {
      const response = await request(app)
        .post("/api/calculate")
        .send({ num1: 10, num2: 5, operator: "+" })
        .expect(200);

      expect(response.body.result).toBe("15");
      expect(response.body.expression).toBe("10 + 5");
      expect(response.body.operator).toBe("+");
    });

    test("should subtract two numbers correctly", async () => {
      const response = await request(app)
        .post("/api/calculate")
        .send({ num1: 10, num2: 5, operator: "-" })
        .expect(200);

      expect(response.body.result).toBe("5");
      expect(response.body.expression).toBe("10 - 5");
    });

    test("should multiply two numbers correctly", async () => {
      const response = await request(app)
        .post("/api/calculate")
        .send({ num1: 10, num2: 5, operator: "*" })
        .expect(200);

      expect(response.body.result).toBe("50");
      expect(response.body.expression).toBe("10 * 5");
    });

    test("should divide two numbers correctly", async () => {
      const response = await request(app)
        .post("/api/calculate")
        .send({ num1: 10, num2: 5, operator: "/" })
        .expect(200);

      expect(response.body.result).toBe("2");
      expect(response.body.expression).toBe("10 / 5");
    });

    test("should handle division by zero", async () => {
      const response = await request(app)
        .post("/api/calculate")
        .send({ num1: 10, num2: 0, operator: "/" })
        .expect(200);

      expect(response.body.result).toBe("Error (divide by 0)");
    });

    test("should calculate modulo correctly", async () => {
      const response = await request(app)
        .post("/api/calculate")
        .send({ num1: 10, num2: 3, operator: "%" })
        .expect(200);

      expect(response.body.result).toBe("1");
      expect(response.body.expression).toBe("10 % 3");
    });

    test("should calculate power correctly", async () => {
      const response = await request(app)
        .post("/api/calculate")
        .send({ num1: 2, num2: 3, operator: "^" })
        .expect(200);

      expect(response.body.result).toBe("8");
      expect(response.body.expression).toBe("2 ^ 3");
    });

    test("should handle decimal numbers", async () => {
      const response = await request(app)
        .post("/api/calculate")
        .send({ num1: 10.5, num2: 2.5, operator: "+" })
        .expect(200);

      expect(parseFloat(response.body.result)).toBeCloseTo(13);
    });

    test("should return 400 for invalid num1", async () => {
      const response = await request(app)
        .post("/api/calculate")
        .send({ num1: "invalid", num2: 5, operator: "+" })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    test("should return 400 for invalid num2", async () => {
      const response = await request(app)
        .post("/api/calculate")
        .send({ num1: 10, num2: "invalid", operator: "+" })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    test("should return 400 for missing operator", async () => {
      const response = await request(app)
        .post("/api/calculate")
        .send({ num1: 10, num2: 5 })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    test("should return 400 for unsupported operator", async () => {
      const response = await request(app)
        .post("/api/calculate")
        .send({ num1: 10, num2: 5, operator: "&" })
        .expect(400);

      expect(response.body.error).toBeDefined();
      expect(response.body.error).toContain("Unsupported operator");
    });

    test("should handle negative numbers", async () => {
      const response = await request(app)
        .post("/api/calculate")
        .send({ num1: -10, num2: 5, operator: "+" })
        .expect(200);

      expect(response.body.result).toBe("-5");
    });

    test("should handle zero as first number", async () => {
      const response = await request(app)
        .post("/api/calculate")
        .send({ num1: 0, num2: 5, operator: "*" })
        .expect(200);

      expect(response.body.result).toBe("0");
    });
  });
});

