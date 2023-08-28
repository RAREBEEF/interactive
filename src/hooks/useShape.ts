interface ClearRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Line {
  moveTo: { x: number; y: number };
  lineTo: { x: number; y: number };
}

interface RadialGradient {
  x0: number;
  y0: number;
  r0: number;
  x1: number;
  y1: number;
  r1: number;
}

type ColorStops = Array<[number, string]>;

interface Arc {
  x: number;
  y: number;
  radius: number;
  startAngle: number;
  endAngle: number;
}

interface Ellipse {
  x: number;
  y: number;
  radiusX: number;
  radiusY: number;
  rotation: number;
  startAngle: number;
  endAngle: number;
}

interface QuadraticCurve {
  moveTo: { x: number; y: number };
  quadraticCurveTo: { cpx: number; cpy: number; x: number; y: number };
}

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DrawImage {
  image: CanvasImageSource;
  x: number;
  y: number;
  width: number;
  height: number;
}

const useShape = (ctx: CanvasRenderingContext2D | null) => {
  class Shape {
    ctx: CanvasRenderingContext2D | null = ctx;
    line: Line | null;
    arc: Arc | null;
    ellipse: Ellipse | null;
    quadraticCurve: QuadraticCurve | null;
    fillRect: Rect | null;
    strokeRect: Rect | null;
    drawImage: DrawImage | null;
    radialGradient: RadialGradient | null;
    colorStops: ColorStops | null;
    clearRect: ClearRect | null;
    strokeStyle: string | null;
    fillStyle: string | null;
    lineWidth: number | null;

    constructor({
      line = null,
      arc = null,
      ellipse = null,
      quadraticCurve = null,
      fillRect = null,
      strokeRect = null,
      drawImage = null,
      radialGradient = null,
      colorStops = null,
      clearRect = null,
      strokeStyle = null,
      fillStyle = null,
      lineWidth = null,
    }: {
      line?: Line | null;
      arc?: Arc | null;
      ellipse?: Ellipse | null;
      quadraticCurve?: QuadraticCurve | null;
      fillRect?: Rect | null;
      strokeRect?: Rect | null;
      drawImage?: DrawImage | null;
      radialGradient?: RadialGradient | null;
      colorStops?: ColorStops | null;
      clearRect?: ClearRect | null;
      strokeStyle?: string | null;
      fillStyle?: string | null;
      lineWidth?: number | null;
    }) {
      this.line = line;
      this.arc = arc;
      this.ellipse = ellipse;
      this.quadraticCurve = quadraticCurve;
      this.fillRect = fillRect;
      this.strokeRect = strokeRect;
      this.drawImage = drawImage;
      this.radialGradient = radialGradient;
      this.colorStops = colorStops;
      this.clearRect = clearRect;
      this.strokeStyle = strokeStyle;
      this.fillStyle = fillStyle;
      this.lineWidth = lineWidth;
    }

    public draw() {
      if (!this.ctx) return;

      const ctx = this.ctx;
      ctx.beginPath();

      let gradient: CanvasGradient | null = null;
      if (!!this.radialGradient && !!this.colorStops) {
        const { x0, y0, r0, x1, y1, r1 } = this.radialGradient;
        gradient = ctx.createRadialGradient(x0, y0, r0, x1, y1, r1);
        for (const colorStop of this.colorStops) {
          const [offset, color] = colorStop;
          gradient.addColorStop(offset, color);
        }
      }

      ctx.lineCap = "round";
      ctx.strokeStyle = this.strokeStyle || gradient || "";
      ctx.fillStyle = this.fillStyle || gradient || "";
      ctx.lineWidth = this.lineWidth || 1;

      if (!!this.clearRect) {
        const { x, y, width, height } = this.clearRect;
        ctx.clearRect(x, y, width, height);
      } else if (!!this.line) {
        const {
          moveTo: { x: moveX, y: moveY },
          lineTo: { x: lineX, y: lineY },
        } = this.line;
        ctx.moveTo(moveX, moveY);
        ctx.lineTo(lineX, lineY);
        ctx.stroke();
      } else if (!!this.arc) {
        const { x, y, radius, startAngle, endAngle } = this.arc;
        ctx.arc(x, y, radius, startAngle, endAngle);
        ctx.fill();
      } else if (!!this.ellipse) {
        const { x, y, radiusX, radiusY, rotation, startAngle, endAngle } =
          this.ellipse;
        ctx.ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle);
        ctx.fill();
      } else if (!!this.quadraticCurve) {
        const {
          moveTo: { x: moveX, y: moveY },
          quadraticCurveTo: { cpx, cpy, x, y },
        } = this.quadraticCurve;
        ctx.moveTo(moveX, moveY);
        ctx.quadraticCurveTo(cpx, cpy, x, y);
        ctx.stroke();
      } else if (!!this.fillRect) {
        const { x, y, width, height } = this.fillRect;
        ctx.fillRect(x, y, width, height);
      } else if (!!this.strokeRect) {
        const { x, y, width, height } = this.strokeRect;
        ctx.strokeRect(x, y, width, height);
      } else if (!!this.drawImage) {
        const { image, x, y, width, height } = this.drawImage;
        ctx.drawImage(image, x, y, width, height);
      }

      ctx.closePath();
    }
  }

  return Shape;
};

export default useShape;
