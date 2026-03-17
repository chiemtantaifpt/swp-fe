export interface BaseResponse<TData> {
  data: TData;
  message: string | null;
  statusCode: number;
  code: string;
}

export class ApiResponseError extends Error {
  statusCode?: number;
  code?: string;

  constructor(message: string, options?: { statusCode?: number; code?: string }) {
    super(message);
    this.name = "ApiResponseError";
    this.statusCode = options?.statusCode;
    this.code = options?.code;
  }
}

export const unwrapBaseResponse = <TData>(response: BaseResponse<TData>): TData => {
  if (!response || typeof response !== "object") {
    throw new ApiResponseError("Invalid API response");
  }

  if (!("data" in response)) {
    throw new ApiResponseError("API response does not contain data", {
      statusCode: response.statusCode,
      code: response.code,
    });
  }

  return response.data;
};

