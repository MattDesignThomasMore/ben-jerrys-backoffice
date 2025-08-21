const API =
  import.meta.env?.VITE_API_BASE_URL ||
  (location.hostname === 'localhost'
    ? 'http://localhost:5000'
    : 'https://ben-jerrys-api.onrender.com')

function getToken() {
  return localStorage.getItem('token') || ''
}

export async function apiFetch(path, options = {}) {
  if (!path.startsWith('/')) path = '/' + path

  const headers = new Headers(options.headers || {})
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const token = getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const url = `${API}${path}`

  let res
  try {
    res = await fetch(url, { ...options, headers })
  } catch (e) {
    
    throw new Error(`Netwerkfout naar ${url.split('?')[0]}`)
  }


  let data = null
  try {
    data = await res.clone().json()
  } catch {
    
  }

  if (!res.ok) {
    const msg = (data && (data.message || data.error)) || `Request faalde (${res.status})`
    throw new Error(msg)
  }

  return data ?? (await res.json())
}
