export type Coordenada = {
  latitude: number;
  longitude: number;
};

export type StatusRota = "PROGRAMADA" | "EM_ANDAMENTO" | "FINALIZADA";

export type Rota = {
  id: string;
  nomeRota: string;
  origem: string;
  destino: string;
  origemCoords?: Coordenada;
  destinoCoords?: Coordenada;
  statusRota?: StatusRota;
  iniciadaEm?: string | null;
  finalizadaEm?: string | null;
  localizacaoInicio?: { latitude: number; longitude: number; accuracy?: number | null; recordedAt?: string } | null;
  localizacaoFim?: { latitude: number; longitude: number; accuracy?: number | null; recordedAt?: string } | null;
};
