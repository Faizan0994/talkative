import { useCallback, useEffect, useRef, useState } from "react";
import {
  get as apiGet,
  post as apiPost,
  put as apiPut,
  patch as apiPatch,
  del as apiDel,
} from "../services/api";

function useApi() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const request = useCallback(async (fn) => {
    await Promise.resolve();
    setLoading(true);
    setError(null);
    try {
      const result = await fn();
      if (isMounted.current) setData(result);
      return result;
    } catch (err) {
      if (isMounted.current) setError(err);
      throw err;
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, []);

  const get = useCallback((path) => request(() => apiGet(path)), [request]);
  const post = useCallback(
    (path, body) => request(() => apiPost(path, body)),
    [request],
  );
  const put = useCallback(
    (path, body) => request(() => apiPut(path, body)),
    [request],
  );
  const patch = useCallback(
    (path, body) => request(() => apiPatch(path, body)),
    [request],
  );
  const del = useCallback((path) => request(() => apiDel(path)), [request]);

  const clearError = useCallback(() => setError(null), []);

  return { data, loading, error, get, post, put, patch, del, clearError };
}

export default useApi;
