import { useState } from 'react';
import { isPasswordSaved, checkPassword, savePasswordToStorage } from '@/services/passwordService';

export const useImportPassword = () => {
  const [isAuthorized, setIsAuthorized] = useState(isPasswordSaved());
  const [promptPassword, setPromptPassword] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);

  const checkAccess = () => {
    if (isPasswordSaved()) {
      setIsAuthorized(true);
      return true;
    }
    setPromptPassword(true);
    return false;
  };

  const verifyPassword = async (password) => {
    if (attempts >= 3) {
      setError("Maximum attempts reached. Try again later.");
      return false;
    }
    
    const isValid = await checkPassword(password);
    if (isValid) {
      await savePasswordToStorage(password);
      setIsAuthorized(true);
      setPromptPassword(false);
      setError('');
      return true;
    } else {
      setAttempts(a => a + 1);
      setError("Invalid password");
      return false;
    }
  };

  return { isAuthorized, promptPassword, verifyPassword, error, checkAccess, setPromptPassword };
};
