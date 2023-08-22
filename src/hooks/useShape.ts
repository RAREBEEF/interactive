interface Line {
  moveTo: { x: number; y: number };
  lineTo: { x: number; y: number };
  strokeStyle: string;
  lineWidth: number;
}

interface Arc {
  x: number;
  y: number;
  radius: number;
  startAngle: number;
  endAngle: number;
  fillStyle: string;
}

interface Ellipse {
  x: number;
  y: number;
  radiusX: number;
  radiusY: number;
  rotation: number;
  startAngle: number;
  endAngle: number;
  fillStyle: string;
}

interface QuadraticCurve {
  moveTo: { x: number; y: number };
  QuadraticCurveTo: { cpx: number; cpy: number; x: number; y: number };
  strokeStyle: string;
  lineWidth: number;
}

interface FillRect {
  x: number;
  y: number;
  width: number;
  height: number;
  fillStyle: string;
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
    line: Line | null;
    arc: Arc | null;
    ellipse: Ellipse | null;
    quadraticCurve: QuadraticCurve | null;
    fillRect: FillRect | null;
    drawImage: DrawImage | null;
    ctx: CanvasRenderingContext2D | null;

    constructor({
      line = null,
      arc = null,
      ellipse = null,
      quadraticCurve = null,
      fillRect = null,
      drawImage = null,
    }: {
      line?: Line | null;
      arc?: Arc | null;
      ellipse?: Ellipse | null;
      quadraticCurve?: QuadraticCurve | null;
      fillRect?: FillRect | null;
      drawImage?: DrawImage | null;
    }) {
      this.line = line;
      this.arc = arc;
      this.ellipse = ellipse;
      this.quadraticCurve = quadraticCurve;
      this.fillRect = fillRect;
      this.drawImage = drawImage;
      this.ctx = ctx;
    }

    public draw() {
      if (!this.ctx) {
        return;
      } else if (!!this.line) {
        this.ctx.beginPath();
        this.ctx.strokeStyle = this.line.strokeStyle;
        this.ctx.lineWidth = this.line.lineWidth;
        this.ctx.moveTo(this.line.moveTo.x, this.line.moveTo.y);
        this.ctx.lineTo(this.line.lineTo.x, this.line.lineTo.y);
        this.ctx.stroke();
      } else if (!!this.arc) {
        this.ctx.beginPath();
        this.ctx.arc(
          this.arc.x,
          this.arc.y,
          this.arc.radius,
          this.arc.startAngle,
          this.arc.endAngle
        );
        this.ctx.fillStyle = this.arc.fillStyle;
        this.ctx.fill();
        this.ctx.closePath();
      } else if (!!this.ellipse) {
        this.ctx.beginPath();
        this.ctx.ellipse(
          this.ellipse.x,
          this.ellipse.y,
          this.ellipse.radiusX,
          this.ellipse.radiusY,
          this.ellipse.rotation,
          this.ellipse.startAngle,
          this.ellipse.endAngle
        );
        this.ctx.fillStyle = this.ellipse.fillStyle;
        this.ctx.fill();
        this.ctx.closePath();
      } else if (!!this.quadraticCurve) {
        this.ctx.beginPath();
        this.ctx.moveTo(
          this.quadraticCurve.moveTo.x,
          this.quadraticCurve.moveTo.y
        );
        this.ctx.quadraticCurveTo(
          this.quadraticCurve.QuadraticCurveTo.cpx,
          this.quadraticCurve.QuadraticCurveTo.cpy,
          this.quadraticCurve.QuadraticCurveTo.x,
          this.quadraticCurve.QuadraticCurveTo.y
        );
        this.ctx.strokeStyle = this.quadraticCurve.strokeStyle;
        this.ctx.lineWidth = this.quadraticCurve.lineWidth;
        this.ctx.stroke();
      } else if (!!this.fillRect) {
        this.ctx.beginPath();
        this.ctx.fillStyle = this.fillRect.fillStyle;
        this.ctx.fillRect(
          this.fillRect.x,
          this.fillRect.y,
          this.fillRect.width,
          this.fillRect.height
        );
        this.ctx.closePath();
      } else if (!!this.drawImage) {
        this.ctx.drawImage(
          this.drawImage.image,
          this.drawImage.x,
          this.drawImage.y,
          this.drawImage.width,
          this.drawImage.height
        );
      }
    }
  }

  return Shape;
};

export default useShape;
