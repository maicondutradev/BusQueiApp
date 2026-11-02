export type Coordenada = {
  latitude: number;
  longitude: number;
};

export type Rota = {
  id: string;
  nomeRota: string;
  origem: string;
  destino: string;
  origemCoords?: Coordenada;
  destinoCoords?: Coordenada;
};
