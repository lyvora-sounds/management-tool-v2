export interface GuidePointerProps {
  /** Valor del atributo data-guide del elemento a señalar. */
  target: string;
  title: string;
  body: string;
  /** Texto del botón que cierra la ayuda. */
  cta: string;
  onDismiss: () => void;
}
