// src/utils/api/ProcessDapps.ts
import { useEffect, useState } from 'react';
import { useStore } from '../../store/useStore';
import { fetchDappsData } from './api';


const useProcessDapps = () => {
  const { setDapps } = useStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const dappsData = await fetchDappsData();
        setDapps(dappsData);
        console.log('Final fetched dapps:', dappsData);
      } catch (err) {
        console.error('Error fetching dapps data:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [setDapps]);

  return { loading, error };
};

export default useProcessDapps;
