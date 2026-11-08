'use client';
import { useRef, useState } from 'react';
import { PORTAL } from '../../config/constants';
export function useMutation() {
  const lock = useRef(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  async function run(task: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true;
    setPending(true);
    setMessage('');
    setSuccess(false);
    try {
      await task();
    } catch {
      setMessage(PORTAL.ERROR);
    } finally {
      lock.current = false;
      setPending(false);
    }
  }
  return { pending, message, success, setMessage, setSuccess, run };
}
