/**
 * Flavor of an application instance, as listed in `instance.flavors` of
 * `GET /v2/organisations/:ownerId/applications/:appId`. The values below are the ones of the real API. Three ordered
 * flavors are enough: the CLI checks flavors against its own list (`listAvailableFlavors()`), not this one.
 */
export interface RawFlavor {
  name: string;
  mem: number;
  cpus: number;
  gpus: number;
  disk: number | null;
  price: number;
  available: boolean;
  microservice: boolean;
  nice: number;
  cpuFactor: number;
  memFactor: number;
  price_id: string;
  memory: { unit: string; value: number; formatted: string };
  machine_learning: boolean;
  systemOverheadFactor: number;
}

export const FLAVOR_XS: RawFlavor = {
  name: 'XS',
  mem: 1152,
  cpus: 1,
  gpus: 0,
  disk: 0,
  price: 0.0222222222,
  available: true,
  microservice: false,
  nice: 0,
  cpuFactor: 1.0,
  memFactor: 9.745,
  price_id: 'apps.XS',
  memory: { unit: 'B', value: 1073741824, formatted: '1024 MiB' },
  machine_learning: false,
  systemOverheadFactor: 0,
};

export const FLAVOR_S: RawFlavor = {
  name: 'S',
  mem: 2048,
  cpus: 2,
  gpus: 0,
  disk: 0,
  price: 0.0444444444,
  available: true,
  microservice: false,
  nice: 0,
  cpuFactor: 2.0,
  memFactor: 10.716,
  price_id: 'apps.S',
  memory: { unit: 'B', value: 2147483648, formatted: '2048 MiB' },
  machine_learning: false,
  systemOverheadFactor: 0,
};

export const FLAVOR_M: RawFlavor = {
  name: 'M',
  mem: 4096,
  cpus: 4,
  gpus: 0,
  disk: 0,
  price: 0.1055555556,
  available: true,
  microservice: false,
  nice: 0,
  cpuFactor: 4.0,
  memFactor: 11.805,
  price_id: 'apps.M',
  memory: { unit: 'B', value: 4294967296, formatted: '4096 MiB' },
  machine_learning: false,
  systemOverheadFactor: 0,
};
