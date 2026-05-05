import axios from "axios";

let isRefreshing = false;
let pendingQueue: Array<{ resolve: () => void; reject: (err: unknown) => void }> = [];

function drainQueue(error?: unknown) {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve();
  });
  pendingQueue = [];
}

export async function withTokenRefresh<T>(retry: () => Promise<T>): Promise<T> {
  if (isRefreshing) {
    return new Promise<void>((resolve, reject) => {
      pendingQueue.push({ resolve, reject });
    }).then(() => retry());
  }

  isRefreshing = true;

  try {
    await axios.post("/api/v1/auth/refresh", null, { withCredentials: true });
    drainQueue();
    return retry();
  } catch (err) {
    drainQueue(err);
    throw err;
  } finally {
    isRefreshing = false;
  }
}
