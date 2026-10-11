import { cleanConfiguration } from './model.js';
export const KEY='aerolab.structure.v1';
export function saveStructure(storage,config){storage.setItem(KEY,JSON.stringify({version:1,module:'structure',configuration:cleanConfiguration(config)}));}
export function loadStructure(storage){const raw=storage.getItem(KEY);if(!raw)throw new Error('No hay configuración guardada de Structure Lab.');const record=JSON.parse(raw);if(record.version!==1||record.module!=='structure')throw new Error('Formato estructural incompatible.');return cleanConfiguration(record.configuration);}
