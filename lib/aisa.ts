// Shared client for AIsa data APIs (https://api.aisa.one/apis/v1).

const BASE = () =>
  process.env.AISA_DATA_BASE_URL ?? "https://api.aisa.one/apis/v1";

export async function aisaFetch(path: string, init?: RequestInit): Promise<any> {
  const res = await fetch(`${BASE()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.AISA_API_KEY}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`AIsa request failed (${res.status}): ${body.slice(0, 500)}`);
  }
  return res.json();
}

// DataForSEO live endpoints take an array of task objects and return
// { tasks: [ { status_code, status_message, result } ] }. This posts a single
// task and returns it, throwing on task-level errors.
//
// Note: DataForSEO reports unsupported locations/fields as
// "Invalid Field: '...'" (status 40501), which is misleading — it often means
// the dataset does not cover that market.
export async function dataforseoLive(
  path: string,
  task: Record<string, unknown>,
): Promise<any> {
  const data = await aisaFetch(path, {
    method: "POST",
    body: JSON.stringify([task]),
  });
  const t = data?.tasks?.[0];
  if (t === undefined) {
    throw new Error(
      `Unexpected DataForSEO response: ${JSON.stringify(data).slice(0, 300)}`,
    );
  }
  if (t.status_code !== 20000) {
    throw new Error(`DataForSEO error ${t.status_code}: ${t.status_message}`);
  }
  return t;
}
