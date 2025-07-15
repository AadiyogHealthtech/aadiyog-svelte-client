type RequestOptions = Omit<RequestInit, 'headers'> & {
	headers?: Record<string, string>;
  };
  
  export const apiFetch = async <T = unknown>(
	endpoint: string,
	options: RequestOptions = {}
  ): Promise<T> => {
	const token = "localStorage.getItem('authToken')";
  
	const defaultHeaders: Record<string, string> = {
	  'Content-Type': 'application/json',
	  ...(token ? { Authorization: `Bearer ${token}` } : {})
	};
  
	const mergedHeaders: Record<string, string> = {
	//   ...defaultHeaders,
	  ...(options.headers || {})
	};
  
	const res = await fetch(`http://localhost:1337/${endpoint}`, {
	  ...options,
	  headers: mergedHeaders
	});
  
	if (!res.ok) {
	  const error = await res.json();
	  throw new Error(error.message || 'API error');
	}
  
	return res.json() as Promise<T>;
  };
  