/**
 * API client for SludgeSim backend.
 */
import axios, { AxiosError } from "axios";
import type {
  PlantConfiguration,
  SimulationResult,
  Project,
  JarTest,
  PaginatedResponse,
  CreateProjectRequest,
  UpdateProjectRequest,
  CreateJarTestRequest,
} from "../types";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api";

// Create axios instance with base config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor for logging in development
api.interceptors.request.use(
  (config) => {
    if (import.meta.env.DEV) {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, config.data);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and logging
api.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log(`[API] Response:`, response.data);
    }
    return response;
  },
  (error: AxiosError) => {
    if (import.meta.env.DEV) {
      console.error(`[API] Error:`, error.response?.data || error.message);
    }
    return Promise.reject(error);
  }
);

// Helper to extract error message from API responses
function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ detail?: string }>;
    if (axiosError.response?.data?.detail) {
      return axiosError.response.data.detail;
    }
    if (axiosError.message) {
      return axiosError.message;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred";
}

// ============================================
// Simulation API
// ============================================

export async function simulate(
  plantDefinition: PlantConfiguration,
  jarTestId?: string,
  jarTestOptimumPpm?: number
): Promise<SimulationResult> {
  try {
    const response = await api.post<SimulationResult>("/simulate", {
      plant_definition: plantDefinition,
      jar_test_id: jarTestId,
      jar_test_optimum_ppm: jarTestOptimumPpm,
    });
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function validateConfiguration(
  plantDefinition: PlantConfiguration
): Promise<{ valid: boolean; errors: string[] }> {
  try {
    const response = await api.post<{ valid: boolean; errors: string[] }>(
      "/simulate/validate",
      { plant_definition: plantDefinition }
    );
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

// ============================================
// Projects API
// ============================================

export async function getProjects(
  skip?: number,
  limit?: number
): Promise<PaginatedResponse<Project>> {
  try {
    const params = new URLSearchParams();
    if (skip !== undefined) params.append("skip", skip.toString());
    if (limit !== undefined) params.append("limit", limit.toString());

    const response = await api.get<PaginatedResponse<Project>>(
      `/projects${params.toString() ? `?${params.toString()}` : ""}`
    );
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function getProject(id: string): Promise<Project> {
  try {
    const response = await api.get<Project>(`/projects/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function createProject(
  data: CreateProjectRequest
): Promise<Project> {
  try {
    const response = await api.post<Project>("/projects", data);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function updateProject(
  id: string,
  data: UpdateProjectRequest
): Promise<Project> {
  try {
    const response = await api.put<Project>(`/projects/${id}`, data);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function deleteProject(id: string): Promise<void> {
  try {
    await api.delete(`/projects/${id}`);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

// ============================================
// Jar Tests API
// ============================================

export async function getJarTests(
  skip?: number,
  limit?: number
): Promise<PaginatedResponse<JarTest>> {
  try {
    const params = new URLSearchParams();
    if (skip !== undefined) params.append("skip", skip.toString());
    if (limit !== undefined) params.append("limit", limit.toString());

    const response = await api.get<PaginatedResponse<JarTest>>(
      `/jar-tests${params.toString() ? `?${params.toString()}` : ""}`
    );
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function getJarTest(id: string): Promise<JarTest> {
  try {
    const response = await api.get<JarTest>(`/jar-tests/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function createJarTest(
  data: CreateJarTestRequest
): Promise<JarTest> {
  try {
    const response = await api.post<JarTest>("/jar-tests", data);
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

// ============================================
// Configuration API
// ============================================

export async function getDefaultConfig(): Promise<PlantConfiguration> {
  try {
    const response = await api.get<PlantConfiguration>("/default-config");
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

// ============================================
// Health Check API
// ============================================

export async function checkHealth(): Promise<{ status: string }> {
  try {
    // Health endpoint is at root, not under /api
    const response = await axios.get<{ status: string }>(
      API_BASE_URL.replace("/api", "") + "/health"
    );
    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

// Export the api instance for custom requests
export { api };
