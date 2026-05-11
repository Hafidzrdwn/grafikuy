export const hashPassword = async (plainText) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(plainText);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const checkPassword = async (plainText) => {
  const hash = await hashPassword(plainText);
  return hash === import.meta.env.VITE_IMPORT_PASSWORD_HASH;
};

export const savePasswordToStorage = async (plainText) => {
  const hash = await hashPassword(plainText);
  localStorage.setItem('grafikuy_auth', hash);
};

export const isPasswordSaved = () => {
  const hash = localStorage.getItem('grafikuy_auth');
  return hash === import.meta.env.VITE_IMPORT_PASSWORD_HASH;
};
