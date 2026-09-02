export interface TourStep {
  /** Valor del atributo data-tour del elemento a señalar. */
  target: string;
  title: string;
  body: string;
}

export interface SpotlightTourLabels {
  next: string;
  back: string;
  skip: string;
  finish: string;
  counter: (current: number, total: number) => string;
}

export interface SpotlightTourProps {
  steps: TourStep[];
  open: boolean;
  /** Se llama al terminar, al saltar y al cerrar con Escape. */
  onFinish: () => void;
  labels: SpotlightTourLabels;
}
