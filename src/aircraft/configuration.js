/** Aircraft v1 keeps its parameters; new controls get explicitly hypothetical defaults. */
export function decodeAircraftRecord(record, compute) {
  if (!record || record.module !== 'aircraft' || ![1,2].includes(record.version)) throw new Error('Formato Aircraft incompatible.');
  const config = record.version === 1
    ? { ...record.configuration, thrust: 1200, cdTotal: 0.05, dragMode: 'polar' }
    : { ...record.configuration };
  compute(config);
  return { configuration: config, migrated: record.version === 1 };
}
