export type StatusLembrete = "Agendado" | "Cancelado" | "Publicado";

export type Lembrete = {
  id: string;
  title: string;
  message: string;
  when: number; // milissegundos desde epoch
  status: StatusLembrete;
  notificationId?: string;
  rotaId?: string;
  rotaNome?: string;
  criadoEm: number;
};

