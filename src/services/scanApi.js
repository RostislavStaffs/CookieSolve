const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5001/api";

async function sendScanRequest(
  endpoint,
  options = {},
) {
  const headers = {
    ...options.headers,
  };

  if (options.body) {
    headers["Content-Type"] =
      "application/json";
  }

  const response =
    await fetch(
      `${API_URL}/scans${endpoint}`,
      {
        ...options,
        headers,
        credentials: "include",
      },
    );

  const data =
    await response
      .json()
      .catch(() => ({
        message:
          "The server returned an invalid response.",
      }));

  if (!response.ok) {
    throw new Error(
      data.message ||
        "The scan request failed.",
    );
  }

  return data;
}

export function startScan(
  scanConfiguration,
) {
  return sendScanRequest(
    "",
    {
      method: "POST",

      body: JSON.stringify(
        scanConfiguration,
      ),
    },
  );
}

export function getScan(
  scanId,
) {
  return sendScanRequest(
    `/${scanId}`,
    {
      method: "GET",
    },
  );
}

export function getScans() {
  return sendScanRequest(
    "",
    {
      method: "GET",
    },
  );
}

export function deleteScan(
  scanId,
) {
  return sendScanRequest(
    `/${scanId}`,
    {
      method: "DELETE",
    },
  );
}