import { useCallback, useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';

/** Fetch an admin endpoint and refetch whenever the server pushes an update. */
export function useAdminData(path) {
  const { api, adminVersion } = useApp();
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const load = useCallback(() => {
    if (!path) return undefined;
    let live = true;
    api(path).then((data) => live && setState({ data, loading: false, error: null })).catch((error) => live && setState((s) => ({ ...s, loading: false, error: error.message })));
    return () => { live = false; };
  }, [api, path]);
  useEffect(() => { setState((s) => ({ ...s, loading: !s.data })); return load(); }, [load, adminVersion]);
  return state;
}
