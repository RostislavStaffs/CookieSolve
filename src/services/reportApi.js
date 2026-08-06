const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5001/api";

function getFilenameFromHeaders(
  response,
  fallbackFilename,
) {
  const contentDisposition =
    response.headers.get(
      "content-disposition",
    );

  if (!contentDisposition) {
    return fallbackFilename;
  }

  const utf8Match =
    contentDisposition.match(
      /filename\*=UTF-8''([^;]+)/i,
    );

  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(
        utf8Match[1],
      );
    } catch {
      return utf8Match[1];
    }
  }

  const basicMatch =
    contentDisposition.match(
      /filename="?([^";]+)"?/i,
    );

  return (
    basicMatch?.[1] ||
    fallbackFilename
  );
}

async function getErrorMessage(
  response,
) {
  const contentType =
    response.headers.get(
      "content-type",
    ) ?? "";

  if (
    contentType.includes(
      "application/json",
    )
  ) {
    const data =
      await response
        .json()
        .catch(() => null);

    return (
      data?.message ||
      "The request could not be completed."
    );
  }

  const text =
    await response
      .text()
      .catch(() => "");

  return (
    text ||
    "The request could not be completed."
  );
}

async function getReportBlob(
  endpoint,
) {
  const response =
    await fetch(
      endpoint,
      {
        method: "GET",
        credentials: "include",
      },
    );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
      ),
    );
  }

  return {
    blob:
      await response.blob(),

    filename:
      getFilenameFromHeaders(
        response,
        "cookiesolve-report",
      ),

    contentType:
      response.headers.get(
        "content-type",
      ) ?? "",
  };
}

function triggerBlobDownload({
  blob,
  filename,
}) {
  const objectUrl =
    window.URL.createObjectURL(
      blob,
    );

  const downloadLink =
    document.createElement("a");

  downloadLink.href =
    objectUrl;

  downloadLink.download =
    filename;

  downloadLink.style.display =
    "none";

  document.body.appendChild(
    downloadLink,
  );

  downloadLink.click();
  downloadLink.remove();

  window.setTimeout(() => {
    window.URL.revokeObjectURL(
      objectUrl,
    );
  }, 1000);
}

/*
 * Creates a new export record and downloads
 * the generated report.
 */
export async function downloadScanReport({
  scanId,
  format,
}) {
  if (!scanId) {
    throw new Error(
      "A scan ID is required.",
    );
  }

  if (
    ![
      "html",
      "json",
    ].includes(format)
  ) {
    throw new Error(
      "Select HTML or JSON.",
    );
  }

  const report =
    await getReportBlob(
      `${API_URL}/scans/${encodeURIComponent(
        scanId,
      )}/report?format=${encodeURIComponent(
        format,
      )}`,
    );

  triggerBlobDownload({
    blob:
      report.blob,

    filename:
      report.filename ||
      `cookiesolve-report.${format}`,
  });

  return {
    filename:
      report.filename,

    format,
  };
}

export async function getExportedReports() {
  const response =
    await fetch(
      `${API_URL}/scans/exports`,
      {
        method: "GET",
        credentials: "include",
      },
    );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
      ),
    );
  }

  return response.json();
}

/*
 * Opens an existing export in a new browser tab.
 *
 * The server regenerates it from the associated
 * scan without creating a duplicate export record.
 */
export async function openExportedReport({
  reportId,
}) {
  if (!reportId) {
    throw new Error(
      "A report ID is required.",
    );
  }

  const report =
    await getReportBlob(
      `${API_URL}/scans/exports/${encodeURIComponent(
        reportId,
      )}`,
    );

  const objectUrl =
    window.URL.createObjectURL(
      report.blob,
    );

  const openLink =
    document.createElement("a");

  openLink.href =
    objectUrl;

  openLink.target =
    "_blank";

  openLink.rel =
    "noopener noreferrer";

  openLink.style.display =
    "none";

  document.body.appendChild(
    openLink,
  );

  openLink.click();
  openLink.remove();

  /*
   * Keep the Blob URL available long enough for
   * the new browser tab to finish loading it.
   */
  window.setTimeout(() => {
    window.URL.revokeObjectURL(
      objectUrl,
    );
  }, 60000);

  return {
    filename:
      report.filename,
  };
}