import { schemaDashContext } from '@/context/schemadash-context/schemadash-context';
import { useContext } from 'react';

export const useSchemaDash = () => useContext(schemaDashContext);
